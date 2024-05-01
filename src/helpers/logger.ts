import winston, { log } from "winston";
import "winston-mongodb";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MONGO_CONNECTION || "mongodb://localhost:27017/mydb";

export const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
      level: "error",
    }),
  ],
});

logger.add(
  new winston.transports.MongoDB({
    db: url,
    collection: "log",
  })
);
