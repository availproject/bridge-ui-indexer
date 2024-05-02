import Pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_CONNECTION || "mongodb://127.0.0.1:27017/logs";
const username = process.env.MONGO_USERNAME || "";
const password = process.env.MONGO_PASSWORD || "";

const pino = Pino.pino({
  transport: {
    target: "pino-mongodb",
    options: {
      uri,
      collection: "log-collection",
    },
  },
  formatters: {
    bindings: (bindings) => {
      return { pid: bindings.pid, host: bindings.hostname };
    },
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  level: process.env.PINO_LOG_LEVEL || "info",
});

export default pino;
