import axiosCall, { AxiosResponse } from 'axios';
const axios = axiosCall.default;

export default class BridgeApi {
    constructor(private url: string) { }

    async getAvailLatestHeadOnEthereum(): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/avl/head`,
        });
    }

    async getEthLatestHeadOnAvail(): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/eth/head`,
        });
    }

    async getBlockNumberBySlot(slot: number): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/beacon/slot/${slot}`,
        });
    }

    async getProofToSubmitOnEthereum(blockHash: string, transactionIndex: string): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/eth/proof/${blockHash}?index=${transactionIndex}`,
        });
    }

    async getProofToSubmitOnAvail(blockHash: string, messageId: string): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/avl/proof/${blockHash}/${messageId}`,
        });
    }

}
