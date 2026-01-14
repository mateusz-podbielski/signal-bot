export interface SaturationItem {
  ET: number;
  S: number;
  P: number;
}

export interface TemperatureItem {
  T: number;
  ET: number;
}
export interface LiveSpO2Temp {
  Oxi?: SaturationItem[];
  T?: TemperatureItem[];
}
