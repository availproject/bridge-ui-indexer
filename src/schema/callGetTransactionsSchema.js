export default {
    querystring: {
        type: 'object',
        properties: {
            sourceChain: {
                type: 'string',
            },
            destinationChain: {
                type: 'string',
            },
            page: {
                type: 'string'
            },
            pageSize: {
                type: 'string'
            },
            status: {
                type: 'string'
            }
        },
        required: []
    }
}
