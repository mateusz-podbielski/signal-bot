import { PeselValidator } from '@signalbot-backend/validators';
import { Gender } from '@signalbot-backend/interfaces';

const pesels: string[] = [
  '68100612246', '63022297683', '71060774383',
  '04212999439', '94072336994', '96052653341',
  '57062923574', '95040969321', '74071358483', '50100924445'
];
const zeroPesel: string[] = [
  '09271924534',
  '07220989522',
  '08211477152',
  '07310791396',
  '08300614936',
  '06273048552',
  '08210355783',
  '09260873579',
  '08252612279',
  '07320791687'
];
const woPesel: string[] = [
  '49020421952',
  '78040459579',
  '75051819659',
  '74110935156',
  '78012579478',
  '95062441797',
  '53121185792',
  '67010284471',
  '56021384236',
  '54072857273'
];
const mPesel: string[] = ['50051158788',
  '85081872447',
  '56101079627',
  '65040784826',
  '66020439141',
  '76061629168',
  '78021131427',
  '02251675545',
  '87091369281',
  '82010368929'
];
const datePesel: string[] = ['00210183247',
  '00210169926',
  '00210149913',
  '00210149463',
  '00210192515',
  '00210159732',
  '00210188891',
  '00210194845',
  '00210151451',
  '00210119167'
];

describe('Pesel Validator', () => {
  it('pesel should be valid', () => {
    [...pesels, ...zeroPesel, ...woPesel, ...mPesel, ...datePesel].forEach((pesel: string) => {
      expect(PeselValidator.validate(pesel)).toBeTruthy();
    });
  });

  it('pesel should gave male sex', () => {
    woPesel.forEach((pesel: string) => {
      expect(PeselValidator.sex(pesel)).toEqual(Gender.male);
    });
  });

  it('pesel should gave female sex', () => {
    mPesel.forEach((pesel: string) => {
      expect(PeselValidator.sex(pesel)).toEqual(Gender.female);
    });
  });

  it('pesel should give correct date', () => {
    [...datePesel].forEach((pesel: string) => {
      expect(PeselValidator.birthDate(pesel).getDate()).toEqual(1);
      expect(PeselValidator.birthDate(pesel).getMonth()).toEqual(0);
      expect(PeselValidator.birthDate(pesel).getFullYear()).toEqual(2000);
    });
  });
});
