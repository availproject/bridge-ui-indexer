import TransactionService from "../services/transaction.js";
import BridgeApi from "../services/bridge-api.js";
import fastify from "fastify";

const TRANSACTIONS_CACHE_MAX_AGE = Number(process.env.TRANSACTIONS_CACHE_MAX_AGE) || 300

type getTransactionsRequest = fastify.FastifyRequest<{
  Querystring: {
    sourceChain: string;
    page?: string;
    pageSize?: string;
    userAddress?: string;
    status?: string;
  };
}>;

type getAvlProofRequest = fastify.FastifyRequest<{
  Querystring: {
    messageId: string;
    blockHash: string;
  };
}>;

type getEthProofRequest = fastify.FastifyRequest<{
  Querystring: {
    transactionIndex: string;
    blockHash: string;
  };
}>;

export default class TransactionsServiceController {
  constructor(
    public transactionService: TransactionService,
    public bridgeApi: BridgeApi
  ) {}

  async callGetTransactions(
    req: getTransactionsRequest,
    res: fastify.FastifyReply
  ): Promise<void> {
    try {
      let respObj = await this.transactionService.getAllTransactions(req.query);
      res
        .status(200)
        .headers({
          "Cache-Control": `public, max-age=${TRANSACTIONS_CACHE_MAX_AGE}, must-revalidate`,
        })
        .send({
          success: true,
          data: respObj,
        });
    } catch (error) {
      res
        .status(500)
        .headers({
          "Cache-Control": `public, max-age=${TRANSACTIONS_CACHE_MAX_AGE}, must-revalidate`,
        })
        .send({
          success: false,
          error,
        });
    }
  }

  async callGetProofToClaimOnEthereum(
    req: getEthProofRequest,
    res: fastify.FastifyReply
  ): Promise<void> {
    try {
      let respObj = await this.bridgeApi.getProofToSubmitOnEthereum(
        req.query.blockHash,
        req.query.transactionIndex
      );
      res.status(200).send({
        success: true,
        data: respObj.data,
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        error,
      });
    }
  }

  async callGetProofToClaimOnAvail(
    req: getAvlProofRequest,
    res: fastify.FastifyReply
  ): Promise<void> {
    try {
      let respObj = await this.bridgeApi.getProofToSubmitOnAvail(
        req.query.blockHash,
        req.query.messageId
      );
      res.status(200).send({
        success: true,
        data: respObj.data,
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        error,
      });
    }
  }
}
