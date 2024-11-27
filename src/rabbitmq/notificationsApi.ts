import { getConfig } from "../config";
import { PriceUpdatedMessage } from "../dtos/events/dtos";
import { PriceUpdatedEvent } from "../dtos/events/events";
import { Rabbit } from "./rabbitConfig";


export function emitPriceUpdatedEvent(message: PriceUpdatedMessage) {
  const rabbit = Rabbit.getInstance();
  const { notificationsQueue } = getConfig();

  const msg = new PriceUpdatedEvent(message);

  rabbit.sendMessage(msg, notificationsQueue);
}