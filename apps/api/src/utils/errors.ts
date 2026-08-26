export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST') {
    super(400, message, code);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden access', code: string = 'FORBIDDEN') {
    super(403, message, code);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(404, message, code);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict detected', code: string = 'CONFLICT') {
    super(409, message, code);
  }
}
