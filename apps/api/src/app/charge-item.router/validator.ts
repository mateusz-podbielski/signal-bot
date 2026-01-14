import { check, query } from 'express-validator';
import { ALLOWED_CURRENCIES } from '@signalbot-backend/interfaces';

const CHARGE_ITEM_TYPES: string[] = [
  'MEDICINES',
  'SHOPPING',
  'DOCTOR_APP',
  'OFFICIAL',
  'OTHER'
];
const CHARGE_ITEM_STATUS: string[] = [
  'planned',
  'billable',
  'not-billable',
  'aborted',
  'billed',
  'entered-in-error',
  'unknown'
];

export class Validator {
  public static createChargeItemValidator = [
    check('amount')
      .isNumeric()
      .withMessage('Missing or incorrect amount'),
    check('currency').isIn(ALLOWED_CURRENCIES).withMessage('Missing or incorrect currency'),
    check('note').isString().withMessage('Missing note'),
    check('patient').exists().withMessage('Missing patient Mongo ID'),
    check('occurrence').isISO8601().withMessage('Missing or incorrect occurrence date'),
    check('name').isString().withMessage('Missing charge item name'),
    check('performer').exists().withMessage('Missing performer Mongo ID'),
    check('type').exists().withMessage('Missing ChargeItem type property'),
    check('type').isIn(CHARGE_ITEM_TYPES).withMessage('Incorrect type property')
  ];
  public static changeStatusValidator = [
    check('status').exists().isIn(CHARGE_ITEM_STATUS),
  ];

  public static dropFileValidator = [
    query('url').isString().withMessage('Incorrect or missing url query param'),
  ];
}
