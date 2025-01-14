import { gql } from "@urql/core";

export const ResolversQuery = gql`
  query Resolvers($first: Int!, $skip: Int!) {
    resolvers(first: $first, skip: $skip) {
      id
      domain { id }
      address
      addr { id }
      contentHash
      texts
      coinTypes
    }
  }
`;
