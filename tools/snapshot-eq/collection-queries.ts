import { gql } from "@urql/core";

const AllDomainFields = gql`
fragment AllDomainFields on Domain {
  id
  # TODO: re-enable name and labelName once label healing is integrated into ponder
  # name
  # labelName
  labelhash
  parent { id }
  subdomainCount
  resolvedAddress
  resolver { id }
  ttl
  isMigrated
  createdAt
  owner { id }
  registrant { id }
  wrappedOwner { id }
  expiryDate
}
`;

export const DOMAINS_QUERY = gql`
  query Domains($first: Int!, $skip: Int!) {
    domains(first: $first, skip: $skip) {
      ...AllDomainFields
    }
  }

  ${AllDomainFields}
`;

export const ALL_QUERIES = [DOMAINS_QUERY];
