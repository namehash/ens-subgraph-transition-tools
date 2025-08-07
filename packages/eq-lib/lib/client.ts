import { Client, fetchExchange } from "@urql/core";
import { retryExchange } from "@urql/exchange-retry";

export const makeClient = (url: string) =>
	new Client({
		url,
		exchanges: [
			retryExchange({
				initialDelayMs: 1000,
				maxDelayMs: 60_000,
				randomDelay: true,
				maxNumberAttempts: Number.POSITIVE_INFINITY,
				retryIf: (error) => {
					console.error("[URQL client] Retrying due to error:", error);
					return !!(error.graphQLErrors.length > 0 || error.networkError);
				},
			}),
			fetchExchange,
		],
		requestPolicy: "network-only",
	});
