import { MessageSent, MessageReceived } from '../../generated/AvailBridge/AvailBridge'
import { SendMessage, ReceiveMessage } from '../../generated/schema'


export function handleMessageSent(event: MessageSent): void {
  let id = 'message-sent-' + event.params.messageId.toString()

  let entity = SendMessage.load(id)
  if (entity == null) {
    entity = new SendMessage(id)
  }

  entity.from = event.params.from
  entity.to = event.params.to
  entity.messageId = event.params.messageId
  entity.block = event.block.number
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
  entity.logIndex = event.logIndex.toString()
  entity.timestamp = event.block.timestamp
  entity.input = event.transaction.input
  entity.transactionHash = event.transaction.hash

  // save entity
  entity.save()
}

