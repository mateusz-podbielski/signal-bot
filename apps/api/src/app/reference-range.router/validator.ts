import { check } from 'express-validator';
import { GENDER_VALUES, OBSERVATION_TYPES, Quantity, Range } from '@signalbot-backend/interfaces';

export class Validator {
  public static refRangeValidator = [
    check('type').isIn(OBSERVATION_TYPES).withMessage('Invalid or missing observation type'),
    check('low').custom(quantityValidator),
    check('high').custom(quantityValidator),
    check('appliesTo').isIn(GENDER_VALUES),
    check('age').custom(rangeValidator),
  ];
}

export function quantityValidator(value: Quantity): boolean {
  return value !== undefined
    && value.value !== undefined
    && typeof (value.value) === 'number'
    && value.unit
    && typeof (value.unit) === 'string';
}

export function rangeValidator(range: Range): boolean {
  return range !== undefined
    && range.high !== undefined
    && quantityValidator(range.high)
    && range.low !== undefined
    && quantityValidator(range.low)
    && range.low.value < range.high.value;
}
