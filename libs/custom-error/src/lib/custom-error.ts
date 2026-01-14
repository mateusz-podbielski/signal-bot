import { ErrorCode } from './error-code';

export class CustomError extends Error {
  public code: ErrorCode;
  public errors: unknown;
  public message: string;

  constructor(code: ErrorCode, message = 'Unexpected error', errors?: unknown) {
    super(code);
    this.name = 'CustomError';
    this.code = code;
    this.message = message;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

