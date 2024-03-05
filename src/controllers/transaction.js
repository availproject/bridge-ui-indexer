import {
    getEthProof,
    getAvlProof
} from "../services/transaction.js";
import { handleResponse } from '../helpers/responseHandlers.js';
import ErrorHandler from '../helpers/errorHandler.js';

const callGetEthProof = async (req, res) => {
    try {
        const respObj = await getEthProof(req.query);
        handleResponse({ res, data: respObj });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching eth proof`);
    }
}

const callGetAvlProof = async (req, res) => {
    try {
        const respObj = await getAvlProof(req.query);
        handleResponse({ res, data: respObj });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching avl proof`);
    }
}

export default {
    callGetEthProof,
    callGetAvlProof
}