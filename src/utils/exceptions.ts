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

export class Unauthorized extends APIError {
  constructor() {
    super("Unauthorized", 401);
  }
}

export class BadRequest extends APIError {
  constructor(message: string) {
    super(`Bad Request: ${message}`, 400);
  }
}