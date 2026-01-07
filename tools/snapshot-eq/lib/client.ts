import { Client, cacheExchange, fetchExchange } from "@urql/core";
import { retryExchange } from "@urql/exchange-retry";

export function makeClient(url: string): Client {
	return new Client({
		url,
		exchanges: [
			cacheExchange,
			retryExchange({
				maxNumberAttempts: 5,
			}),
			fetchExchange,
		],
	});
}
