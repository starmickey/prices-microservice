export interface Event {
  message: any;
  type: string;
}

export interface PriceUpdatedMessage {
  articleId: string;
  price: number;
  startDate: Date;
}

