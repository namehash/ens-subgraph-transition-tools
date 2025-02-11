import { gql } from "@urql/core";

export const RegistrationsQuery = gql`
  query Registrations($first: Int!, $skip: Int!) {
    items: registrations(first: $first, skip: $skip) {
      id
      domain { id }
      registrationDate
      expiryDate
      cost
      registrant { id }
      labelName

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
