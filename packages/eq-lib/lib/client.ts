import { Client, fetchExchange } from "@urql/core";
import { retryExchange } from "@urql/exchange-retry";

export const makeClient = (url: string) =>
	new Client({
		url,
		exchanges: [retryExchange({}), fetchExchange],
		requestPolicy: "network-only",
	});
