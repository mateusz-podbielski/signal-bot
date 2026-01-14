import { Validators } from './validators';

describe('Validators', () => {
  it('phoneNumber should be valid', () => {
    expect(Validators.phoneNumber('48666555444')).toBeTruthy();
  });

  it('phoneNumber should be invalid', () => {
    ['666555444', '111111111', '1111'].forEach((phoneNumber: string) => {
      expect(Validators.phoneNumber(phoneNumber)).toBeFalsy();
    });
  });

  it('mongooseId should be valid', () => {
    ['60c1a2a8d84cb06be2bda694', '60c1b6e98d9fea09cac716e3', '60e9b72dd206f9157e728f7f'].forEach((value: string) => {
      expect(Validators.mongooseId(value)).toBeTruthy();
    });
  });

  it('mongooseId should be inValid', () => {
    ['60c1a2a8d84cb06be2bda69s', '60c1b6e98d9fhhhea09cac716e3', '123456'].forEach((value: string) => {
      expect(Validators.mongooseId(value)).toBeFalsy();
    });
  });

  it('pwz should be valid', () => {
    ['5735270', '1724412', '5842617', '1552438', '4152794'].forEach((value: string) => {
      expect(Validators.pwz(value)).toBeTruthy();
    });
  });

  it('pwz should be inValid', () => {
    ['573527', '17244124', '5842617a', '00000', ''].forEach((value: string) => {
      expect(Validators.pwz(value)).toBeFalsy();
    });
  });

  it('nipip should be valid', () => {
    ['2140402P', '3253485P', '1659831P', '1659831A'].forEach((value: string) => {
      expect(Validators.nipip(value)).toBeTruthy();
    });
  });

  it('nipip should be valid', () => {
    ['2140402', '3253485', '1659831Z', '1659831K', 'AAAA', '12345'].forEach((value: string) => {
      expect(Validators.nipip(value)).toBeFalsy();
    });
  });
});
