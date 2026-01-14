import { Gender } from '@signalbot-backend/interfaces';
import { DateTime, Duration } from 'luxon';

export class PeselValidator {

  public static birthDate(pesel: string): Date {
    let year: number = parseInt(pesel.substring(0, 2), 10);
    let month: number = parseInt(pesel.substring(2, 4), 10) - 1;
    const day: number = parseInt(pesel.substring(4, 6), 10);

    if (month >= 80) {
      year += 1800;
      month = month - 80;
    } else if (month >= 60) {
      year += 2200;
      month = month - 60;
    } else if (month >= 40) {
      year += 2100;
      month = month - 40;
    } else if (month >= 20) {
      year += 2000;
      month = month - 20;
    } else {
      year += 1900;
    }

    const birthDate: Date = new Date();
    birthDate.setFullYear(year, month, day);
    return birthDate;
  }

  public static age(pesel: string): { years?: number, months?: number } {
    const duration: Duration = DateTime.local().diff(DateTime.fromJSDate(PeselValidator.birthDate(pesel)));
    const years: number = duration.as('years');
    if (Math.floor(years) === 0) {
      return { months: Math.floor(duration.as('months')) };
    }
    if (years !== Math.floor(years)) {
      const months: number = duration.as('months') - Math.floor(years) * 12;
      return { years: Math.floor(years), months: Math.floor(months) };
    }
    return { years };
  }

  public static sex(pesel: string): Gender {
    let gender: Gender = Gender.female;

    if (parseInt(pesel.substring(9, 10), 10) % 2 === 1) {
      gender = Gender.male;
    }

    return gender;
  }

  /**
   * Validate PESEL number
   * @param pesel PESEL number
   * @return boolean - PESEL is valid or invalid
   */
  public static validate(pesel: string): boolean {
    if (pesel === undefined || pesel.length < 11) {
      return false;
    }
    const weights: number[] = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      const sumWeight: number = (parseInt(pesel.substring(i, i + 1), 10) * weights[i]);
      if (sumWeight > 10) {
        sum += sumWeight % 10;
      } else {
        sum += sumWeight;
      }
    }
    sum = sum % 10;
    const controlNo: number = parseInt(pesel.substring(10, 11), 10);
    if (sum !== 0) {
      sum = 10 - sum;
    }
    return (sum === controlNo);
  }
}
