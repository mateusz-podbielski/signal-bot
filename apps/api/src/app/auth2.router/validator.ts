import { query } from 'express-validator';
const GRANT_TYPES: string[] = ['auth_token', 'refresh_token'];
export class Validator {
  public static getRefreshToken = [
    query('client_id').isString().withMessage('Missing client_id query param'),
    query('token').isString().withMessage('Missing auth token query param'),
    query('grant_type').isIn(GRANT_TYPES).withMessage('Missing or incorrect grant_type query param'),
  ];
}
