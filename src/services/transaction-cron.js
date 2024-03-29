import config from '../config/index.js';
import { Transaction } from '../models/transactions.js';
import { TRANSACTION_STATUS, CHAIN, DATA_TYPE } from '../config/constants.js';
import { request, gql } from 'graphql-request';
import { getParsedTxDataFromAbiDecoder, decodeReceiveAVAIL } from '../helpers/decoder.js';
import AvailBridgeAbi from '../config/AvailBridge.js';
import AbiCoder from "web3-eth-abi";
import axios from 'axios';
import { encodeAddress } from '@polkadot/keyring';

const getSendMessageTxFromEthSubgraph = async (startBlockNumber) => {
    try {
        const limit = 1000;
        const direction = 'asc';
        const sortBy = 'block';
        const query = gql`query{
            sendMessages(first:${limit}, where:{ block_gt: ${startBlockNumber} }, orderDirection:${direction}, orderBy:${sortBy}) {
                id,
                from,
                to,
                messageId,
                logIndex,
                transactionHash,
                block,
                blockHash,
                timestamp,
                input,
          }
        }`;
        const resp = await request(config.ETHEREUM_SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getReceiveMessageTxFromEthSubgraph = async (startBlockNumber) => {
    try {
        const limit = 1000;
        const direction = 'asc';
        const sortBy = 'block';
        const query = gql`query{
            receiveMessages(first:${limit}, where:{ block_gt: ${startBlockNumber} }, orderDirection:${direction}, orderBy:${sortBy}) {
                id,
                from,
                to,
                messageId,
                logIndex,
                transactionHash,
                block,
                blockHash,
                timestamp,
                input,
          }
        }`;
        const resp = await request(config.ETHEREUM_SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getSendMessageTxFromAvailSubgraph = async (startBlockNumber) => {
    try {
        const limit = 1000;
        const query = gql`query{
                extrinsics(
                  filter: { 
                    call: { equalTo: "sendMessage" },
                    success: { equalTo: true },
                    blockHeight: {greaterThan: "${startBlockNumber}"}
                  }
                  first: ${limit}
                  orderBy: BLOCK_HEIGHT_ASC
                ) {
                  nodes {
                    id
                    txHash
                    module
                    call
                    blockHeight
                    success
                    isSigned
                    extrinsicIndex
                    hash
                    timestamp
                    signer
                    signature
                    fees
                    nonce
                    argsName
                    argsValue
                    nbEvents
                  }
                }
        }`;
        const resp = await request(config.AVAIL_SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getReceiveMessageTxFromAvailSubgraph = async (startBlockNumber) => {
    try {
        const limit = 1000;
        const query = gql`query{
                extrinsics(
                  filter: { 
                    call: { equalTo: "execute" },
                    success: { equalTo: true },
                    blockHeight: {greaterThan: "${startBlockNumber}"}
                  }
                  first: ${limit}
                  orderBy: BLOCK_HEIGHT_ASC
                ) {
                  nodes {
                    id
                    txHash
                    module
                    call
                    blockHeight
                    success
                    isSigned
                    extrinsicIndex
                    hash
                    timestamp
                    signer
                    signature
                    fees
                    nonce
                    argsName
                    argsValue
                    nbEvents
                  }
                }
        }`;
        const resp = await request(config.AVAIL_SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getEventFromExtrinsicIdFromAvailSubgraph = async (extrinsicId, eventType) => {
    try {
        const query = gql`query{
                events(
                  filter: { 
                    event: { equalTo: "${eventType}" },
                    extrinsicId: { equalTo: "${extrinsicId}" }
                  }
                ) {
                  nodes {
                    eventIndex
                    blockHeight
                    extrinsicId
                    id
                    module
                    event
                    call
                    timestamp
                    block {
                        hash
                    }
                    argsName
                    argsValue
                  }
                }
        }`;

        const resp = await request(config.AVAIL_SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const updateAvlReadyToClaim = async () => {
    try {
        let response = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/avl/head`,
        });

        if (response && response.data && response.data.data && response.data.data.end) {
            Transaction.updateMany(
                {
                    status: TRANSACTION_STATUS.BRIDGED,
                    sourceTransactionBlockNumber: { $lt: response.data.data.end },
                    sourceChain: CHAIN.AVAIL,
                    destinationChain: CHAIN.ETHEREUM,
                },
                {
                    transactionStatus: TRANSACTION_STATUS.READY_TO_CLAIM
                }
            )
        }
    } catch (error) {
        console.log("something went wrong while axios call", error);
    }
}

export const updateEthReadyToClaim = async () => {
    try {
        let response = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/eth/head`,
        });

        if (response && response.data && response.data.slot) {
            let block = await axios({
                method: "get",
                url: `${config.BRIDGE_API}/beacon/slot/${response.data.slot}`,
            });
            if (block && block.data && block.data.blockNumber) {
                Transaction.updateMany(
                    {
                        status: TRANSACTION_STATUS.BRIDGED,
                        sourceTransactionBlockNumber: { $lt: block.data.blockNumber },
                        sourceChain: CHAIN.ETHEREUM,
                        destinationChain: CHAIN.AVAIL,
                    },
                    {
                        transactionStatus: TRANSACTION_STATUS.READY_TO_CLAIM
                    }
                )
            }

        }
    } catch (error) {
        console.log("something went wrong while axios call", error);
    }
}

export const updateSendOnEthereum = async () => {
    try {
        const count = await Transaction.find({
            sourceChain: CHAIN.ETHEREUM,
            destinationChain: CHAIN.AVAIL,
            sourceTransactionHash: { $exists: true }
        }).sort({ sourceTransactionBlockNumber: -1 }).limit(1);
        let startBlockNumber = 0;
        if (count && count.length > 0) {
            startBlockNumber = count[0].sourceTransactionBlockNumber;
        }

        let findMore = true;
        while (findMore) {
            const sendMessages = await getSendMessageTxFromEthSubgraph(startBlockNumber);
            if (sendMessages && sendMessages.sendMessages && sendMessages.sendMessages.length === 1000) {
                startBlockNumber = sendMessages.sendMessages[sendMessages.sendMessages.length - 1].block;
            } else {
                findMore = false;
            }

            for (const transaction of sendMessages.sendMessages) {
                const {
                    from,
                    to,
                    messageId,
                    logIndex,
                    transactionHash,
                    block,
                    blockHash,
                    timestamp,
                    input,
                } = transaction;

                const decodedData = getParsedTxDataFromAbiDecoder(input, AvailBridgeAbi.abi, 'sendAVAIL');
                if (decodedData.success && decodedData.result) {
                    await Transaction.updateOne(
                        {
                            messageId: messageId,
                            sourceChain: CHAIN.ETHEREUM,
                            destinationChain: CHAIN.AVAIL
                        },
                        {
                            sourceTransactionHash: transactionHash.toLowerCase(),
                            sourceTransactionBlockNumber: block,
                            sourceTransactionIndex: logIndex,
                            sourceBlockHash: blockHash,
                            sourceTransactionTimestamp: new Date(timestamp * 1000).toISOString(),
                            depositorAddress: from.toLowerCase(),
                            receiverAddress: encodeAddress(to),
                            amount: decodedData.result.params[1].value,
                            dataType: DATA_TYPE.ERC20,
                            status: TRANSACTION_STATUS.BRIDGED
                        },
                        {
                            upsert: true,
                            new: true
                        }
                    )
                }
            }
        }
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }
};

export const updateReceiveOnEthereum = async () => {
    try {
        const count = await Transaction.find({
            sourceChain: CHAIN.AVAIL,
            destinationChain: CHAIN.ETHEREUM,
            destinationTransactionHash: { $exists: true }
        }).sort({ destinationTransactionBlockNumber: -1 }).limit(1);
        let startBlockNumber = 0;
        if (count && count.length > 0) {
            startBlockNumber = count[0].destinationTransactionBlockNumber;
        }

        let findMore = true;
        while (findMore) {
            const receiveMessages = await getReceiveMessageTxFromEthSubgraph(startBlockNumber);
            if (receiveMessages && receiveMessages.receiveMessages && receiveMessages.receiveMessages.length === 1000) {
                startBlockNumber = receiveMessages.receiveMessages[receiveMessages.receiveMessages.length - 1].block;
            } else {
                findMore = false;
            }

            for (const transaction of receiveMessages.receiveMessages) {
                const {
                    from,
                    to,
                    messageId,
                    logIndex,
                    transactionHash,
                    block,
                    blockHash,
                    timestamp,
                    input,
                } = transaction;

                if (input && input.slice(0, 10).toLowerCase() === '0xa25a59cc') {
                    const decodedData = decodeReceiveAVAIL(input);
                    const data = decodedData[0].data;
                    const params = AbiCoder.decodeParameters(["address", "uint256"], data);

                    await Transaction.updateOne(
                        {
                            messageId: messageId,
                            sourceChain: CHAIN.AVAIL,
                            destinationChain: CHAIN.ETHEREUM
                        },
                        {
                            destinationTransactionHash: transactionHash.toLowerCase(),
                            destinationTransactionBlockNumber: block,
                            destinationTransactionIndex: logIndex,
                            destinationTransactionTimestamp: new Date(timestamp * 1000).toISOString(),
                            destinationBlockHash: blockHash,
                            depositorAddress: encodeAddress(from),
                            receiverAddress: to.toLowerCase(),
                            amount: params[1].toString(),
                            dataType: DATA_TYPE.ERC20,
                            status: TRANSACTION_STATUS.CLAIMED
                        },
                        {
                            upsert: true,
                            new: true
                        }
                    )
                }
            }
        }
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }
}

export const updateSendOnAvail = async () => {
    try {
        const count = await Transaction.find({
            sourceChain: CHAIN.AVAIL,
            destinationChain: CHAIN.ETHEREUM,
            sourceTransactionHash: { $exists: true }
        }).sort({ sourceTransactionBlockNumber: -1 }).limit(1);
        let startBlockNumber = 0;
        if (count && count.length > 0) {
            startBlockNumber = count[0].sourceTransactionBlockNumber;
        }

        let findMore = true;
        while (findMore) {
            const sendMessages = await getSendMessageTxFromAvailSubgraph(startBlockNumber);
            if (sendMessages && sendMessages.extrinsics &&
                sendMessages.extrinsics.nodes && sendMessages.extrinsics.nodes.length === 1000
            ) {
                startBlockNumber = sendMessages.extrinsics.nodes[sendMessages.extrinsics.nodes.length-1].blockHeight;
            } else {
                findMore = false;
            }

            for (const transaction of sendMessages.extrinsics.nodes) {
                if (transaction.argsValue) {
                    const value = JSON.parse(transaction.argsValue[0]);
                    if (value && value.fungibleToken) {
                        const event = await getEventFromExtrinsicIdFromAvailSubgraph(transaction.id, "MessageSubmitted")
                        if (event.events && event.events.nodes[0]) {
                            const data = event.events.nodes[0];
                            await Transaction.updateOne(
                                {
                                    messageId: data.argsValue[4],
                                    sourceChain: CHAIN.AVAIL,
                                    destinationChain: CHAIN.ETHEREUM
                                },
                                {
                                    sourceTransactionHash: transaction.txHash.toLowerCase(),
                                    sourceTransactionBlockNumber: transaction.blockHeight,
                                    sourceTransactionIndex: transaction.extrinsicIndex,
                                    sourceTransactionTimestamp: transaction.timestamp,
                                    depositorAddress: data.argsValue[0],
                                    receiverAddress: transaction.argsValue[1].slice(0, 42).toLowerCase(),
                                    sourceTokenAddress: value.fungibleToken.assetId.toLowerCase(),
                                    amount: parseInt(value.fungibleToken.amount, 16),
                                    dataType: DATA_TYPE.ERC20,
                                    status: TRANSACTION_STATUS.BRIDGED,
                                    sourceBlockHash: transaction.hash
                                },
                                {
                                    upsert: true,
                                    new: true
                                }
                            )
                        }
                    }
                }
            }
        }
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const updateReceiveOnAvail = async () => {
    try {
        const count = await Transaction.find({
            sourceChain: CHAIN.ETHEREUM,
            destinationChain: CHAIN.AVAIL,
            destinationTransactionHash: { $exists: true }
        }).sort({ destinationTransactionBlockNumber: -1 }).limit(1);
        let startBlockNumber = 0;
        if (count && count.length > 0) {
            startBlockNumber = count[0].destinationTransactionBlockNumber;
        }

        let findMore = true;
        while (findMore) {
            const receiveMessage = await getReceiveMessageTxFromAvailSubgraph(startBlockNumber);
            if (receiveMessage && receiveMessage.extrinsics &&
                receiveMessage.extrinsics.nodes && receiveMessage.extrinsics.nodes.length === 1000
            ) {
                startBlockNumber = receiveMessage.extrinsics.nodes[receiveMessage.extrinsics.nodes.length-1].blockHeight;
            } else {
                findMore = false;
            }

            for (const transaction of receiveMessage.extrinsics.nodes) {
                if (transaction.argsValue) {
                    const value = JSON.parse(transaction.argsValue[1]);
                    if (value && value.message && value.message.fungibleToken) {
                        const event = await getEventFromExtrinsicIdFromAvailSubgraph(transaction.id, "MessageExecuted")
                        if (event.events && event.events.nodes[0]) {
                            const data = event.events.nodes[0];
                            await Transaction.updateOne(
                                {
                                    messageId: data.argsValue[2],
                                    sourceChain: CHAIN.ETHEREUM,
                                    destinationChain: CHAIN.AVAIL
                                },
                                {
                                    destinationTransactionHash: transaction.txHash.toLowerCase(),
                                    destinationTransactionBlockNumber: transaction.blockHeight,
                                    destinationTransactionIndex: transaction.extrinsicIndex,
                                    destinationTransactionTimestamp: transaction.timestamp,
                                    depositorAddress: data.argsValue[0].slice(0, 42).toLowerCase(),
                                    receiverAddress: encodeAddress(data.argsValue[1]),
                                    destinationTokenAddress: value.message.fungibleToken.assetId.toLowerCase(),
                                    amount: parseInt(value.message.fungibleToken.amount),
                                    dataType: DATA_TYPE.ERC20,
                                    status: TRANSACTION_STATUS.CLAIMED,
                                    destinationBlockHash: transaction.hash
                                },
                                {
                                    upsert: true,
                                    new: true
                                }
                            )
                        }
                    }
                }
            }
        }
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};
