import { config } from 'dotenv';

config();


export default {
  db: {
    url: process.env.MONGO_CONNECTION,
  },
  NODE_ENV: process.env.NODE_ENV || 'production',
};
