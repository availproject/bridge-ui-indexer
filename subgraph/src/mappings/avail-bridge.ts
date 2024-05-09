import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { MessageSent, MessageReceived } from '../../generated/AvailBridge/AvailBridge'
import { SendMessage, ReceiveMessage, LogObject } from '../../generated/schema'

export function handleMessageSent(event: MessageSent): void {
  let id = 'message-sent-' + event.params.messageId.toString()

  let entity = SendMessage.load(id)
  if (entity == null) {
    entity = new SendMessage(id)
  }

  if (event.receipt !== null) {
    for (let i = 0; i < (event.receipt as ethereum.TransactionReceipt).logs.length; i++) {
      const log = (event.receipt as ethereum.TransactionReceipt).logs[i];
      const logId = log.blockHash.toHexString() + log.logIndex.toString();
      let logEntity = LogObject.load(id)
      if (logEntity == null) {
        logEntity = new LogObject(logId)
      }

      logEntity.address = log.address;
      logEntity.sendMessage = entity.id;
      logEntity.topics = log.topics;
      logEntity.logIndex = log.logIndex;
      logEntity.logData = log.data;

      logEntity.save();
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

