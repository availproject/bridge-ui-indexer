import TransactionController from "./controllers/transaction.js";
import TransactionCron from "./services/transaction-cron.js";
import EthIndexer from "./services/eth-indexer.js";
import AvailIndexer from "./services/avail-indexer.js";
import BridgeApi from "./services/bridge-api.js";
import TransactionService from "./services/transaction.js";

import logger from "./helpers/logger.js";

import callGetAvlProofSchema from "./schema/callGetAvlProofSchema.js";
import callGetEthProofSchema from "./schema/callGetEthProofSchema.js";
import callGetTransactionsSchema from "./schema/callGetTransactionsSchema.js";

import fastify, { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();

const app: FastifyInstance<Server, IncomingMessage, ServerResponse> =
  fastify.default({
    logger: logger,
  });
let bridgeApi: BridgeApi;

async function startApi() {
  try {
    const transactionController = new TransactionController(
      new TransactionService(),
      bridgeApi
    );
    await app.register(cors, {
      origin: "*",
      methods: ["GET", "POST"],
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
      transactionController.callGetTransactions.bind(transactionController)
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
        host: "0.0.0.0",
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
}

async function startFunction(func: Function, timeInterval: number) {
  while (true) {
    await func();
    await new Promise((r) => setTimeout(r, timeInterval));
  }
}

// Initialization and Syncing Function
async function startCron() {
  let transactionCron = new TransactionCron(
    new AvailIndexer(process.env.AVAIL_SUBGRAPH_URL as string),
    new EthIndexer(process.env.ETHEREUM_SUBGRAPH_URL as string),
    bridgeApi,
    "0xb1C3Cb9b5e598d4E95a85870e7812B99f350982d"
  );

  try {
    console.log("Initial Sync Started");
    await transactionCron.updateEthereumSend();
    await transactionCron.updateEthereumReceive();
    await transactionCron.updateSendOnAvail();
    await transactionCron.updateReceiveOnAvail();
    await transactionCron.updateAvlToEthToReadyToClaim();
    await transactionCron.updateEthToAvlToReadyToClaim();
    console.log("Initial Syncing completed.");

    startFunction(
      transactionCron.updateEthereumSend.bind(transactionCron),
      120000
    );
    startFunction(
      transactionCron.updateEthereumReceive.bind(transactionCron),
      120000
    );
    startFunction(
      transactionCron.updateSendOnAvail.bind(transactionCron),
      120000
    );
    startFunction(
      transactionCron.updateReceiveOnAvail.bind(transactionCron),
      120000
    );
    startFunction(
      transactionCron.updateAvlToEthToReadyToClaim.bind(transactionCron),
      120000
    );
    startFunction(
      transactionCron.updateEthToAvlToReadyToClaim.bind(transactionCron),
      120000
    );
  } catch (error) {
    logger.error("error in syncing All transactions: ", error);
  }
}

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
