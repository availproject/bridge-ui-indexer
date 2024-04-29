export interface IEthSendMessage {
    id: string,
    from: string,
    to: string,
    messageId: string,
    logIndex: string,
    transactionHash: string,
    block: string,
    blockHash: string,
    timestamp: string,
    input: string,
}

export interface IEthReceiveMessage {
    id: string,
    from: string,
    to: string,
    messageId: string,
    logIndex: string,
    transactionHash: string,
    block: string,
    blockHash: string,
    timestamp: string,
    input: string,
}

export interface IAvailExtrinsic {
    id: string,
    txHash: string,
    module: string,
    call: string,
    blockHeight: string,
    success: Boolean,
    isSigned: Boolean,
    extrinsicIndex: number,
    hash: string,
    timestamp: string,
    signer: string,
    signature: string,
    fees: string,
    nonce: string,
    argsName: Array<string>,
    argsValue: Array<string>,
    nbEvents: number,
}

export interface IAvailEvent {
    eventIndex: number,
    blockHeight: string,
    extrinsicId: string,
    id: string,
    module: string,
    event: string,
    call: string,
    timestamp: string,
    block: {
        hash: string,
    }
    argsName: Array<string>,
    argsValue: Array<string>,
}

export interface IABIDecodeMethod {
    name: string,
    params: {
        name: string,
        value: any,
        type: string
    }[]
}

export interface IRetData {
    name: string,
    params: Array<any>
}
