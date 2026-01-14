export enum FeedingMethod {
  oral = 'oral',
  probe = 'probe',
  peg = 'peg'
}

export enum FeedingType {
  house = 'house',
  commercial = 'commercial',
}

export enum FeedingOralType {
  liquid = 'liquid',
  solid = 'solid'
}

export interface Feeding {
  method: FeedingMethod;
  type: FeedingType;
  value: number;
  oralType?: FeedingOralType;
  meal?: Meal;
}

export enum Meal {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  SUPPER = 'SUPPER',
  SNACKS = 'SNACKS'
}
