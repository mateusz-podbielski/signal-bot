import { Types } from 'mongoose';

export class Validators {
    public static pwz(pwz: string): boolean {
        if (pwz.length !== 7) {
            return false;
        }
        const digits: string[] = (pwz).split('');
        const checksum: number = (
            parseInt(digits[1], 10)
            + 2 * parseInt(digits[2], 10)
            + 3 * parseInt(digits[3], 10)
            + 4 * parseInt(digits[4], 10)
            + 5 * parseInt(digits[5], 10)
            + 6 * parseInt(digits[6], 10)
        ) % 11;

        return parseInt(digits[0], 10) === checksum;
    }

    public static nipip(nipip: string): boolean {
        if (nipip.length !== 8) {
            return false;
        }
        return ['P', 'A'].includes(nipip[7]);
    }

    public static pwzfz(pwzfz: string): boolean {
        return pwzfz.length > 0
    }

  public static mongooseId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  public static phoneNumber(value: string): boolean {
    return /^48\d{9}$/.test(value);
  }
}
