import { schedule } from 'node-cron';
import { Database } from "./connections/dbMaster.js";
import transactionController from "./controllers/transaction.js";
import { validateParams } from "./middleware";

import fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();

const database = new Database(process.env.MONGO_URL || 'mongodb://localhost:27017/');
const app = fastify.default();

console.create({
  sentry: {
    dsn: process.env.SENTRY_DSN,
    level: 'error'
  },
  datadog: {
    api_key: process.env.DATADOG_API_KEY,
    service_name: process.env.DATADOG_APP_KEY
  },
  console: {
    level: "debug"
  }
});

async function startApi() {
  try {
    await database.connect();

    await app.register(cors, {
      origin: "*"
    });

    app.get("/proof/eth", validateParams.validateEthProofParams, transactionController.getEthProof);
    app.get("/proof/avl", validateParams.validateAvlProofParams, transactionController.getAvlProof);

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
    await transactionController.callUpdateAvlReadyToClaim();
    await transactionController.callUpdateEthReadyToClaim();
  } catch (error) {
    console.error('error in syncing All transactions: ', error);
    // process.exit(1);
  }
};

async function start() {
  await initialize();
  await startApi();
}

start();
