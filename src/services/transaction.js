import config from "../config/index.js"

export const getEthProof = async (params) => {
    try {
        let response = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/eth/proof/${params.blockHash}?index=${params.transactionIndex}`,
        });

        return response.data;
    } catch (error) {
        console.log("something went wrong while axios call", error);
    }
}

export const getAvlProof = async (params) => {
    try {
        let response = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/avl/proof/${params.messageId}`,
        });

        return response.data;
    } catch (error) {
        console.log("something went wrong while axios call", error);
    }
}
