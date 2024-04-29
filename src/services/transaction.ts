import { PrismaClient } from '@prisma/client'
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
        where = { ...where, sourceChain };
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
                    { receiverAddress: userAddress.toLowerCase() }
                ]
            };
        }

        if (!page) {
            page = '0';
        }

        if (!pageSize) {
            pageSize = '100';
        }

        const offset = parseInt(page);
        const limit = parseInt(pageSize);

        const prisma_db = sourceChain === 'AVAIL' ? prisma.availsends : prisma.ethereumsends;

        const totalCount = await prisma_db.count({
            where
        });

        const transactions = await prisma_db.findMany({
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
                sourceBlockNumber: 'desc'
            }
        });

        return {
            result: transactions,
            paginationData: {
                page: offset,
                pageSize: limit,
                totalCount,
                hasNextPage: (offset * limit) + limit < totalCount
            }
        };
    }
}
