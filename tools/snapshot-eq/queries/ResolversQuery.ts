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

      events {
        __typename
        id
        blockNumber
        transactionID
        ... on AddrChanged {
          addr {
            id
          }
        }
        ... on MulticoinAddrChanged {
          coinType
          multiaddr: addr
        }
        ... on NameChanged {
          name
        }
        ... on AbiChanged {
          contentType
        }
        ... on PubkeyChanged {
          x
          y
        }
        ... on TextChanged {
          key
          value
        }
        ... on ContenthashChanged {
          hash
        }
        ... on InterfaceChanged {
          interfaceID
          implementer
        }
        ... on AuthorisationChanged {
          owner
          target
          isAuthorized
        }
        ... on VersionChanged {
          version
        }
      }
    }
  }
`;
