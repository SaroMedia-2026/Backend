export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean = false;
  public readonly errors: any[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string = 'Something went wrong',
    errors: any[] = [],
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, errors: any[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized: Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden: Insufficient permissions'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static unprocessableEntity(message: string, errors: any[] = []): ApiError {
    return new ApiError(422, message, errors);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }
}
