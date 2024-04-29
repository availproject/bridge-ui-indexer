import { Transaction } from '../models/transactions.js';

interface IGetAllTransaction {
    sourceChain?: string;
    destinationChain?: string;
    page?: string;
    pageSize?: string;
    userAddress?: string;
    status?: string;
}
export default class TransactionService {
    constructor() {

    }

    async getAllTransactions(params: IGetAllTransaction) {
        let { sourceChain, destinationChain, page, pageSize, status, userAddress } = params;

        let condition = {};
        if (sourceChain) {
            condition = { ...condition, sourceChain };
        }
        if (destinationChain) {
            condition = { ...condition, destinationChain };
        }
        if (status) {
            condition = { ...condition, status };
        }

        if (userAddress) {
            condition = {
                ...condition,
                $or: [
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

        const totalCount = await Transaction.countDocuments(condition);
        const transactions = await Transaction.find(
            condition,
            { __v: 0, _id: 0 }
        ).skip(offset * limit).limit(limit).sort({ sourceTransactionBlockNumber: -1 });
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
