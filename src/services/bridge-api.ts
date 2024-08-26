import axiosCall, { AxiosResponse } from 'axios';
const axios = axiosCall.default;

export default class BridgeApi {
    constructor(private url: string) { }

    async getAvailLatestHeadOnEthereum(): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/v1/avl/head`,
        });
    }

    async getEthLatestHeadOnAvail(): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/v1/eth/head`,
        });
    }

    async getProofToSubmitOnEthereum(blockHash: string, transactionIndex: string): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/v1/eth/proof/${blockHash}?index=${transactionIndex}`,
        });
    }

    async getProofToSubmitOnAvail(blockHash: string, messageId: string): Promise<AxiosResponse<any>> {
        return await axios({
            method: "get",
            url: `${this.url}/v1/avl/proof/${blockHash}/${messageId}`,
        });
    }

}
