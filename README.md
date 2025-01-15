# ens-subgraph-transition-tools

This project provides a suite of tools for verifying that [ENSNode](https://github.com/namehash/ensnode) is a reliable replacement for the ENS Subgraph when performing subgraph queries through `ensjs`.

### todo

- [ ] resolver.addr (and therefore Domain.resolvedAddress) is null in many (but not all) cases
  - seems that resolver factory events aren't being indexed, inc. the former public resolver `0x1da022710df5002339274aadee8d58218e9d6ab5`
- [ ] enforce static order with `orderBy: id`, dependent on orderBy enum support in ENSNode
- [ ] include snapshots, as git LFS or zip somewhere
- [ ] add events top-level queries
- [ ] configure tools index's as bin for simpler calling

## snapshot equivalency tool (`snapshot-eq`)

> this tool appoximates a database dump & diff, but via the graphql api. it iterates over relevant top-level collection queries, paginating over all records compares their responses to highlight discrepancies.

configure via env variables or `.env.local` at root of project or inline
- `PONDER_API_URL`
- `SUBGRAPH_API_KEY`

commands:
- `bun run start -- --help`
- `bun run start -- snapshot <blockheight> <ponder|subgraph>`
  - takes a 'snapshot' of the indexer at the provided blockheight by iterating over `n` collection queries
    - persists responses to `snapshots/[:blockheight]/[:indexer]/[:operationKey].json`
  - if ponder, code enforces that the indexer is ready at that blockheight
  - if subgraph, timetravel queries are used
- `bun run start -- clean <blockheight> <ponder|subgraph>`
  - deletes the `snapshots/[:blockheight]/[:indexer]/` directory to bust the snapshot cache
- `diff <blockheight>`
  - using subgraph responses as the source of truth, compares the snapshots at `snapshots/[:blockheight]/subgraph/*.json` wtih those at `snapshots/[:blockheight]/ponder/*.json` and prints the differences between them to assist with debugging

### description

to index the subgraph or ENSNode at a specific blockheight, the tool runs an exhaustive set of graphql queries, using the subgraph as source of truth. for each generated query, the idempotent results are stored as json files in `snapshots/[:blockheight]/[:indexer]/[:operationKey].json` which can be compared using the `diff` command.

an `operationKey` is a [deterministic hash of a graphql document + variables](https://commerce.nearform.com/open-source/urql/docs/basics/document-caching/#operation-keys), an implementation detail from `urql`

for the subgraph, [timetravel queries](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/#time-travel-queries) are used to retrieve data at a specific blockheight.

for ENSNode, timetravel is not supported, so the Ponder indexer inside ENSNode should be run until the specified `endBlock` and then snapshotted with this tool. in the future this may be automated, but currently the tool just enforces this context and relies on the user to run the `ensnode` project in parallel.

## api equivalency tool (`api-eq`)

> This tool verifies equivalency in API responses between the ENS Subgraph and ENSNode for any subgraph query that might be produced by ensjs by comparing results from live queries in realtime.

this tool acts as a (subgraph) api endpoint, proxying queries between the subgraph and ENSNode. it can query against each of them during real-time indexing. first it queries ENSNode, including the meta field to indicate which block it has indexed up to. it then injects that block number into the subgraph query, waiting until the subgraph has indexed that block, in order to ensure that each indexer is operating on the same blockheight. upon receiving the results from each, it diffs their responses, throwing a graphql (or http?) error. in a 'production' mode, the errors could be surfaced asynchronously (and the subgraph's response returned) in order to accumulate queries that don't produce identical results.

We can fork ensjs and ens-app-v3, point their clients at this proxy api, and ensure that:
a: the tests pass
b: playing around with the app and generating real-world responses produces no diffs

## shared lib

- deterministic keying of graphql queries (inc args)
  - to support idempotency + saving of responses to disk
  - 'operation key'
- deterministic comparison of json response
- graphql runtime tooling to inject block argument into subgraph queries

