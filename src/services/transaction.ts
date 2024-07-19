import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface IGetAllTransaction {
  sourceChain: string;
  page?: string;
  pageSize?: string;
  userAddress?: string;
  status?: string;
}

export default class TransactionService {
  async getAllTransactions(params: IGetAllTransaction) {
    let { sourceChain, page, pageSize, status, userAddress } = params;

    let where = {};
    if (status) {
      where = { ...where, status };
    }

    if (userAddress) {
      where = {
        ...where,
        OR: [
          { depositorAddress: userAddress },
          { receiverAddress: userAddress },
          { depositorAddress: userAddress.toLowerCase() },
          { receiverAddress: userAddress.toLowerCase() },
        ],
      };
    }

    if (!page) {
      page = "0";
    }

    if (!pageSize) {
      pageSize = "100";
    }

    const offset = parseInt(page);
    const limit = parseInt(pageSize);

    let totalCount = null;
    let transactions = null;
    if (sourceChain === "AVAIL") {
      totalCount = await prisma.availsends.count({
        where,
      });
      const response = await prisma.availsends.findMany({
        where,
        select: {
          messageId: true,
          status: true,
          sourceTransactionHash: true,
          sourceBlockNumber: true,
          sourceBlockHash: true,
          sourceTransactionIndex: true,
          sourceTimestamp: true,
          sourceTokenAddress: true,
          destinationTransactionHash: true,
          destinationBlockNumber: true,
          destinationBlockHash: true,
          destinationTransactionIndex: true,
          destinationTimestamp: true,
          destinationTokenAddress: true,
          depositorAddress: true,
          receiverAddress: true,
          amount: true,
          message: true,
          dataType: true,
        },
        skip: offset * limit,
        take: limit,
        orderBy: {
          sourceBlockNumber: "desc",
        },
      });

      transactions = response.map((tx: Object) => {
        return {
            ...tx,
            //TODO: Remove below, should be handled by front end.
            sourceChain: "AVAIL"
        }
    })
    } else {
      totalCount = await prisma.ethereumsends.count({
        where,
      });
      const response = await prisma.ethereumsends.findMany({
        where,
        select: {
          messageId: true,
          status: true,
          sourceTransactionHash: true,
          sourceBlockNumber: true,
          sourceBlockHash: true,
          sourceTransactionIndex: true,
          sourceTimestamp: true,
          sourceTokenAddress: true,
          destinationTransactionHash: true,
          destinationBlockNumber: true,
          destinationBlockHash: true,
          destinationTransactionIndex: true,
          destinationTimestamp: true,
          destinationTokenAddress: true,
          depositorAddress: true,
          receiverAddress: true,
          amount: true,
          message: true,
          dataType: true,
        },
        skip: offset * limit,
        take: limit,
        orderBy: {
          sourceBlockNumber: "desc",
        },
      });

      transactions = response.map((tx: Object) => {
        return {
            ...tx,
            sourceChain: "ETHEREUM"
        }
    });
    }

    const result: any = [];

    transactions.forEach((obj: any) => {
      result.push(
        JSON.parse(
          JSON.stringify(obj, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
          )
        )
      );
    });

    return {
      result: result,
      paginationData: {
        page: offset,
        pageSize: limit,
        totalCount,
        hasNextPage: offset * limit + limit < totalCount,
      },
    };
  }
}
