export class AppError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(code, message) {
    super(code, message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(code, message) {
    super(code, message, 404);
    this.name = "NotFoundError";
  }
}
