import {NextFunction, Request, Response} from 'express';
import {Result as ValidationResult, validationResult} from 'express-validator';
import {CustomError, ErrorCode} from '@signalbot-backend/custom-error';

export function expressValidate(req: Request, resp: Response, next: NextFunction): void | Response {
    const result: ValidationResult = validationResult(req);
    if (!result.isEmpty()) {
        const error: CustomError = new CustomError(
            ErrorCode.INCORRECT_FORM_DATA,
            `Incorrect ${req.method} request body`,
            result.array(),
        );
        return resp.status(400).json(error);
    }
    next();
}

