export class APIError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}


export class NotFound extends APIError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFound";
  }
}
