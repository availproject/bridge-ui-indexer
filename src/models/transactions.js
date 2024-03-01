import { Schema } from 'mongoose';
import { Database } from '../connections/dbMaster';

const TransactionSchema = new Schema({
  sourceChain: {
    type: String,
    required: true,
  },
  destinationChain: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'BRIDGED'
  },
  sourceTransactionHash: {
    type: String,
  },
  sourceTransactionBlockNumber: {
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

/**
 * This class represents Transaction Model
 *
 * @class
 */
export class TransactionModel {
  /**
   * Get the transaction model defined on this mongoose database instance
   *
   * @param {Database} database
   *
   */
  static async new(
    database
  ) {
    const model = database.model("Transaction", TransactionSchema);
    await model.createCollection();

    return model;
  }
}
