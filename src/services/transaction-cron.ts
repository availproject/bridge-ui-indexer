import Decoder from "../helpers/decoder.js";
import AvailBridgeAbi from "../abi/AvailBridge.js";
import { encodeAddress } from "@polkadot/keyring";
import { BigNumber } from "bignumber.js";
import AvailIndexer from "./avail-indexer.js";
import EthIndexer from "./eth-indexer.js";
import BridgeApi from "./bridge-api.js";
import { PrismaClient, Prisma } from "@prisma/client";

import { decodeParameter, decodeParameters } from "web3-eth-abi";
import logger from "../helpers/logger.js";
import {
  IAvailEvent,
  IAvailExtrinsic,
  IEthReceiveMessage,
  IEthSendMessage,
} from "../types/index.js";

const decoder = new Decoder();
const prisma = new PrismaClient();

export default class TransactionCron {
  constructor(
    private availIndexer: AvailIndexer,
    private ethIndexer: EthIndexer,
    private bridgeApi: BridgeApi,
    private availContractAddress: string
  ) {}

  async updateEthereumSend(): Promise<void> {
    try {
      const limit = 1000;
      let startBlockNumber = await this.getLatestProcessedBlockNumber();

      let findMore = true;
      while (findMore) {
        const sendMessages = await this.ethIndexer.getSendMessageTx(
          startBlockNumber,
          limit
        );
        if (sendMessages && sendMessages.length === limit) {
          startBlockNumber = parseInt(
            sendMessages[sendMessages.length - 1].block
          );
        } else {
          findMore = false;
        }

        const blockToTransactionMapping =
          this.groupTransactionsByBlock(sendMessages);
        const blocks = Object.keys(blockToTransactionMapping)
          .map(Number)
          .sort((a, b) => a - b);

        for (const block of blocks) {
          const transactions = blockToTransactionMapping[block];
          await this.processTransactionsInBlockEthereumSends(
            transactions,
            block
          );
        }
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async updateEthereumReceive(): Promise<boolean> {
    try {
      const limit = 1000;
      const latestTransaction = await prisma.availsends.findFirst({
        where: {
          destinationTransactionHash: { not: null },
        },
        orderBy: {
          destinationBlockNumber: "desc",
        },
        take: 1,
      });
      let startBlockNumber = 0;
      if (latestTransaction) {
        startBlockNumber = Number(latestTransaction.destinationBlockNumber);
      }

      let findMore = true;
      while (findMore) {
        const receiveMessages = await this.ethIndexer.getReceiveMessageTx(
          startBlockNumber,
          limit
        );
        if (receiveMessages && receiveMessages.length === limit) {
          startBlockNumber = parseInt(
            receiveMessages[receiveMessages.length - 1].block
          );
        } else {
          findMore = false;
        }

        const blockToTransactionMapping =
          this.groupTransactionsByBlock(receiveMessages);
        const blocks = Object.keys(blockToTransactionMapping)
          .map(Number)
          .sort((a, b) => a - b);

        for (const block of blocks) {
          const transactions = blockToTransactionMapping[block];
          this.processTransactionsInBlockEthereumReceive(transactions, block);
        }
      }
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async updateSendOnAvail(): Promise<boolean> {
    try {
      const limit = 500;
      const latestTransaction = await prisma.availsends.findFirst({
        where: {
          sourceTransactionHash: { not: null },
        },
        orderBy: {
          sourceBlockNumber: "desc",
        },
        take: 1,
      });
      let startBlockNumber = 0;
      if (latestTransaction) {
        startBlockNumber = Number(latestTransaction.sourceBlockNumber);
      }

      let findMore = true;
      while (findMore) {
        const sendMessages = await this.availIndexer.getSendMessageTx(
          startBlockNumber,
          limit
        );
        if (sendMessages && sendMessages.length === limit) {
          startBlockNumber = parseInt(
            sendMessages[sendMessages.length - 1].blockHeight
          );
        } else {
          findMore = false;
        }

        const blockToTransactionMapping =
          this.groupTransactionsByBlock(sendMessages);
        const blocks = Object.keys(blockToTransactionMapping)
          .map(Number)
          .sort((a, b) => a - b);

        for (const block of blocks) {
          const transactions = blockToTransactionMapping[block];
          this.processTransactionsInAvailSends(transactions, block);
        }
      }
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async updateReceiveOnAvail(): Promise<boolean> {
    try {
      const limit = 500;
      const latestTransaction = await prisma.ethereumsends.findFirst({
        where: {
          destinationTransactionHash: { not: null },
        },
        orderBy: {
          destinationBlockNumber: "desc",
        },
        take: 1,
      });
      let startBlockNumber = 0;
      if (latestTransaction) {
        startBlockNumber = Number(latestTransaction.destinationBlockNumber);
      }

      let findMore = true;
      while (findMore) {
        const receiveMessage = await this.availIndexer.getReceiveMessageTx(
          startBlockNumber,
          limit
        );
        if (receiveMessage && receiveMessage.length === limit) {
          startBlockNumber = parseInt(
            receiveMessage[receiveMessage.length - 1].blockHeight
          );
        } else {
          findMore = false;
        }

        const blockToTransactionMapping =
          this.groupTransactionsByBlock(receiveMessage);
        const blocks = Object.keys(blockToTransactionMapping)
          .map(Number)
          .sort((a, b) => a - b);

        for (const block of blocks) {
          const transactions = blockToTransactionMapping[block];
          this.processTransactionsInAvailReceive(transactions, block);
        }
      }
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async updateAvlToEthToReadyToClaim(): Promise<void> {
    try {
      let response = await this.bridgeApi.getAvailLatestHeadOnEthereum();

      if (
        response &&
        response.data &&
        response.data.data &&
        response.data.data.end
      ) {
        await prisma.availsends.updateMany({
          where: {
            status: "SENT",
            sourceBlockNumber: { lte: response.data.data.end },
          },
          data: {
            status: "READY_TO_CLAIM",
          },
        });
      }

      await prisma.availsends.updateMany({
        where: {
          OR: [{ status: "SENT" }, { status: "READY_TO_CLAIM" }],
          sourceTransactionHash: { not: null },
          destinationTransactionHash: { not: null },
        },
        data: {
          status: "CLAIMED",
        },
      });

      await prisma.ethereumsends.updateMany({
        where: {
          OR: [{ status: "SENT" }, { status: "READY_TO_CLAIM" }],
          sourceTransactionHash: { not: null },
          destinationTransactionHash: { not: null },
        },
        data: {
          status: "CLAIMED",
        },
      });
    } catch (error) {
      logger.error("something went wrong while axios call", error);
    }
  }

  async updateEthToAvlToReadyToClaim(): Promise<void> {
    try {
      let response = await this.bridgeApi.getEthLatestHeadOnAvail();

      if (response && response.data && response.data.slot) {
        let block = await this.bridgeApi.getBlockNumberBySlot(
          response.data.slot
        );
        if (block && block.data && block.data.blockNumber) {
          await prisma.ethereumsends.updateMany({
            where: {
              status: "SENT",
              sourceBlockNumber: { lte: block.data.blockNumber },
            },
            data: {
              status: "READY_TO_CLAIM",
            },
          });
        }
      }
    } catch (error) {
      logger.error("something went wrong while axios call", error);
    }
  }
  private async getLatestProcessedBlockNumber(): Promise<number> {
    const latestTransaction = await prisma.ethereumsends.findFirst({
      where: {
        sourceTransactionHash: { not: null },
      },
      orderBy: {
        sourceBlockNumber: "desc",
      },
      take: 1,
    });
    return latestTransaction ? Number(latestTransaction.sourceBlockNumber) : 0;
  }

  private groupTransactionsByBlock<
    T extends IEthSendMessage | IEthReceiveMessage | IAvailExtrinsic
  >(transactions: T[]): { [block: string]: T[] } {
    return transactions.reduce(
      (acc: { [block: string]: T[] }, transaction: T) => {
        const block =
          "block" in transaction
            ? transaction.block
            : "blockHeight" in transaction
            ? transaction.blockHeight.toString()
            : "";

        if (!acc[block]) {
          acc[block] = [];
        }
        acc[block].push(transaction);
        return acc;
      },
      {}
    );
  }
  private async processTransactionsInBlockEthereumSends(
    transactions: IEthSendMessage[],
    block: number
  ) {
    const operations = [];

    for (const transaction of transactions) {
      const operation = this.createOperationForEthereumSends(
        transaction,
        block
      );
      if (operation) {
        operations.push(operation);
      }
    }

    await this.executePrismaTx(operations);
  }

  private async processTransactionsInBlockEthereumReceive(
    transactions: IEthReceiveMessage[],
    block: number
  ) {
    const operations = [];

    for (const transaction of transactions) {
      const operation = this.createOperationForEthereumReceive(
        transaction,
        block
      );
      if (operation) {
        operations.push(operation);
      }
    }

    await this.executePrismaTx(operations);
  }

  private async processTransactionsInAvailSends(
    transactions: IAvailExtrinsic[],
    block: number
  ) {
    const operations = [];

    for (const transaction of transactions) {
      let operation;
      if (transaction.argsValue) {
        const value = JSON.parse(transaction.argsValue[0]);
        if (
          value &&
          value.fungibleToken &&
          new BigNumber(value.fungibleToken.amount, 16).gt(0)
        ) {
          const event = await this.availIndexer.getEventFromExtrinsicId(
            transaction.id,
            "MessageSubmitted"
          );
          operation = this.createOperationForAvailSends(
            transaction,
            event,
            value
          );
        }
      }
      if (operation) {
        operations.push(operation);
      }
    }

    await this.executePrismaTx(operations);
  }

  private async processTransactionsInAvailReceive(
    transactions: IAvailExtrinsic[],
    block: number
  ) {
    const operations = [];

    for (const transaction of transactions) {
      let operation;
      if (transaction.argsValue) {
        const value = JSON.parse(transaction.argsValue[0]);
        if (
          value &&
          value.message &&
          value.message.fungibleToken &&
          new BigNumber(value.message.fungibleToken.amount, 16).gt(0)
        ) {
          const event = await this.availIndexer.getEventFromExtrinsicId(
            transaction.id,
            "MessageExecuted"
          );
          operation = this.createOperationForAvailReceive(
            transaction,
            event,
            value
          );
        }
      }
      if (operation) {
        operations.push(operation);
      }
    }

    await this.executePrismaTx(operations);
  }

  private createOperationForEthereumSends(
    transaction: IEthSendMessage,
    block: number
  ): any {
    const {
      from,
      to,
      messageId,
      logIndex,
      transactionHash,
      blockHash,
      timestamp,
      input,
      logs,
    } = transaction;

    const transferLog = logs.find((log) => {
      return (
        log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
        log.address.toLowerCase() === this.availContractAddress.toLowerCase() &&
        BigInt(log.logIndex) === BigInt(logIndex) + BigInt(1) &&
        (decodeParameter("address", log.topics[1]) as string).toLowerCase() ===
          from &&
        (decodeParameter("address", log.topics[2]) as string) ===
          "0x0000000000000000000000000000000000000000"
      );
    });

    const decodedData = decoder.getParsedTxDataFromAbiDecoder(
      input,
      AvailBridgeAbi as Array<unknown>,
      "sendAVAIL"
    );
    if (
      (decodedData.success &&
        decodedData.result &&
        new BigNumber(decodedData.result.params[1].value).gt(0)) ||
      transferLog
    ) {
      const schemaObj = {
        sourceTransactionHash: transactionHash.toLowerCase(),
        sourceBlockNumber: BigInt(block),
        sourceTransactionIndex: BigInt(logIndex),
        sourceBlockHash: blockHash,
        sourceTimestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        depositorAddress: from.toLowerCase(),
        receiverAddress: encodeAddress(to),
        amount: transferLog
          ? (
              decodeParameter("uint256", transferLog.logData) as BigInt
            ).toString()
          : decodedData.result!.params[1].value,
        dataType: "ERC20",
        status: "SENT",
      };

      return prisma.ethereumsends.upsert({
        where: { messageId: BigInt(messageId) },
        update: schemaObj,
        create: {
          messageId: BigInt(messageId),
          ...schemaObj,
        },
      });
    }

    return null;
  }

  private createOperationForEthereumReceive(
    transaction: IEthReceiveMessage,
    block: number
  ): any {
    const {
      from,
      to,
      messageId,
      logIndex,
      transactionHash,
      blockHash,
      timestamp,
      input,
    } = transaction;

    if (input && input.slice(0, 10).toLowerCase() === "0xa25a59cc") {
      const decodedData = decoder.decodeReceiveAVAIL(input);
      const data = decodedData[0].data;
      const params = decodeParameters(["address", "uint256"], data);

      if (new BigNumber(params[1] as string).gt(0)) {
        const updateObj = () => {
          return {
            destinationTransactionHash: transactionHash.toLowerCase(),
            destinationBlockNumber: BigInt(block),
            destinationTransactionIndex: BigInt(logIndex),
            destinationTimestamp: new Date(
              parseInt(timestamp) * 1000
            ).toISOString(),
            destinationBlockHash: blockHash,
            depositorAddress: encodeAddress(from),
            receiverAddress: to.toLowerCase(),
            amount: (params[1] as string).toString(),
            dataType: "ERC20",
            status: "CLAIMED",
          };
        };
        return prisma.availsends.upsert({
          where: { messageId: BigInt(messageId) },
          update: { ...updateObj() },
          create: {
            messageId: BigInt(messageId),
            ...updateObj(),
          },
        });
      }
      return null;
    }
  }

  private createOperationForAvailSends(
    transaction: IAvailExtrinsic,
    event: IAvailEvent[],
    value: any
  ): any {
    if (event && event[0]) {
      const sourceObj = () => {
        return {
          sourceTransactionHash: transaction.txHash.toLowerCase(),
          sourceBlockNumber: BigInt(transaction.blockHeight),
          sourceTransactionIndex: transaction.extrinsicIndex,
          sourceTimestamp: new Date(transaction.timestamp).toISOString(),
          depositorAddress: data.argsValue[0],
          receiverAddress: transaction.argsValue[1].slice(0, 42).toLowerCase(),
          sourceTokenAddress: value.fungibleToken.assetId.toLowerCase(),
          amount: BigInt(value.fungibleToken.amount).toString(),
          dataType: "ERC20",
          status: "BRIDGED",
          sourceBlockHash: data.block.hash,
        };
      };
      const data = event[0];
      const operation = prisma.availsends.upsert({
        where: { messageId: BigInt(data.argsValue[4]) },
        update: { ...sourceObj() },
        create: {
          messageId: BigInt(data.argsValue[4]),
          ...sourceObj(),
        },
      });
      return operation;
    }
  }

  private createOperationForAvailReceive(
    transaction: IAvailExtrinsic,
    event: IAvailEvent[],
    value: any
  ): any {
    if (event && event[0]) {
      const data = event[0];
      const sourceObj = () => {
        return {
          destinationTransactionHash: transaction.txHash.toLowerCase(),
          destinationBlockNumber: BigInt(transaction.blockHeight),
          destinationTransactionIndex: transaction.extrinsicIndex,
          destinationTimestamp: new Date(
            parseInt(transaction.timestamp) * 1000
          ).toISOString(),
          depositorAddress: data.argsValue[0].slice(0, 42).toLowerCase(),
          receiverAddress: encodeAddress(data.argsValue[1]),
          destinationTokenAddress:
            value.message.fungibleToken.assetId.toLowerCase(),
          amount: new BigNumber(
            value.message.fungibleToken.amount,
            16
          ).toString(),
          dataType: "ERC20",
          status: "CLAIMED",
          destinationBlockHash: data.block.hash,
        };
      };
      return prisma.ethereumsends.upsert({
        where: { messageId: BigInt(data.argsValue[2]) },
        update: { ...sourceObj() },
        create: {
          messageId: BigInt(data.argsValue[2]),
          ...sourceObj(),
        },
      });
    }
    return null;
  }

  private async executePrismaTx(operations: Prisma.PrismaPromise<any>[]) {
    try {
      await prisma.$transaction(operations);
      logger.info("All operations completed successfully");
    } catch (error) {
      logger.error("An error occurred during the transaction:", error);
    }
  }
}
