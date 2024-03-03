import { config } from 'dotenv';

config();


export default {
  db: {
    url: process.env.MONGO_CONNECTION,
  },
  NODE_ENV: process.env.NODE_ENV || 'production',
  BRIDGE_API: process.env.BRIDGE_API || 'https://bridge-api.sandbox.avail.tools'
};
