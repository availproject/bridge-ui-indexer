import { Schema } from 'mongoose';
import { Database } from '../connections/dbMaster';
import { TRANSACTION_STATUS } from '../config/constants';

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
  destinationTransactionHash: {
    type: String,
  },
  destinationTransactionBlockNumber: {
    type: Number,
  },
  destinationTransactionTimestamp: {
    type: Date
  },
  sourceTransactionIndex: {
    type: Number,
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
  sourceContractAddress: {
    type: String
  },
  destinationContractAddress: {
    type: String
  },
  dataType: {
    type: String
  }
}, { autoIndex: false });

export const Transaction = Database.model('transaction', TransactionSchema);
