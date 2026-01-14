import {Period} from './period';

export enum ContactPointSystem {
    phone = 'phone',
    fax = 'fax',
    email = 'email',
    pager = 'pager',
    url = 'url',
    sms = 'sms',
    other = 'other',
}

export enum ContactPointUse {
    home = 'home',
    work = 'work',
    temp = 'temp',
    old = 'old',
    mobile = 'mobile'
}
export interface ContactPoint {
    system: ContactPointSystem;
    value : string;
    use : ContactPointUse;
    rank?: number;
    period? : Period;
}
