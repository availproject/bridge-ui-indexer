import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { MessageSent, MessageReceived } from '../../generated/AvailBridge/AvailBridge'
import { SendMessage, ReceiveMessage } from '../../generated/schema'


export function handleMessageSent(event: MessageSent): void {
  let id = 'message-sent-' + event.params.messageId.toString()

  let entity = SendMessage.load(id)
  if (entity == null) {
    entity = new SendMessage(id)
  }
  const transferEvents = event.receipt.logs.filter(log => log.logIndex == event.logIndex.plus(new BigInt(1)));

  if (transferEvents.length) {
    const transferEvent = transferEvents[0];

    if (transferEvent.topics[1] == event.params.from && transferEvent.topics[2] == Bytes.fromHexString("0x0000000000000000000000000000000000000000")) {
      entity.amount = BigInt.fromByteArray(transferEvent.data);
    }
  }

  entity.from = event.params.from
  entity.to = event.params.to
  entity.messageId = event.params.messageId
  entity.block = event.block.number
  entity.blockHash = event.block.hash
  entity.logIndex = event.logIndex.toString()
  entity.timestamp = event.block.timestamp
  entity.input = event.transaction.input
  entity.transactionHash = event.transaction.hash

  // save entity
  entity.save()
}

export function handleMessageReceived(event: MessageReceived): void {
  let id = 'message-sent-' + event.params.messageId.toString()

  let entity = ReceiveMessage.load(id)
  if (entity == null) {
    entity = new ReceiveMessage(id)
  }

  entity.from = event.params.from
  entity.to = event.params.to
  entity.messageId = event.params.messageId
  entity.block = event.block.number
  entity.blockHash = event.block.hash
  entity.logIndex = event.logIndex.toString()
  entity.timestamp = event.block.timestamp
  entity.input = event.transaction.input
  entity.transactionHash = event.transaction.hash

  // save entity
  entity.save()
}

