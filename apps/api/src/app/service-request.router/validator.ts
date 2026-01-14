import { check, query } from 'express-validator';
export const STATUSES: string[] = [
  'draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'
];
export const codes: string[] = ['SHOPPING', 'MEDICINES', 'DOCTOR_APP', 'TRANSPORT', 'OTHER'];
export class Validator {
  public static createUpdateValidator = [
    check('patientId').exists().isString().isLength({ min: 24, max: 24 }).withMessage('Missing or incorrect patientId'),
    check('performerId').exists().isString().isLength({
      min: 24,
      max: 24
    }).withMessage('Missing or incorrect performerId'),
    check('code').exists().isIn(codes).withMessage('Missing or incorrect code'),
    check('noteText').exists().isString().withMessage('Missing or incorrect note text'),
    check('occurrenceDateTime').isISO8601().withMessage('Missing or incorrect occurrence'),
  ];
  public static changeStatusValidator = [
    check('status').exists().isIn(STATUSES).withMessage('Missing or incorrect status'),
  ];
  public static rangeValidator = [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('date').optional().isISO8601(),
  ];
}
