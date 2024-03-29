import { handleResponse } from '../helpers/responseHandlers.js';
import ErrorHandler from '../helpers/errorHandler.js';
import axios from "axios";

const callGetTransactions = async (req, res) => {
    try {
        // let respObj = await axios({
        //     method: "get",
        //     url: `${config.BRIDGE_API}/eth/proof/${req.query.blockHash}?index=${req.query.transactionIndex}`,
        // });
        // handleResponse({ res, data: respObj.data });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching transactions`);
    }
}

const callGetProofToClaimOnEthereum = async (req, res) => {
    try {
        let respObj = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/eth/proof/${req.query.blockHash}?index=${req.query.transactionIndex}`,
        });
        handleResponse({ res, data: respObj.data });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching eth proof`);
    }
}

const callGetProofToClaimOnAvail = async (req, res) => {
    try {
        const respObj = await axios({
            method: "get",
            url: `${config.BRIDGE_API}/avl/proof/${req.query.blockHash}/${req.query.messageId}`,
        });
        handleResponse({ res, data: respObj.data });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching avl proof`);
    }
}

export default {
    callGetProofToClaimOnEthereum,
    callGetProofToClaimOnAvail,
    callGetTransactions
}