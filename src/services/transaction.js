import config from "../config"
import { Transaction } from '../models/transactions.js';
import { TRANSACTION_STATUS, CHAIN } from '../config/constants';

const updateAvlReadyToClaim = async () => {
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
        console.log("something went wrong while axios call", error?.message);
    }
}

const updateEthReadyToClaim = async () => {
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
        console.log("something went wrong while axios call", error?.message);
    }
}

const getEthProof = async (params) => {
    try {
        let response = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/eth/proof/${params.blockHash}?index=${params.transactionIndex}`,
        });

        return response.data;
    } catch (error) {
        console.log("something went wrong while axios call", error?.message);
    }
}

const getAvlProof = async (params) => {
    try {
        let response = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/avl/proof/${params.messageId}`,
        });

        return response.data;
    } catch (error) {
        console.log("something went wrong while axios call", error?.message);
    }
}

export {
    updateAvlReadyToClaim,
    updateEthReadyToClaim,
    getEthProof,
    getAvlProof
}
