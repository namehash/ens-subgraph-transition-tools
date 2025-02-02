import { gql } from "@urql/core";

export const WrappedDomainsQuery = gql`
  query WrappedDomains($first: Int!, $skip: Int!) {
    items: wrappedDomains(first: $first, skip: $skip) {
      id
      domain { id }
      expiryDate
      fuses
      owner { id }
      name
    }
  }
`;
