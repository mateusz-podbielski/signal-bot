import { check } from 'express-validator';
import { Period } from '@signalbot-backend/interfaces';

export class Validator {
  public static createValidator = [
    check('name').isString().withMessage('Missing name'),
    check('comment').isString().withMessage('Comment is missing'),
    check('planningHorizon').custom((value: Period) => {
      return value !== undefined
      && value.start !== undefined
      && value.end !== undefined;
    })
  ];

  public static updateActiveValidator = [
    check('active').isBoolean().withMessage('Missing active property'),
  ];
}
