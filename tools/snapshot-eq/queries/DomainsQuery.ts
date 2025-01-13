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
      # TODO: re-enable after https://github.com/namehash/ens-multichain-indexer/issues/25
      # resolvedAddress { id }
      resolver { id }
      ttl
      isMigrated
      createdAt
      owner { id }
      registrant { id }
      wrappedOwner { id }
      expiryDate
    }
  }
`;
