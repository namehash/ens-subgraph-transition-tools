# indexer-eq-tools

## snapshot equivalency tool (`snapshot-eq`)

commands:
- `index subgraph <blockheight>`
- `index ponder <blockheight>`
- `diff <blockheight>`

to index the subgraph or ponder at a specific blockheight, the tool runs an exhaustive set of graphql queries, using the subgraph as source of truth. for each generated query, the idempotent results are stored as json files in `snapshots/[:node]/[:blocknum]/[:queryhash].json`

## proxy equivalency tool (`proxy-eq`)

this tool acts as a (subgraph) api endpoint, proxying queries between the subgraph and a ponder indexer. it can query against each of them during real-time indexing. first it queries the ponder indexer, including the meta field to indicate which block it has indexed up to. it then injects that block number into the subgraph query, in order to ensure that each indexer is operating on the same blockheight. upon receiving the results from each, it diffs their responses, throwing a graphql (or http?) error. in a 'production' mode, the errors could be surfaced asynchronously (and the subgraph's response returned) in order to accumulate queries that don't produce identical results.

We can fork ensjs and ens-app-v3, point their clients at this proxy api, and ensure that:
a: the tests pass
b: playing around with the app and generating real-world responses produces no diffs

## shared lib

- deterministic keying of graphql queries (inc args)
  - to support idempotency + saving of responses to disk
- deterministic comparison of json response
- graphql runtime tooling to inject block argument into subgraph queries

