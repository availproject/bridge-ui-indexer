export default {
    querystring: {
        type: 'object',
        properties: {
            messageId: {
                type: 'string',
            },
            blockHash: {
                type: 'string',
            }
        },
        required: ['messageId', 'blockHash']
    }
}
