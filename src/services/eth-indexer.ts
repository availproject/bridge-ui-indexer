import { request, gql } from "graphql-request";
import { IEthSendMessage, IEthReceiveMessage } from "../types/index.js";
import logger from "../helpers/logger.js";
export default class EthIndexer {
  constructor(private subgraphUrl: string) {}

  async getSendMessageTx(
    startBlockNumber: number,
    limit: number
  ): Promise<IEthSendMessage[]> {
    try {
      const direction = "asc";
      const sortBy = "block";
      const query = gql`query{
                sendMessages(first:${limit}, where:{ block_gte: ${startBlockNumber} }, orderDirection:${direction}, orderBy:${sortBy}) {
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
                    logs {
                        logData
                        topics
                        address
                        logIndex
                    }
              }
            }`;

      const resp = await request(this.subgraphUrl, query);
      return resp?.sendMessages || [];
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async getReceiveMessageTx(
    startBlockNumber: number,
    limit: number
  ): Promise<IEthReceiveMessage[]> {
    try {
      const direction = "asc";
      const sortBy = "block";
      const query = gql`query{
                receiveMessages(first:${limit}, where:{ block_gte: ${startBlockNumber} }, orderDirection:${direction}, orderBy:${sortBy}) {
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
      const resp = await request(this.subgraphUrl, query);
      return resp?.receiveMessages || [];
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
