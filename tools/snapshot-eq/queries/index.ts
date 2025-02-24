import type { TypedDocumentNode } from "@urql/core";
import { AccountsQuery } from "./AccountsQuery";
import { DomainsQuery } from "./DomainsQuery";
import { RegistrationsQuery } from "./RegistrationsQuery";
import { ResolversQuery } from "./ResolversQuery";
import {
	AccountsTotalCountQuery,
	DomainsTotalCountQuery,
	RegistrationsTotalCountQuery,
	ResolversTotalCountQuery,
	WrappedDomainsTotalCountQuery,
} from "./TotalCountQueries";
import { WrappedDomainsQuery } from "./WrappedDomainsQuery";

export const ALL_QUERIES: [TypedDocumentNode, TypedDocumentNode][] = [
	[DomainsQuery, DomainsTotalCountQuery],
	[AccountsQuery, AccountsTotalCountQuery],
	[ResolversQuery, ResolversTotalCountQuery],
	[RegistrationsQuery, RegistrationsTotalCountQuery],
	[WrappedDomainsQuery, WrappedDomainsTotalCountQuery],
];
