import { request, gql } from 'graphql-request';
import { IAvailExtrinsic, IAvailEvent } from '../types/index.js';

export default class AvailIndexer {
    constructor(private subgraphUrl: string) { }

    async getSendMessageTx(startBlockNumber: number, limit: number): Promise<IAvailExtrinsic[]> {
        try {
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
            const resp = await request(this.subgraphUrl, query);
            return resp?.extrinsics?.nodes || [];
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    async getReceiveMessageTx(startBlockNumber: number, limit: number): Promise<IAvailExtrinsic[]> {
        try {
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
            const resp = await request(this.subgraphUrl, query);
            return resp?.extrinsics?.nodes || [];
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    async getEventFromExtrinsicId(extrinsicId: string, eventType: string): Promise<IAvailEvent[]> {
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

            const resp = await request(this.subgraphUrl, query);
            return resp?.events?.nodes || [];
        } catch (error) {
            console.error(error);
            throw error;
        }
    };
}
