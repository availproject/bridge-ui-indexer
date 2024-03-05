import { handleBadRequest } from '../helpers/responseHandlers.js';

export default {

  validateAvlProofParams: (req, res, next) => {
    const { messageId } = req.query;
    if (!messageId) {
      handleBadRequest({ res, errMsg: `messageId is required` });
      return;
    }
    next();
  },

  validateEthProofParams: (req, res, next) => {
    const { blockHash, transactionIndex } = req.query;
    if (!blockHash) {
      handleBadRequest({ res, errMsg: `blockHash is required` });
      return;
    }
    if (!transactionIndex) {
      handleBadRequest({ res, errMsg: `transactionIndex is required` });
      return;
    }
  }

};
