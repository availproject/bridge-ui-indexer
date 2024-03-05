import config from '../config/index.js';
import { Transaction } from '../models/transactions.js';
import { TRANSACTION_STATUS, CHAIN, DATA_TYPE } from '../config/constants.js';
import { request, gql } from 'graphql-request';
import { getParsedTxDataFromAbiDecoder, decodeReceiveAVAIL } from '../helpers/decoder.js';
import AvailBridgeAbi from '../config/AvailBridge.js';
import AbiCoder from "web3-eth-abi";
import axios from 'axios';

const getSendMessageTxFromSubgraph = async (start) => {
    try {
        const limit = 1000;
        const direction = 'asc';
        const sortBy = 'messageId';
        const query = gql`query{
            sendMessages(first:${limit}, where:{ messageId_gt: ${start} }, orderDirection:${direction}, orderBy:${sortBy}) {
                id,
                from,
                to,
                messageId,
                logIndex,
                transactionHash,
                block,
                timestamp,
                input,
          }
        }`;
        const resp = await request(config.SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getReceiveMessageTxFromSubgraph = async (start) => {
    try {
        const limit = 1000;
        const direction = 'asc';
        const sortBy = 'messageId';
        const query = gql`query{
            receiveMessages(first:${limit}, where:{ messageId_gt: ${start} }, orderDirection:${direction}, orderBy:${sortBy}) {
                id,
                from,
                to,
                messageId,
                logIndex,
                transactionHash,
                block,
                timestamp,
                input,
          }
        }`;
        const resp = await request(config.SUBGRAPH_URL, query);
        return resp;
    } catch (error) {
        console.log(error);
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

export const updateSendAVAILOnEthereum = async () => {
    try {
        const count = await Transaction.find({
            sourceChain: CHAIN.ETHEREUM,
            destinationChain: CHAIN.AVAIL,
            sourceTransactionHash: { $exists: true }
        }).sort({ messageId: -1 }).limit(1);
        let start = 0;
        if (count && count.length > 0) {
            start = count[0].messageId;
        }

        let findMore = true;
        while (findMore) {
            const sendMessages = await getSendMessageTxFromSubgraph(start);
            if (sendMessages && sendMessages.sendMessages && sendMessages.sendMessages.length === 1000) {
                start += 1000;
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
                            sourceTransactionTimestamp: new Date(timestamp * 1000).toISOString(),
                            depositorAddress: from.toLowerCase(),
                            receiverAddress: to.toLowerCase(),
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

export const updateReceiveAVAILOnEthereum = async () => {
    try {
        const count = await Transaction.find({
            sourceChain: CHAIN.AVAIL,
            destinationChain: CHAIN.ETHEREUM,
            destinationTransactionHash: { $exists: true }
        }).sort({ messageId: -1 }).limit(1);
        let start = 0;
        if (count && count.length > 0) {
            start = count[0].messageId;
        }

        let findMore = true;
        while (findMore) {
            const receiveMessages = await getReceiveMessageTxFromSubgraph(start);
            if (receiveMessages && receiveMessages.receiveMessages && receiveMessages.receiveMessages.length === 1000) {
                start += 1000;
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
                            depositorAddress: from.toLowerCase(),
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
