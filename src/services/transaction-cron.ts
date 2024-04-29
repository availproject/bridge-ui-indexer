import { Transaction } from '../models/transactions.js';
import { TRANSACTION_STATUS, CHAIN, DATA_TYPE } from '../config/constants.js';
import Decoder from '../helpers/decoder.js';
import AvailBridgeAbi from '../config/AvailBridge.js';
import AbiCoder from "web3-eth-abi";
import { encodeAddress } from '@polkadot/keyring';
import BigNumber from "bignumber.js";
import AvailIndexer from './avail-indexer.js';
import EthIndexer from './eth-indexer.js';
import BridgeApi from './bridge-api.js';

const decoder = new Decoder();

export default class TransactionCron {
    constructor(
        private availIndexer: AvailIndexer,
        private ethIndexer: EthIndexer,
        private bridgeApi: BridgeApi
    ) { }

    async updateEthereumSend(): Promise<boolean> {
        try {
            const limit = 1000;
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
                const sendMessages = await this.ethIndexer.getSendMessageTx(startBlockNumber, limit);
                if (sendMessages && sendMessages.length === limit) {
                    startBlockNumber = parseInt(sendMessages[sendMessages.length - 1].block);
                } else {
                    findMore = false;
                }

                for (const transaction of sendMessages) {
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

                    const decodedData = decoder.getParsedTxDataFromAbiDecoder(input, AvailBridgeAbi, 'sendAVAIL');
                    if (
                        decodedData.success && decodedData.result &&
                        new BigNumber(decodedData.result.params[1].value).gt(0)
                    ) {
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
                                sourceTransactionTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
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

    async updateEthereumReceive(): Promise<boolean> {
        try {
            const limit = 1000;
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
                const receiveMessages = await this.ethIndexer.getReceiveMessageTx(startBlockNumber, limit);
                if (receiveMessages && receiveMessages.length === limit) {
                    startBlockNumber = parseInt(receiveMessages[receiveMessages.length - 1].block);
                } else {
                    findMore = false;
                }

                for (const transaction of receiveMessages) {
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
                        const decodedData = decoder.decodeReceiveAVAIL(input);
                        const data = decodedData[0].data;
                        const params = AbiCoder.decodeParameters(["address", "uint256"], data);

                        if (new BigNumber(params[1]).gt(0)) {
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
                                    destinationTransactionTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
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
            }
            return true;
        } catch (error) {
            console.log(error)
            return false;
        }
    }

    async updateSendOnAvail(): Promise<boolean> {
        try {
            const limit = 500;
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
                const sendMessages = await this.availIndexer.getSendMessageTx(startBlockNumber, limit);
                if (sendMessages && sendMessages.length === limit
                ) {
                    startBlockNumber = parseInt(sendMessages[sendMessages.length - 1].blockHeight);
                } else {
                    findMore = false;
                }

                for (const transaction of sendMessages) {
                    if (transaction.argsValue) {
                        const value = JSON.parse(transaction.argsValue[0]);
                        if (
                            value && value.fungibleToken &&
                            new BigNumber(value.fungibleToken.amount, 16).gt(0)
                        ) {
                            const event = await this.availIndexer.getEventFromExtrinsicId(transaction.id, "MessageSubmitted")
                            if (event && event[0]) {
                                const data = event[0];
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
                                        sourceBlockHash: data.block.hash
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

    async updateReceiveOnAvail(): Promise<boolean> {
        try {
            const limit = 500;
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
                const receiveMessage = await this.availIndexer.getReceiveMessageTx(startBlockNumber, limit);
                if (receiveMessage && receiveMessage.length === limit
                ) {
                    startBlockNumber = parseInt(receiveMessage[receiveMessage.length - 1].blockHeight);
                } else {
                    findMore = false;
                }

                for (const transaction of receiveMessage) {
                    if (transaction.argsValue) {
                        const value = JSON.parse(transaction.argsValue[1]);
                        if (
                            value && value.message && value.message.fungibleToken &&
                            new BigNumber(value.message.fungibleToken.amount, 16).gt(0)
                        ) {
                            const event = await this.availIndexer.getEventFromExtrinsicId(transaction.id, "MessageExecuted")
                            if (event && event[0]) {
                                const data = event[0];
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
                                        destinationBlockHash: data.block.hash
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

    async updateAvlToEthToReadyToClaim(): Promise<void> {
        try {
            let response = await this.bridgeApi.getAvailLatestHeadOnEthereum();

            if (response && response.data && response.data.data && response.data.data.end) {
                console.log({
                    status: TRANSACTION_STATUS.BRIDGED,
                    sourceTransactionBlockNumber: { $lt: response.data.data.end },
                    sourceChain: CHAIN.AVAIL,
                    destinationChain: CHAIN.ETHEREUM,
                })
                await Transaction.updateMany(
                    {
                        status: TRANSACTION_STATUS.BRIDGED,
                        sourceTransactionBlockNumber: { $lt: response.data.data.end },
                        sourceChain: CHAIN.AVAIL,
                        destinationChain: CHAIN.ETHEREUM,
                    },
                    {
                        status: TRANSACTION_STATUS.READY_TO_CLAIM
                    }
                )
            }

            await Transaction.updateMany(
                {
                    $or: [
                        { status: TRANSACTION_STATUS.BRIDGED },
                        { status: TRANSACTION_STATUS.READY_TO_CLAIM }
                    ],
                    sourceTransactionHash: { $exists: true },
                    destinationTransactionHash: { $exists: true }
                },
                {
                    status: TRANSACTION_STATUS.CLAIMED
                }
            )
        } catch (error) {
            console.log("something went wrong while axios call", error);
        }
    }

    async updateEthToAvlToReadyToClaim(): Promise<void> {
        try {
            let response = await this.bridgeApi.getEthLatestHeadOnAvail();

            if (response && response.data && response.data.slot) {
                let block = await this.bridgeApi.getBlockNumberBySlot(response.data.slot);
                if (block && block.data && block.data.blockNumber) {
                    await Transaction.updateMany(
                        {
                            status: TRANSACTION_STATUS.BRIDGED,
                            sourceTransactionBlockNumber: { $lt: block.data.blockNumber },
                            sourceChain: CHAIN.ETHEREUM,
                            destinationChain: CHAIN.AVAIL,
                        },
                        {
                            status: TRANSACTION_STATUS.READY_TO_CLAIM
                        }
                    )
                }
            }
        } catch (error) {
            console.log("something went wrong while axios call", error);
        }
    }
}
