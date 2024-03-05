import { config } from 'dotenv';

config();


export default {
  db: {
    url: process.env.MONGO_CONNECTION || 'mongodb://localhost:27017/avail',
    options: {
      auto_reconnect: true,
      poolSize: 200,
      useNewUrlParser: true,
      readPreference: 'primaryPreferred',
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    },
  },
  NODE_ENV: process.env.NODE_ENV || 'production',
  BRIDGE_API: process.env.BRIDGE_API || 'https://bridge-api.sandbox.avail.tools',
  SUBGRAPH_URL: process.env.SUBGRAPH_URL
};
