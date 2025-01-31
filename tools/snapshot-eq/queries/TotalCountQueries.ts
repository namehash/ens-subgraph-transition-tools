import { gql } from "@urql/core";

export const DomainsTotalCountQuery = gql`
  query Domains($first: Int!, $skip: Int!) {
    items: domains(first: $first, skip: $skip) {
      id
    }
  }
`;

export const AccountsTotalCountQuery = gql`
  query Accounts($first: Int!, $skip: Int!) {
    items: accounts(first: $first, skip: $skip) {
      id
    }
  }
`;

export const RegistrationsTotalCountQuery = gql`
  query Registrations($first: Int!, $skip: Int!) {
    items: registrations(first: $first, skip: $skip) {
      id
    }
  }
`;

export const ResolversTotalCountQuery = gql`
  query Resolvers($first: Int!, $skip: Int!) {
    items: resolvers(first: $first, skip: $skip) {
      id
    }
  }
`;

export const WrappedDomainsTotalCountQuery = gql`
  query WrappedDomains($first: Int!, $skip: Int!) {
    items: wrappedDomains(first: $first, skip: $skip) {
      id
    }
  }
`;
