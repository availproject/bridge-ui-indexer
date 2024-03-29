import { schedule } from 'node-cron';
import transactionController from "./controllers/transaction.js";
import {
  updateAvlReadyToClaim,
  updateEthReadyToClaim,
  updateSendOnEthereum,
  updateReceiveOnEthereum,
  updateSendOnAvail,
  updateReceiveOnAvail
} from "./services/transaction-cron.js";

import callGetAvlProofSchema from './schema/callGetAvlProofSchema.js';
import callGetEthProofSchema from './schema/callGetEthProofSchema.js';
import callGetTransactionsSchema from './schema/callGetTransactionsSchema.js';

import fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();

const app = fastify.default();

async function startApi() {
  try {
    await app.register(cors, {
      origin: "*"
    });

    app.get(
      "/proof/eth",
      { schema: callGetEthProofSchema },
      transactionController.callGetProofToClaimOnEthereum
    );

    app.get(
      "/proof/avl",
      { schema: callGetAvlProofSchema },
      transactionController.callGetProofToClaimOnAvail
    );

    app.get(
      "/transactions",
      { schema: callGetTransactionsSchema },
      transactionController.callGetTransactions
    );

    app.get('/health-check', async (req, res) => {
      res.status(200).send({
        success: true,
        result: "Success"
      })
    });

    app.listen(
      {
        port: 3000,
        host: "0.0.0.0"
      },
      (err, address) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }

        console.info(`Server listening at ${address}`);
      }
    );
  } catch (error) {
    console.error(error);
  }
};

// Initialization and Syncing Function
async function initialize() {
  try {
    // await updateSendOnEthereum();
    // await updateReceiveOnAvail();
    // await updateSendOnAvail();
    // await updateReceiveOnEthereum(); 
    // await updateAvlReadyToClaim();
    // await updateEthReadyToClaim();

    // schedule('*/2 * * * *', updateAvlReadyToClaim);
    // schedule('*/2 * * * *', updateEthReadyToClaim);
    // schedule('*/2 * * * *', updateSendOnEthereum);
    // schedule('*/2 * * * *', updateReceiveOnEthereum);
    // schedule('*/2 * * * *', updateSendOnAvail);
    // schedule('*/2 * * * *', updateReceiveOnAvail);
  } catch (error) {
    console.error('error in syncing All transactions: ', error);
  }
};

async function start() {
  await initialize();
  await startApi();
}

start();
