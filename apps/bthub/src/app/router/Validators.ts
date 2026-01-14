import { check, body } from 'express-validator';
import { WeightItem } from '../../interfaces/weight';
import { GlucoseItem } from '../../interfaces/glucose';
import { PressureItem } from '../../interfaces/pressure';
import { SaturationItem, TemperatureItem } from '../../interfaces/liveSpO2Temp';

export class Validators {
  public static weightValidator = [
    check('W').isArray({ min: 1 }).withMessage('W should be array'),
    body('W').custom(Validators.weightCustomValidator)
  ];

  public static glucoseValidator = [
    check('G').isArray({ min: 1 }).withMessage('W should be array'),
    body('G').custom(Validators.glucoseCustomValidator)
  ];

  public static pressureValidator = [
    check('P').isArray({ min: 1 }).withMessage('P should be array'),
    body('P').custom(Validators.pressureCustomValidator)
  ];

  public static saturationValidator = [
    check('Oxi')
      .optional()
      .isArray({ min: 1 }).withMessage('Oxi should be array'),
    body('Oxi').custom(Validators.saturationCustomValidator),
    body('T').custom(Validators.temperatureCustomValidator),
  ];

  private static weightCustomValidator(value: WeightItem[]): boolean {
    value.forEach((w: WeightItem) => {
      if (typeof (w.W) !== 'number') throw new Error('Incorrect W property');
      if (typeof (w.ET) !== 'number') throw new Error('Incorrect ET property');
    });
    return true;
  }

  private static glucoseCustomValidator(value: GlucoseItem[]): boolean {
    value.forEach((w: GlucoseItem) => {
      if (typeof (w.G) !== 'number') throw new Error('Incorrect G property');
      if (typeof (w.ET) !== 'number') throw new Error('Incorrect ET property');
    });
    return true;
  }

  private static pressureCustomValidator(value: PressureItem[]): boolean {
    value.forEach((p: PressureItem) => {
      if (typeof (p.S) !== 'number') throw new Error('Incorrect S property');
      if (typeof (p.D) !== 'number') throw new Error('Incorrect D property');
      if (typeof (p.ET) !== 'number') throw new Error('Incorrect ET property');
    });
    return true;
  }

  private static saturationCustomValidator(value: SaturationItem[]): boolean {
    if (value === undefined) return true;
    value.forEach((p: SaturationItem) => {
      if (typeof (p.S) !== 'number') throw new Error('Incorrect S property');
      if (typeof (p.P) !== 'number') throw new Error('Incorrect P property');
      if (typeof (p.ET) !== 'number') throw new Error('Incorrect ET property');
    });
    return true;
  }

  private static temperatureCustomValidator(value: TemperatureItem[]): boolean {
    if (value === undefined) return true;
    value.forEach((p: TemperatureItem) => {
      if (typeof (p.T) !== 'number') throw new Error('Incorrect T property');
      if (typeof (p.ET) !== 'number') throw new Error('Incorrect ET property');
    });
    return true;
  }
}
