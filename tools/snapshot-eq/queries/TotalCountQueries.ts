import { gql } from "@urql/core";

export const DomainsTotalCountQuery = gql`
  query Domains($first: Int!, $skip: Int!) {
    domains(first: $first, skip: $skip) {
      id
    }
  }
`;

export const AccountsTotalCountQuery = gql`
  query Accounts($first: Int!, $skip: Int!) {
    accounts(first: $first, skip: $skip) {
      id
    }
  }
`;

export const RegistrationsTotalCountQuery = gql`
  query Registrations($first: Int!, $skip: Int!) {
    registrations(first: $first, skip: $skip) {
      id
    }
  }
`;

export const ResolversTotalCountQuery = gql`
  query Resolvers($first: Int!, $skip: Int!) {
    resolvers(first: $first, skip: $skip) {
      id
    }
  }
`;

export const WrappedDomainsTotalCountQuery = gql`
  query WrappedDomains($first: Int!, $skip: Int!) {
    wrappedDomains(first: $first, skip: $skip) {
      id
    }
  }
`;
