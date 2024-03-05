import { schedule } from 'node-cron';
import transactionController from "./controllers/transaction.js";
import {
  updateAvlReadyToClaim,
  updateEthReadyToClaim,
  updateSendAVAILOnEthereum,
  updateReceiveAVAILOnEthereum
} from "./services/transaction-cron.js";
import { validateParams } from "./middleware/index.js";

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

    app.get("/proof/eth", validateParams.validateEthProofParams, transactionController.callGetEthProof);
    app.get("/proof/avl", validateParams.validateAvlProofParams, transactionController.callGetAvlProof);

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
    schedule('*/2 * * * *', updateAvlReadyToClaim);
    schedule('*/2 * * * *', updateEthReadyToClaim);
    schedule('*/2 * * * *', updateSendAVAILOnEthereum);
    schedule('*/2 * * * *', updateReceiveAVAILOnEthereum);
  } catch (error) {
    console.error('error in syncing All transactions: ', error);
  }
};

async function start() {
  await initialize();
  await startApi();
}

start();
