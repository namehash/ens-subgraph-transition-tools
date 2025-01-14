import { gql } from "@urql/core";

export const AccountsQuery = gql`
  query Accounts($first: Int!, $skip: Int!) {
    accounts(first: $first, skip: $skip) {
      id
    }
  }
`;
