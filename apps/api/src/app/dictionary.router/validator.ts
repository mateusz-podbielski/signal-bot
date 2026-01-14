import {param, validationResult} from 'express-validator';
import {NextFunction, Request, Response} from 'express';
import {Result as ValidationResult} from 'express-validator/src/validation-result';
import {CustomError, ErrorCode} from '@signalbot-backend/custom-error';
import { VALUE_SET_NAMES } from '@signalbot-backend/interfaces';

export class Validator {
  public static getDictionaryValidator = [
    param('name')
      .exists()
      .isString()
      .custom((name: string) => VALUE_SET_NAMES.includes(name)),
  ];
}

export function validateDictionary(req: Request, resp: Response, next: NextFunction): void | Response {
  const result: ValidationResult = validationResult(req);
  if (!result.isEmpty()) {
    const error: CustomError = new CustomError(
      ErrorCode.RESOURCES_NOT_FOUND,
      `Incorrect ${req.method} request body`,
      result.array(),
    );
    return resp.status(404).json(error);
  }
  next();
}
