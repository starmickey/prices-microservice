import { PriceUpdatedMessage, Event } from "./dtos";

export class PriceUpdatedEvent {
  event: Event | null = null;

  constructor(message: PriceUpdatedMessage) {
    this.event = {
      message,
      type: "price_updated"
    }
  }
}
