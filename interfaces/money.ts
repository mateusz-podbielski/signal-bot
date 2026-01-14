import { Currency } from './currency';

/**
 * @link http://hl7.org/fhir/datatypes.html#Money
 */
export interface Money {
  value: number;
  currency: Currency;
}
