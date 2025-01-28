import { gql } from "@urql/core";

export const RegistrationsQuery = gql`
  query Registrations($first: Int!, $skip: Int!) {
    registrations(first: $first, skip: $skip) {
      id
      domain { id }
      registrationDate
      expiryDate
      cost
      registrant { id }
      # TODO: add back once we have label healing
      # labelName

      events {
        __typename
        id
        blockNumber
        transactionID
        ... on NameRegistered {
          registrant {
            id
          }
          expiryDate
        }
        ... on NameRenewed {
          expiryDate
        }
        ... on NameTransferred {
          newOwner {
            id
          }
        }
      }
    }
  }
`;
