import Decoder from '../helpers/decoder.js';
import AvailBridgeAbi from '../abi/AvailBridge.js';
import ABICoder from "web3-eth-abi";
import { encodeAddress } from '@polkadot/keyring';
import BN from "bignumber.js";
import AvailIndexer from './avail-indexer.js';
import EthIndexer from './eth-indexer.js';
import BridgeApi from './bridge-api.js';
import { PrismaClient } from '@prisma/client'
import { ABI } from 'abi-decoder-ts/cjs/types.js';

const AbiCoder = ABICoder.default;
const BigNumber = BN.default;
const decoder = new Decoder();
const prisma = new PrismaClient();

export default class TransactionCron {
    constructor(
        private availIndexer: AvailIndexer,
        private ethIndexer: EthIndexer,
        private bridgeApi: BridgeApi
    ) { }

    async updateEthereumSend(): Promise<boolean> {
        try {
            const limit = 1000;
            const latestTransaction = await prisma.ethereumsends.findFirst({
                where: {
                    sourceTransactionHash: { not: null }
                },
                orderBy: {
                    sourceBlockNumber: 'desc'
                },
                take: 1
            });
            let startBlockNumber = 0;
            if (latestTransaction) {
                startBlockNumber = latestTransaction.sourceBlockNumber;
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

                    const decodedData = decoder.getParsedTxDataFromAbiDecoder(input, AvailBridgeAbi as ABI.Item[], 'sendAVAIL');
                    if (
                        decodedData.success && decodedData.result &&
                        new BigNumber(decodedData.result.params[1].value).gt(0)
                    ) {
                        await prisma.ethereumsends.upsert({
                            where: { messageId: { messageId } },
                            update: {
                                sourceTransactionHash: transactionHash.toLowerCase(),
                                sourceBlockNumber: block,
                                sourceTransactionIndex: logIndex,
                                sourceBlockHash: blockHash,
                                sourceTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
                                depositorAddress: from.toLowerCase(),
                                receiverAddress: encodeAddress(to),
                                amount: decodedData.result.params[1].value,
                                dataType: 'ERC20',
                                status: 'SENT'
                            },
                            create: {
                                messageId,
                                sourceTransactionHash: transactionHash.toLowerCase(),
                                sourceBlockNumber: block,
                                sourceTransactionIndex: logIndex,
                                sourceBlockHash: blockHash,
                                sourceTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
                                depositorAddress: from.toLowerCase(),
                                receiverAddress: encodeAddress(to),
                                amount: decodedData.result.params[1].value,
                                dataType: 'ERC20',
                                status: 'SENT'
                            }
                        });
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
            const latestTransaction = await prisma.availsends.findFirst({
                where: {
                    destinationTransactionHash: { not: null }
                },
                orderBy: {
                    destinationBlockNumber: 'desc'
                },
                take: 1
            });
            let startBlockNumber = 0;
            if (latestTransaction) {
                startBlockNumber = latestTransaction.destinationBlockNumber;
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
                            await prisma.availsends.upsert({
                                where: { messageId: { messageId } },
                                update: {
                                    destinationTransactionHash: transactionHash.toLowerCase(),
                                    destinationBlockNumber: block,
                                    destinationTransactionIndex: logIndex,
                                    destinationTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
                                    destinationBlockHash: blockHash,
                                    depositorAddress: encodeAddress(from),
                                    receiverAddress: to.toLowerCase(),
                                    amount: params[1].toString(),
                                    dataType: 'ERC20',
                                    status: 'CLAIMED'
                                },
                                create: {
                                    messageId,
                                    destinationTransactionHash: transactionHash.toLowerCase(),
                                    destinationBlockNumber: block,
                                    destinationTransactionIndex: logIndex,
                                    destinationTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
                                    destinationBlockHash: blockHash,
                                    depositorAddress: encodeAddress(from),
                                    receiverAddress: to.toLowerCase(),
                                    amount: params[1].toString(),
                                    dataType: 'ERC20',
                                    status: 'CLAIMED'
                                }
                            });
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
            const latestTransaction = await prisma.availsends.findFirst({
                where: {
                    sourceTransactionHash: { not: null }
                },
                orderBy: {
                    sourceBlockNumber: 'desc'
                },
                take: 1
            });
            let startBlockNumber = 0;
            if (latestTransaction) {
                startBlockNumber = latestTransaction.sourceBlockNumber;
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
                                await prisma.availsends.upsert({
                                    where: { messageId: { messageId: data.argsValue[4] } },
                                    update: {
                                        sourceTransactionHash: transaction.txHash.toLowerCase(),
                                        sourceBlockNumber: transaction.blockHeight,
                                        sourceTransactionIndex: transaction.extrinsicIndex,
                                        sourceTimestamp: new Date(parseInt(transaction.timestamp) * 1000).toISOString(),
                                        depositorAddress: data.argsValue[0],
                                        receiverAddress: transaction.argsValue[1].slice(0, 42).toLowerCase(),
                                        sourceTokenAddress: value.fungibleToken.assetId.toLowerCase(),
                                        amount: parseInt(value.fungibleToken.amount, 16),
                                        dataType: 'ERC20',
                                        status: 'BRIDGED',
                                        sourceBlockHash: data.block.hash
                                    },
                                    create: {
                                        messageId: data.argsValue[4],
                                        sourceTransactionHash: transaction.txHash.toLowerCase(),
                                        sourceBlockNumber: transaction.blockHeight,
                                        sourceTransactionIndex: transaction.extrinsicIndex,
                                        sourceTimestamp: new Date(parseInt(transaction.timestamp) * 1000).toISOString(),
                                        depositorAddress: data.argsValue[0],
                                        receiverAddress: transaction.argsValue[1].slice(0, 42).toLowerCase(),
                                        sourceTokenAddress: value.fungibleToken.assetId.toLowerCase(),
                                        amount: parseInt(value.fungibleToken.amount, 16),
                                        dataType: 'ERC20',
                                        status: 'BRIDGED',
                                        sourceBlockHash: data.block.hash
                                    }
                                });
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
            const latestTransaction = await prisma.ethereumsends.findFirst({
                where: {
                    destinationTransactionHash: { not: null }
                },
                orderBy: {
                    destinationBlockNumber: 'desc'
                },
                take: 1
            });
            let startBlockNumber = 0;
            if (latestTransaction) {
                startBlockNumber = latestTransaction.destinationBlockNumber;
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
                                await prisma.transaction.upsert({
                                    where: { messageId: { messageId: data.argsValue[2] } },
                                    update: {
                                        destinationTransactionHash: transaction.txHash.toLowerCase(),
                                        destinationBlockNumber: transaction.blockHeight,
                                        destinationTransactionIndex: transaction.extrinsicIndex,
                                        destinationTimestamp: new Date(parseInt(transaction.timestamp) * 1000).toISOString(),
                                        depositorAddress: data.argsValue[0].slice(0, 42).toLowerCase(),
                                        receiverAddress: encodeAddress(data.argsValue[1]),
                                        destinationTokenAddress: value.message.fungibleToken.assetId.toLowerCase(),
                                        amount: parseInt(value.message.fungibleToken.amount),
                                        dataType: 'ERC20',
                                        status: 'CLAIMED',
                                        destinationBlockHash: data.block.hash
                                    },
                                    create: {
                                        messageId: data.argsValue[2],
                                        destinationTransactionHash: transaction.txHash.toLowerCase(),
                                        destinationTransactionBlockNumber: transaction.blockHeight,
                                        destinationTransactionIndex: transaction.extrinsicIndex,
                                        destinationTimestamp: new Date(parseInt(transaction.timestamp) * 1000).toISOString(),
                                        depositorAddress: data.argsValue[0].slice(0, 42).toLowerCase(),
                                        receiverAddress: encodeAddress(data.argsValue[1]),
                                        destinationTokenAddress: value.message.fungibleToken.assetId.toLowerCase(),
                                        amount: parseInt(value.message.fungibleToken.amount),
                                        dataType: 'ERC20',
                                        status: 'CLAIMED',
                                        destinationBlockHash: data.block.hash
                                    }
                                });
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
                await prisma.availsends.updateMany({
                    where: {
                        status: 'SENT',
                        sourceBlockNumber: { lte: response.data.data.end }
                    },
                    data: {
                        status: 'READY_TO_CLAIM'
                    }
                });
            }

            await prisma.availsends.updateMany({
                where: {
                    OR: [
                        { status: 'SENT' },
                        { status: 'READY_TO_CLAIM' }
                    ],
                    sourceTransactionHash: { not: null },
                    destinationTransactionHash: { not: null }
                },
                data: {
                    status: 'CLAIMED'
                }
            });

            await prisma.ethereumsends.updateMany({
                where: {
                    OR: [
                        { status: 'SENT' },
                        { status: 'READY_TO_CLAIM' }
                    ],
                    sourceTransactionHash: { not: null },
                    destinationTransactionHash: { not: null }
                },
                data: {
                    status: 'CLAIMED'
                }
            });

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
                    await prisma.ethereumsends.updateMany({
                        where: {
                            status: 'SENT',
                            sourceBlockNumber: { lte: block.data.blockNumber }
                        },
                        data: {
                            status: 'READY_TO_CLAIM'
                        }
                    });
                }
            }
        } catch (error) {
            console.log("something went wrong while axios call", error);
        }
    }
}
