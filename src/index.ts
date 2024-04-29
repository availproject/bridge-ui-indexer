import { schedule } from 'node-cron';

import TransactionController from "./controllers/transaction.js";
import TransactionCron from "./services/transaction-cron.js";
import EthIndexer from './services/eth-indexer.js';
import AvailIndexer from './services/avail-indexer.js';
import BridgeApi from './services/bridge-api.js';
import TransactionService from './services/transaction.js';

import callGetAvlProofSchema from './schema/callGetAvlProofSchema.js';
import callGetEthProofSchema from './schema/callGetEthProofSchema.js';
import callGetTransactionsSchema from './schema/callGetTransactionsSchema.js';

import fastify, { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();

const app: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify.default();
let bridgeApi: BridgeApi;

async function startApi() {
  try {
    const transactionController = new TransactionController(
      new TransactionService(),
      bridgeApi
    )
    await app.register(cors, {
      origin: "*"
    });

    // default endpoint (exposing transactions)
    app.get(
      "/proof/eth",
      { schema: callGetEthProofSchema },
      transactionController.callGetProofToClaimOnEthereum.bind(
        transactionController
      )
    );

    app.get(
      "/proof/avl",
      { schema: callGetAvlProofSchema },
      transactionController.callGetProofToClaimOnAvail.bind(
        transactionController
      )
    );

    app.get(
      "/transactions",
      { schema: callGetTransactionsSchema },
      transactionController.callGetTransactions.bind(
        transactionController
      )
    );

    app.get("/health-check", async (req, res) => {
      res.status(200).send({
        success: true,
        result: "Success",
      });
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
async function startCron() {

  let transactionCron = new TransactionCron(
    new AvailIndexer(process.env.AVAIL_SUBGRAPH_URL as string),
    new EthIndexer(process.env.ETHEREUM_SUBGRAPH_URL as string),
    bridgeApi
  )

  try {
    await transactionCron.updateEthereumSend();
    await transactionCron.updateEthereumReceive();
    await transactionCron.updateSendOnAvail();
    await transactionCron.updateReceiveOnAvail();
    await transactionCron.updateAvlToEthToReadyToClaim();
    await transactionCron.updateEthToAvlToReadyToClaim();

    console.log("Initial Syncing completed.")

    schedule('*/2 * * * *', transactionCron.updateEthereumSend.bind(transactionCron));
    schedule('*/2 * * * *', transactionCron.updateEthereumReceive.bind(transactionCron));
    schedule('*/2 * * * *', transactionCron.updateSendOnAvail.bind(transactionCron));
    schedule('*/2 * * * *', transactionCron.updateReceiveOnAvail.bind(transactionCron));
    schedule('*/2 * * * *', transactionCron.updateAvlToEthToReadyToClaim.bind(transactionCron));
    schedule('*/2 * * * *', transactionCron.updateEthToAvlToReadyToClaim.bind(transactionCron));
  } catch (error) {
    console.error('error in syncing All transactions: ', error);
  }
};

async function start() {
  bridgeApi = new BridgeApi(process.env.BRIDGE_API as string);

  if (process.env.START_CRON) {
    await startCron();
  }

  if (process.env.START_API) {
    await startApi();
  }
}

start();
