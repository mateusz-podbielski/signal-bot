import { check, query } from 'express-validator';

const DOCUMENT_TYPES = [
  'bill',
  'recipe',
  'medicalReport',
  'testResult',
  'otherMedical',
  'other'
];

export class Validators {
  public static createValidator = [
    check('title').exists().isString(),
    check('description').exists().isString(),
    check('patient').exists(),
    check('documentType').isIn(DOCUMENT_TYPES)
  ];

  public static shareCompositionValidator = [
    check('subject').isString(),
    check('email').isEmail(),
    check('message')
      .optional()
      .isString(),
    query('type')
      .isIn(['email'])
  ];
}
