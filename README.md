# ENS Subgraph Transition Tools

This project provides a suite of tools for verifying that [ENSNode](https://github.com/namehash/ensnode) is a reliable replacement for the ENS Subgraph.

- **Snapshot Equivalency Tool**: 1:1 data
- **API Equivalency Tool**: 1:1 API responses

## Snapshot Equivalency Tool (`snapshot-eq`)

> appoximates a database dump & diff, but via the graphql api: it iterates over relevant top-level collection queries, paginating over all records compares their responses to highlight discrepancies.

configure via env variables or `.env.local` at root of project:
- `ENSNODE_API_URL` — ex: `http://localhost:42069`
  - must be an ENSNode instance that provies a ponder-native api endpoint at `/ponder` and a subgraph-compatible endpoint at `/subgraph`
- `SUBGRAPH_API_KEY`
  - https://thegraph.com/studio/apikeys
- `DATABASE_URL`
  - used for `CLUSTER`ing an ENSIndexer index before snapshotting, same value as ENSIndexer's `DATABASE_URL`

commands, (run from `tools/snapshot-eq`):
- `bun start --help`
- `bun start snapshot <blockheight> <ensnode|subgraph> [--deployment=(mainnet|sepolia|holesky)]`
  - takes a 'snapshot' of the indexer at the provided blockheight by iterating over all pages of resources, persisting responses to `snapshots/`
  - if ensnode, code waits for the indexer to be ready at that blockheight and CLUSTERs the `public` schema
  - if subgraph, timetravel queries are used to fetch data
- `bun start clean <blockheight> <ensnode|subgraph> [--deployment=(mainnet|sepolia|holesky)]`
  - deletes the specific `snapshots/` directory
- `bun start diff <blockheight> [--deployment=(mainnet|sepolia|holesky)]`
  - using subgraph responses as the source of truth, compares snapshots and prints any differences between them

### Snapshot Example Usage

These commands will snapshot ENSNode configured with the eth plugin reading from the mainnet ENS deployment, producing a 1:1 Subgraph-compatible index.

```bash
# 1. have ENSNode running with ENSIndexer like so:
DATABASE_SCHEMA=public \
ENS_DEPLOYMENT_CHAIN=mainnet \
ACTIVE_PLUGINS=eth \
HEAL_REVERSE_ADDRESSES=false \
END_BLOCK=21921222 \
pnpm run start

# 2. snapshot tool will wait for ENSNode to be at that block, CLUSTER it, and snapshot it
ENSNODE_URL=http://localhost:42069 \
DATABASE_URL=postgresql://postgres:password@127.0.0.1/ponder \
bun start snapshot --deployment mainnet ensnode 21921222

# 3. acquire subgraph snapshot via Snapshot Archives (below) OR snapshot it yourself:
SUBGRAPH_API_KEY=xyz \
bun start snapshot --deployment mainnet subgraph 21921222

# 4. diff the two snapshots
bun start diff --deployment mainnet 21921222
```

### Snapshot Archives

🚧 WIP

TODO: snapshot upload/download via public R2

### Description

To index the subgraph or ENSNode at a specific blockheight, the tool runs an exhaustive set of graphql queries, using the subgraph as source of truth. for each generated query, the idempotent results are stored as json files in `snapshots/[:deployment]/[:blockheight]/[:indexer]/[:OperationName]_[:skip]_[:operationKey].json` which can be compared using the `diff` command.

an `operationKey` is a [deterministic hash of a graphql document + variables](https://commerce.nearform.com/open-source/urql/docs/basics/document-caching/#operation-keys), an implementation detail from `urql`

for the subgraph, [timetravel queries](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/#time-travel-queries) are used to retrieve data at a specific blockheight.

for ENSNode, timetravel is not supported, so ENSIndexer should be run until the specified `endBlock` and then snapshotted with this tool.

## api equivalency tool (`api-eq`)

🚧 WIP

> This tool verifies equivalency in API responses between the ENS Subgraph and ENSNode by comparing results from live queries in realtime.

### Description

This tool acts as a drop-in replacement for the subgraph URL in any project. When your app queries this endpoint, it first fetches the result from ENSNode, including the meta field to indicate which block the data is valid at. It then injects that block number into the subgraph query, waiting until the subgraph has indexed that block, in order to ensure that each indexer is operating on the same blockheight. Upon receiving the results from each, it diffs their responses, throwing a graphql error highlighting any discrepancies. In a 'production' mode, the errors could be surfaced asynchronously (and the subgraph's response returned) in order to accumulate queries that don't produce identical results.
