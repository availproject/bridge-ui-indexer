export default {
    querystring: {
        type: 'object',
        properties: {
            sourceChain: {
                type: 'string',
                enum: ['AVAIL', 'ETHEREUM']
            },
            page: {
                type: 'string',
                nullable: true,
            },
            pageSize: {
                type: 'string',
                nullable: true,
            },
            userAddress: {
                type: 'string',
                nullable: true,
            },
            status: {
                type: 'string',
                nullable: true,
                enum: ['IN_PROGRESS', 'READY_TO_CLAIM', 'CLAIMED']
            }
        },
        required: []
    }
}
