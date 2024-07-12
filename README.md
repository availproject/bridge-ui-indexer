# Avail bridge UI Indexer service

## Introduction
The Avail Bridge UI Indexer is a powerful tool designed to seamlessly index transactions related to bridges between Ethereum and Avail. It efficiently maps transactions between the two chains and updates transaction statuses to "READY_TO_CLAIM," enabling users to conveniently claim their transactions on the destination chain.

## Key Features
Transaction Indexing: The indexer tracks and indexes bridge-related transactions between Ethereum and Avail, capturing essential send and receive events from the Avail bridge contract on Ethereum for accurate transaction mapping.

Status Updates: Transactions are promptly updated to "READY_TO_CLAIM" status, facilitating user access for claiming transactions on the destination chain.


## Subgraph Integration

1. Ethereum Chain: Leveraging a dedicated subgraph, the indexer meticulously indexes send and receive events from the Avail bridge contract on the Ethereum chain. Detailed information on the subgraph can be accessed [here](./subgraph/).

2. Avail Chain: Utilizing a subquery, the indexer efficiently indexes all bridge-related extrinsics and events on the Avail chain. These indexed data are then decoded and stored in the database according to specific requirements.

This comprehensive indexing solution ensures smooth interoperability between Ethereum and Avail chains, enhancing user experience and transaction accessibility.


## Endpoints

### Transaction Listing: The indexer exposes an endpoint enabling the UI to retrieve a list of transactions based on user addresses.

```
endpoint = `${base_url}/transactions`

query_params = {
    page: 0, // nullable
    pageSize: 100, // nullable
    sourceChain: 'AVAIL' // 'ETHEREUM' nullable
    destinationChain: 'ETHEREUM' // 'AVAIL' nullable
    status: 'BRIDGED' // 'READY_TO_CLAIM', 'CLAIMED' nullable
    userAddress: '0xe985ea00abb8e75a49db934dc024b62b09c1dfa3' // nullable
}
```

### Proof API: Users can submit proof via the provided API while claiming transactions.

```
// when proof is required to claim on Avail
endpoint = `${base_url}/proof/avl`

query_params = {
    blockHash: "0xabc", // blockHash on ethereum
    messageId: 4 // messageId for send transaction on ethereum
}
```

```
// when proof is required to claim on Ethereum
endpoint = `${base_url}/proof/eth`

query_params = {
    blockHash: "0xabc", // blockHash on avail
    transactionIndex: 4 // transaction index for send transaction on avail
}
```


## Prerequisite

- For running this service, make sure you've got the mongo installed and running.

- Create `.env` file in all the packages with corresponding fields as present in `.env.example` files in corresponding directories.

- Download all module dependencies by running
```bash
npm install
```

## Database

- This service uses postgres as DB. download postgres and run it.

- Generate Prisma files
```bash
npm run prisma:generate
```

- Push to prisma
```bash
npm run prisma:push
```

## Running

- Start the server using 
```bash
npm run start
```

- Start the server using nodemon
```bash
npm run start:dev
```

## Deploying Subgraphs
To work and deploy subgraphs:

1. Generate `subgraph.yaml` file according to desired network:

```
$ cd subgraph
$ NETWORK=<devnet|testnet|mainnet> npm run prepare
```

2. Compare and validate generated `subgraph.yaml` against subgraph/config/<NETWORK>.json (**Bridge contract address and start block only**)

3. Deploy the subgraph on Alchemy and wait for it to sync.

```
$ cd subgraph
$ NETWORK=<devnet|testnet|mainnet> SUBGRAPH_VERSION=v0.x.x DEPLOY_KEY=<REDACTED> npm run deploy
```

**Notes:**
> 1. Pick only 1 network per deploy
> 2. You may not follow [semver](https://semver.org/) but it's not recommended
> 3. DEPLOY_KEY secret is stored on Bitwarden  (Alchemy's creds on Bridge Collection)
