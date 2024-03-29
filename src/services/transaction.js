import { Transaction } from '../models/transactions.js';

export const getAllTransactions = async (params) => {
    let { sourceChain, destinationChain, page, pageSize, status } = params;

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

    if (!page) {
        page = '0';
    }

    if (!pageSize) {
        pageSize = '100';
    }

    page = parseInt(page);
    pageSize = parseInt(pageSize);

    const totalCount = await Transaction.countDocuments(condition);
    const transactions = await Transaction.find(
        condition,
        { __v: 0, _id: 0 }
    ).skip(page * pageSize).limit(pageSize).sort({ sourceTransactionBlockNumber: -1 });
    return {
        result: transactions,
        paginationData: {
            page,
            pageSize,
            totalCount,
            hasNextPage: (page * pageSize) + pageSize < totalCount
        }
    };
}

