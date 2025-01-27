import { gql } from "@urql/core";

export const DomainsQuery = gql`
  query Domains($first: Int!, $skip: Int!) {
    domains(first: $first, skip: $skip) {
      id
      # TODO: re-enable name and labelName once label healing is integrated into ponder
      # name
      # labelName
      labelhash
      parent { id }
      subdomainCount
      resolvedAddress { id }
      resolver { id }
      ttl
      isMigrated
      createdAt
      owner { id }
      registrant { id }
      wrappedOwner { id }
      expiryDate

      events {
        __typename
        id
        blockNumber
        transactionID
        ... on Transfer {
          owner {
            id
          }
        }
        ... on NewOwner {
          owner {
            id
          }
        }
        # NOTE: we ignore selecting resolver { id } on NewResolver events because of the bug in the
        # subgraph described in handlers/Registry.ts
        # ... on NewResolver {
        #   resolver {
        #     id
        #   }
        # }
        ... on NewTTL {
          ttl
        }
        ... on WrappedTransfer {
          owner {
            id
          }
        }
        ... on NameWrapped {
          fuses
          expiryDate
          owner {
            id
          }
        }
        ... on NameUnwrapped {
          owner {
            id
          }
        }
        ... on FusesSet {
          fuses
        }
        ... on ExpiryExtended {
          expiryDate
        }
      }
    }
  }
`;
