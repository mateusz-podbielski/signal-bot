export enum AddressUse {
  home = 'home',
  work = 'work',
  temp = 'temp',
  old = 'old',
  billing = 'billing',
}

export enum AddressType {
  postal = 'postal',
  physical = 'physical',
  both = 'both',
}

export interface Address {
  use: AddressUse;
  type: AddressType;
  text?: string;
  line: string[];
  postalCode: string;
  city: string;
  country: string;
}
