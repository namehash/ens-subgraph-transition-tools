# indexer-eq-tools

This project provides a suite of tools for verifying that the `ens-multichain-indexer` is a reliable replacement for the ENS Subgraph when performing subgraph queries through `ensjs`.

### todo

- [ ] include snapshots, as git LFS or zip somewhere
- [ ] implement yargs for parsing command args
- [ ] implement retryExchange and remove sleep code
- [ ] implement all top-level collection queries
- [ ] implement diff command

## snapshot equivalency tool (`snapshot-eq`)

> this tool appoximates a database dump & diff, but via the graphql api. it iterates over relevant top-level collection queries, paginating over all records compares their responses to highlight discrepancies.

commands:
- `snapshot subgraph <blockheight>`
- `snapshot ponder <blockheight>`
- `diff <blockheight>`

to index the subgraph or ponder at a specific blockheight, the tool runs an exhaustive set of graphql queries, using the subgraph as source of truth. for each generated query, the idempotent results are stored as json files in `snapshots/[:blockheight]/[:indexer]/[:operationKey].json` which can be compared using the `diff` command.

an `operationKey` is a [deterministic hash of a graphql document + variables](https://commerce.nearform.com/open-source/urql/docs/basics/document-caching/#operation-keys), an implementation detail from `urql`

for the subgraph, [timetravel queries](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/#time-travel-queries) are used to retrieve data at a specific blockheight.

for ponder, timetravel is not supported, so the ponder indexer should be run until the specified `endBlock` and then snapshotted with this tool. in the future this may be automated, but currently the tool just enforces this context and relies on the user to run the `ens-multichain-indexer` project in parallel.

## api equivalency tool (`api-eq`)

> This tool verifies equivalency in API responses between the ENS Subgraph and the ens-multichain-indexer for any subgraph query that might be produced by ensjs by comparing results from live queries in realtime.

this tool acts as a (subgraph) api endpoint, proxying queries between the subgraph and a ponder indexer. it can query against each of them during real-time indexing. first it queries the ponder indexer, including the meta field to indicate which block it has indexed up to. it then injects that block number into the subgraph query, waiting until the subgraph has indexed that block, in order to ensure that each indexer is operating on the same blockheight. upon receiving the results from each, it diffs their responses, throwing a graphql (or http?) error. in a 'production' mode, the errors could be surfaced asynchronously (and the subgraph's response returned) in order to accumulate queries that don't produce identical results.

We can fork ensjs and ens-app-v3, point their clients at this proxy api, and ensure that:
a: the tests pass
b: playing around with the app and generating real-world responses produces no diffs

## shared lib

- deterministic keying of graphql queries (inc args)
  - to support idempotency + saving of responses to disk
  - 'operation key'
- deterministic comparison of json response
- graphql runtime tooling to inject block argument into subgraph queries

