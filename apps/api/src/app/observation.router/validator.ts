import { check, param, query, Meta } from 'express-validator';
import { Types } from 'mongoose';

import {
  ACTIVITY_CODES,
  BloodTypePayload,
  OBSERVATION_METHODS,
  OBSERVATION_TYPES,
  ObservationPayloadValue,
  ObservationType,
  Quantity
} from '@signalbot-backend/interfaces';

export class Validator {
  public static createValidator = [
    check('patient').custom((value: string) => Types.ObjectId.isValid(value)),
    check('note').optional().isString(),
    check('effective').isISO8601(),
    check('method').isIn(OBSERVATION_METHODS),
    check('value').custom(valueValidator),
    param('observationType').isIn(OBSERVATION_TYPES),
  ];
  public static getByTypeValidator = [
    param('observationType').isIn(OBSERVATION_TYPES),
  ];

  public static createReportValidator = [
    query('observationType').isIn(OBSERVATION_TYPES),
    query('from').isDate(),
    query('to').isDate(),
  ];
}

export function valueValidator(value: ObservationPayloadValue , { req }: Meta): boolean {
  const type: ObservationType = req.params.observationType;
  switch (type) {
    case ObservationType.GlucoseLevel:
      return isQuantity(value as Quantity);
    case ObservationType.BodyWeight:
      return isQuantity(value as Quantity);
    case ObservationType.BodyHeight:
      return isQuantity(value as Quantity);
    case ObservationType.BodyTemp:
      return isQuantity(value as Quantity);
    case ObservationType.HeartRate:
      return isQuantity(value as Quantity);
    case ObservationType.Pain:
      return typeof value === 'number';
    case ObservationType.Mood:
      return typeof value === 'number';
    case ObservationType.BloodPressure:
      return Array.isArray(value)
        && value.length === 2
        && isQuantity(value[0])
        && isQuantity(value[1])
        && ['DIASTOLIC', 'SYSTOLIC'].includes(value[0].code)
        && ['DIASTOLIC', 'SYSTOLIC'].includes(value[1].code);
    case ObservationType.Activity:
      return value !== undefined
        && isQuantity(value as Quantity)
        && ACTIVITY_CODES.includes((value as Quantity).code);
    case ObservationType.Feeding:
      return true;
    case ObservationType.BloodType:
      return value !== undefined
    && ['O', 'A', 'B', 'AB'].includes((value as BloodTypePayload).type)
    && ['positive', 'negative'].includes((value as BloodTypePayload).rh)
  }
}

export function isQuantity(value: Quantity): boolean {
  return value !== undefined
    && (value as Quantity).value !== undefined
    && (value as Quantity).unit !== undefined;
}
