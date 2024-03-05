export default {
    querystring: {
        type: 'object',
        properties: {
            messageId: {
                type: 'string',
            } 
        },
        required: ['messageId']
    }
}
