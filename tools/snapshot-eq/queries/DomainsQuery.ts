import { gql } from "@urql/core";

export const DomainsQuery = gql`
  query Domains($first: Int!, $skip: Int!) {
    items: domains(first: $first, skip: $skip, orderBy: id) {
      id
      name
      labelName
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
      registration { id }
      wrappedDomain { id }
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
        # NOTE: we ignore selecting resolver { id } on NewResolver events because there's a bug in
        # the subgraph graphql typing (Resolver!) that is invalid at runtime (some NewResolver events
        # include a primary key (resolverId = zeroAddress) for which there is no Resolver record).
        # see ensnode's handlers/Registry.ts for a full discussion
        #
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
