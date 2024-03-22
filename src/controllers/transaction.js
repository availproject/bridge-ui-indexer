import {
    getProofToClaimOnEthereum,
    getProofToClaimOnAvail
} from "../services/transaction.js";
import { handleResponse } from '../helpers/responseHandlers.js';
import ErrorHandler from '../helpers/errorHandler.js';

const callGetProofToClaimOnEthereum = async (req, res) => {
    try {
        const respObj = await getProofToClaimOnEthereum(req.query);
        handleResponse({ res, data: respObj });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching eth proof`);
    }
}

const callGetProofToClaimOnAvail = async (req, res) => {
    try {
        const respObj = await getProofToClaimOnAvail(req.query);
        handleResponse({ res, data: respObj });
        return;
    } catch (error) {
        ErrorHandler.handleControllerError(error, res, `Error in fetching avl proof`);
    }
}

export default {
    callGetProofToClaimOnEthereum,
    callGetProofToClaimOnAvail
}