import { ObservationType } from '@signalbot-backend/interfaces';

export const units: {[key: string]: string} = {
  [ObservationType.BodyWeight]: 'kg',
  [ObservationType.GlucoseLevel]: 'mg/dL',
  [ObservationType.BloodPressure]: 'mmHg',
  [ObservationType.HeartRate]: 'bps',
  [ObservationType.Saturation]: '%',
  [ObservationType.BodyTemp]: 'Cel'
};
