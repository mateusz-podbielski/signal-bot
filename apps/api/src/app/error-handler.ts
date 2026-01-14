import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { Response } from 'express';
import { AxiosError } from 'axios';

export function errorHandler(resp: Response): (error: CustomError | AxiosError) => void {
  return (error: CustomError | AxiosError) => {
    let code = 500;
    switch (error.code) {
      case ErrorCode.INCORRECT_FORM_DATA:
        code = 400;
        break;
      case ErrorCode.INVALID_AUTH_TOKEN:
        code = 401;
        break;
      case ErrorCode.INVALID_CREDENTIALS:
        code = 403;
        break;
      case ErrorCode.USER_NOT_FOUND:
        code = 404;
        break;
      case ErrorCode.RESOURCES_NOT_FOUND:
        code = 404;
        break;
      case ErrorCode.METHOD_NOT_ALLOWED:
        code = 405;
        break;
      case ErrorCode.USER_NOT_CONFIRMED:
        code = 405;
        break;
      case ErrorCode.OPERATION_CAN_NOT_BE_PERFORMED:
        code = 406;
        break;
      case ErrorCode.MAX_LOGIN_ATTEMPTS_CODE:
        code = 408;
        break;
      case ErrorCode.DATA_CONFLICT:
        code = 409;
        break;
      case ErrorCode.UNEXPECTED_ERROR:
        code = 500;
        break;
      default:
        code = 500;
        break;
    }
    resp.status(code).send(error);
  };
}
