export enum QuantityComparator {
  lt = '<',
  lte = '<=',
  gt = '>',
  gte = '>=',
}

/**
 * @link https://hl7.org/FHIR/datatypes.html#Quantity
 */
export interface Quantity {
  value: number;
  unit: string;
  comparator?: QuantityComparator;
  code?: string;
}

