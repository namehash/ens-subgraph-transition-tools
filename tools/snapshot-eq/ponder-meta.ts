import { gql } from "@urql/core";

export const PonderMeta = gql<{
	_meta: {
		status: Record<
			string,
			{
				ready: boolean;
				block: { number: number; timestamp: number };
			}
		>;
	};
}>`
query Meta {
  _meta {
    status
  }
}
`;
