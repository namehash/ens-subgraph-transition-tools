import { diff as _diff, atomizeChangeset, type IAtomicChange } from "json-diff-ts";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const diff = (a: unknown, b: unknown) =>
	atomizeChangeset(_diff(a, b, { treatTypeChangeAsReplace: true }));

const TEXT_KEYS = [
	"url",
	"avatar",
	"header",
	"description",
	"email",
	"com.twitter",
	"com.farcaster",
	"com.github",
];

const COIN_TYPES = [60, 2147492101, 2147542792, 2147483658, 2147525809, 2148018000];

// biome-ignore lint/style/noNonNullAssertion: shhh
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY!;
// biome-ignore lint/style/noNonNullAssertion: shhh
const ENSNODE_URL = process.env.ENSNODE_URL!;

const publicClient = createPublicClient({
	chain: mainnet,
	transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
});

interface TimedResult<T> {
	data: T;
	duration: number;
}

interface RecordsResponse {
	addresses: Record<string, string | null>;
	texts: Record<string, string | null>;
}

interface LookupResult {
	accelerated: TimedResult<RecordsResponse>;
	unaccelerated: TimedResult<RecordsResponse>;
	universalResolver: TimedResult<RecordsResponse>;
	diffs: {
		accelerated: IAtomicChange[];
		unaccelerated: IAtomicChange[];
	};
}

/**
 * Fetch ENS records from ENSNode API
 */
async function resolveWithENSNode(
	name: string,
	accelerate: boolean,
): Promise<TimedResult<RecordsResponse>> {
	const url = `${ENSNODE_URL}/api/resolve/records/${name}?${new URLSearchParams({
		addresses: COIN_TYPES.join(","),
		texts: TEXT_KEYS.join(","),
		accelerate: accelerate ? "true" : "false",
	})}`;
	const start = performance.now();
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(
			`ENSNode API failed:\nURL: ${url} \nStatus: ${response.status}\nBody: ${await response.text()}`,
		);
	}

	const data = await response.json();
	const end = performance.now();

	if (data.accelerationRequested !== accelerate) {
		throw new Error(`ENSNode didn't get the memo?`);
	}

	if (accelerate && !data.accelerationAttempted) {
		throw new Error(`ENSNode did not accelerate this request, perhaps it is too far behind.`);
	}

	return {
		data: data.records,
		duration: end - start,
	};
}

/**
 * Fetch ENS records using Viem Universal Resolver
 */
async function resolveWithUniversalResolver(name: string): Promise<TimedResult<RecordsResponse>> {
	const start = performance.now();

	const textPromises = TEXT_KEYS.map(async (key) => {
		try {
			const value = await publicClient.getEnsText({
				name,
				key,
			});
			return { key, value };
		} catch {
			return { key, value: null };
		}
	});

	// Fetch all address records in parallel (viem will multicall them)
	const addressPromises = COIN_TYPES.map(async (coinType) => {
		try {
			const value = await publicClient.getEnsAddress({
				name,
				coinType,
			});
			return { coinType, value };
		} catch {
			return { coinType, value: null };
		}
	});

	// multicalled
	const [textResults, addressResults] = await Promise.all([
		Promise.all(textPromises),
		Promise.all(addressPromises),
	]);

	const end = performance.now();

	// Convert results to the same format as ENSNode APIs
	const texts: Record<string, string | null> = {};
	for (const { key, value } of textResults) {
		texts[key] = value;
	}

	const addresses: Record<string, string | null> = {};
	for (const { coinType, value } of addressResults) {
		addresses[String(coinType)] = value;
	}

	return {
		data: { addresses, texts },
		duration: end - start,
	};
}

/**
 * Perform all three ENS lookups and compare results
 */
export async function resolveRecords(name: string): Promise<LookupResult> {
	const [accelerated, unaccelerated, universalResolver] = await Promise.all([
		resolveWithENSNode(name, true),
		resolveWithENSNode(name, false),
		resolveWithUniversalResolver(name),
	]);

	return {
		accelerated,
		unaccelerated,
		universalResolver,
		diffs: {
			accelerated: diff(universalResolver.data, accelerated.data),
			unaccelerated: diff(universalResolver.data, unaccelerated.data),
		},
	};
}
