import { Client, fetchExchange } from "@urql/core";

export const makeClient = (url: string) =>
	new Client({
		url,
		exchanges: [fetchExchange],
		requestPolicy: "network-only",
	});
