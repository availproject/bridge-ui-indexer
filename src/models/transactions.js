import pkg from 'mongoose';
import { Database } from '../connections/dbMaster.js';
import { TRANSACTION_STATUS } from '../config/constants.js';

const { Schema } = pkg;

const TransactionSchema = new Schema({
  sourceChain: {
    type: String,
    required: true,
  },
  destinationChain: {
    type: String,
    required: true,
  },
  messageId: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: TRANSACTION_STATUS.BRIDGED
  },
  sourceTransactionHash: {
    type: String,
  },
  sourceTransactionBlockNumber: {
    type: Number,
  },
  sourceTransactionIndex: {
    type: Number,
  },
  sourceTransactionTimestamp: {
    type: Date
  },
  sourceTokenAddress: {
    type: String,
  },
  sourceBlockHash: {
    type: String
  },
  destinationTransactionHash: {
    type: String,
  },
  destinationTransactionBlockNumber: {
    type: Number,
  },
  destinationTransactionTimestamp: {
    type: Date
  },
  destinationTransactionIndex: {
    type: Number,
  },
  destinationBlockHash: {
    type: String
  },
  destinationTokenAddress: {
    type: String,
  },
  depositorAddress: {
    type: String
  },
  receiverAddress: {
    type: String
  },
  amount: {
    type: String,
  },
  message: {
    type: String,
  },
  dataType: {
    type: String
  }
}, { autoIndex: false });

export const Transaction = Database.model('transaction', TransactionSchema);
