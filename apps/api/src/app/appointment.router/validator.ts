import { check, query } from 'express-validator';
import { APPOINTMENT_STATUSES } from '@signalbot-backend/interfaces';
import { Validators } from '@signalbot-backend/validators';


export class Validator {
  public static createValidator = [
    check('description').isString(),
    check('priority').isNumeric(),
    check('start').isISO8601(),
    check('end').isISO8601(),
    check('patient').custom(Validators.mongooseId),
    check('specialist').custom(Validators.mongooseId)
  ];

  public static getQueryParamsValidator = [
    query('limit').optional().isNumeric(),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601()
  ];

  public static deleteParticipantValidator = [
    check('participantRef').custom((value: string) => value !== undefined && value.split('/').length === 2)
  ];

  public static patchStatusValidator = [
    check('status').isIn(APPOINTMENT_STATUSES),
  ];

  public static patchParticipantValidator = [
    check('participant').custom(Validators.mongooseId)
  ];
}
