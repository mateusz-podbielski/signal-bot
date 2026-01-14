import { DeviceObservationController, DevicesController } from '@signalbot-backend/controllers';
import { DateTime } from 'luxon';
import {
  BloodPressure,
  Device,
  Observation,
  ObservationMethod,
  ObservationPayload,
  ObservationType,
  ResourceType
} from '@signalbot-backend/interfaces';
import { units } from '../../interfaces/units';
import { devices, DevicesMapItem } from '../../interfaces/devices-map';
import { PressureItem } from '../../interfaces/pressure';

export class GenericController {
  private deviceController: DevicesController = new DevicesController();
  private deviceObservationController: DeviceObservationController = new DeviceObservationController();

  public saveSingleQuantityObservation(imei: string, value: number, et: number, type: ObservationType): Promise<Observation> {
    const payload: ObservationPayload = {
      value: {
        value,
        unit: units[type]
      },
      method: ObservationMethod.EQU,
      effective: GenericController.toISO(et)
    };
    return this.saveObservation(imei, payload, type);
  }

  public savePressure(imei: string, data: PressureItem): Promise<Observation[]> {
    const pressurePayload: ObservationPayload = {
      method: ObservationMethod.EQU,
      effective: GenericController.toISO(data.ET),
      value: [
        {
          value: data.D,
          unit: units[ObservationType.BloodPressure],
          code: BloodPressure.DIASTOLIC
        },
        {
          value: data.S,
          unit: units[ObservationType.BloodPressure],
          code: BloodPressure.SYSTOLIC
        }
      ]
    };

    const heartRatePayload: ObservationPayload = {
      method: ObservationMethod.EQU,
      effective: GenericController.toISO(data.ET),
      value: {
        value: data.P,
        unit: units[ObservationType.HeartRate]
      }
    };
    return Promise.all([
      this.saveObservation(imei, pressurePayload, ObservationType.BloodPressure),
      this.saveObservation(imei, heartRatePayload, ObservationType.HeartRate)
    ]);
  }

  private saveObservation(imei: string, payload: ObservationPayload, observationType: ObservationType): Promise<Observation> {
    return this.getMeasureDevice(imei, observationType)
      .then((device: Device) => this.deviceObservationController.create(
        device.patient,
        { type: ResourceType.Device, reference: `${ResourceType.Device}/${device.id}` },
        observationType,
        payload
        )
      );
  }

  private getMeasureDevice(imei: string, observationType: ObservationType): Promise<Device> {
    const device: DevicesMapItem = devices[observationType];
    return this.deviceController.getMeasureDevice(imei, device.model, device.name);
  }

  private static toISO(ET: number): string {
    return DateTime.fromSeconds(ET).toISO();
  }
}
