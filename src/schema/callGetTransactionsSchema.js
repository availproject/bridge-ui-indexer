export default {
    querystring: {
        type: 'object',
        properties: {
            sourceChain: {
                type: 'string',
                nullable: true,
                enum: ['AVAIL', 'ETHEREUM']
            },
            destinationChain: {
                type: 'string',
                nullable: true,
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
            status: {
                type: 'string',
                nullable: true,
                enum: ['BRIDGED', 'READY_TO_CLAIM', 'CLAIMED']
            }
        },
        required: []
    }
}
