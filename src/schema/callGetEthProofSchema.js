export default {
    querystring: {
        type: 'object',
        properties: {
            blockHash: {
                type: 'string',
            },
            transactionIndex: {
                type: 'string',
            } 
        },
        required: ['blockHash', 'transactionIndex']
    }
}
