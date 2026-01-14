export enum NameUse {
    usual = 'usual',
    official = 'official',
    temp = 'temp',
    nickname = 'nickname',
    anonymous = 'anonymous',
    old = 'old',
    maiden = 'maiden',
}
export interface HumanName {
    use: NameUse;
    text?: string;
    family: string;
    given: string[];
}
