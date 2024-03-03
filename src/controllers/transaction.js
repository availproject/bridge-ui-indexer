import {
    updateAvlReadyToClaim,
    updateEthReadyToClaim,
    getEthProof,
    getAvlProof
} from "../services/transaction.js";
import { handleResponse } from '../helpers/responseHandlers';
import ErrorHandler from '../helpers/errorHandler';

const callUpdateAvlReadyToClaim = async () => {
    try {
        return await updateAvlReadyToClaim();
    } catch (error) {
        console.error(error);
    }
}

const callUpdateEthReadyToClaim = async () => {
    try {
        return await updateEthReadyToClaim();
    } catch (error) {
        console.error(error);
    }
}

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
    callUpdateAvlReadyToClaim,
    callUpdateEthReadyToClaim,
    callGetEthProof,
    callGetAvlProof
}