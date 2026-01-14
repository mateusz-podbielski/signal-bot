import { ObservationType } from '@signalbot-backend/interfaces';

export interface DevicesMapItem {
  name: string;
  model: string;
}

export const devices: {[key: string]: DevicesMapItem} = {
  [ObservationType.BodyWeight]: {
    name: 'Waga TaiDoc model TD-2555',
    model: 'TD-2555'
  },
  [ObservationType.GlucoseLevel]: {
    name: 'Glukometr TaiDoc model TD-4277',
    model: 'TD-4277'
  },
  [ObservationType.BloodPressure]: {
    name: 'Ciśnieniomierz naramienny TaiDoc model TD-3140',
    model: 'TD-3140'
  },
  [ObservationType.HeartRate]: {
    name: 'Ciśnieniomierz naramienny TaiDoc model TD-3140',
    model: 'TD-3140'
  },
  [ObservationType.Saturation]: {
    name: 'Pulsoksymetr TaiDoc TD-8255',
    model: 'TD-8255'
  },
  [ObservationType.BodyTemp]: {
    name: 'Termometr bezdotykowy TaiDoc TD-1241',
    model: 'TD-1241'
  }
};
