# ens-subgraph-transition-tools

This project provides a suite of tools for verifying that [ENSNode](https://github.com/namehash/ensnode) is a reliable replacement for the ENS Subgraph when performing subgraph queries through `ensjs`.

## snapshot equivalency tool (`snapshot-eq`)

> this tool appoximates a database dump & diff, but via the graphql api. it iterates over relevant top-level collection queries, paginating over all records compares their responses to highlight discrepancies.

configure via env variables or `.env.local` at root of project or inline
- `ENSNODE_API_URL` — ex: `http://localhost:42069`
  - must be an ENSNode instance that provies a ponder-native api endpoint at `/` and a subgraph-compatible endpoint at `/subgraph`
- `SUBGRAPH_API_KEY`
  - https://thegraph.com/studio/apikeys

commands, (run from the root of the project):
- `bun snapshot-eq --help`
- `bun snapshot-eq snapshot <blockheight> <ponder|subgraph>`
  - takes a 'snapshot' of the indexer at the provided blockheight by iterating over `n` collection queries
    - persists responses to `snapshots/[:blockheight]/[:indexer]/[:operationKey].json`
  - if ponder, code enforces that the indexer is ready at that blockheight
  - if subgraph, timetravel queries are used
- `bun snapshot-eq clean <blockheight> <ponder|subgraph>`
  - deletes the `snapshots/[:blockheight]/[:indexer]/` directory to bust the snapshot cache
- `diff <blockheight>`
  - using subgraph responses as the source of truth, compares the snapshots at `snapshots/[:blockheight]/subgraph/*.json` wtih those at `snapshots/[:blockheight]/ponder/*.json` and prints the differences between them to assist with debugging

### description

to index the subgraph or ENSNode at a specific blockheight, the tool runs an exhaustive set of graphql queries, using the subgraph as source of truth. for each generated query, the idempotent results are stored as json files in `snapshots/[:blockheight]/[:indexer]/[:operationKey].json` which can be compared using the `diff` command.

an `operationKey` is a [deterministic hash of a graphql document + variables](https://commerce.nearform.com/open-source/urql/docs/basics/document-caching/#operation-keys), an implementation detail from `urql`

for the subgraph, [timetravel queries](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/#time-travel-queries) are used to retrieve data at a specific blockheight.

for ENSNode, timetravel is not supported, so the Ponder indexer inside ENSNode should be run until the specified `endBlock` and then snapshotted with this tool. in the future this may be automated, but currently the tool just enforces this context and relies on the user to run the `ensnode` project in parallel.

### Snapshot Archives

Snapshots are available in our [releases](https://github.com/namehash/ens-subgraph-transition-tools/releases) if you'd like to download and diff them yourself.

To do so, follow the following

```bash
# download ponder snapshot to snapshot-exports
wget -P snapshot-exports <url/for/blockheight-ponder.zip>
# download subgraph snapshot to snapshot-exports
wget -P snapshot-exports <url/for/blockheight-subgraph.zip>

# unzips to snapshots/[:blockheight]/ponder/
bun snapshot-eq import 21000000 ponder

# unzips to snapshots/[:blockheight]/subgraph/
bun snapshot-eq import 21000000 subgraph

# diff the two snapshots
bun snapshot-eq diff 21000000
```

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

