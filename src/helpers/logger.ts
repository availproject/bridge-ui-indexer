import Pino from "pino";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MONGO_CONNECTION || "mongodb://localhost:27017/mydb";
const username = process.env.MONGO_USERNAME || "";
const password = process.env.MONGO_PASSWORD || "";

const pino = Pino.pino({
  transport: {
    target: "pino-mongodb",
    options: {
      uri: url,
      database: "logs",
      collection: "log-collection",
      auth: {
        username,
        password,
      },
    },
  },
});

export default pino;
