import { Resource } from './resource';
import { Reference } from './reference';
import { Annotation } from './annotation';

/**
 * @link http://hl7.org/fhir/valueset-device-status.html
 */
export enum FhirDeviceStatus {
  active = 'active',
  inactive = 'inactive',
  enteredInError = 'entered-in-error',
  unknown = 'unknown',
}

export interface DeviceName {
  name: string;
  type: DeviceNameType;
}

export enum DeviceNameType {
  udiLabelName = 'udi-label-name',
  userFriendlyName = 'user-friendly-name',
  patientReportedName = 'patient-reported-name',
  manufacturerName = 'manufacturer-name',
  modelName = 'model-name',
  other = 'other'
}

/**
 * @link http://hl7.org/fhir/device.html
 */
export interface Device extends Resource {
  udiCarrier?: {
    deviceIdentifier: string;
  };
  status: FhirDeviceStatus;
  deviceName: DeviceName[];
  patient?: Reference;
  parent?: Reference;
  note?: Annotation[];
}

export interface DevicePayload {
  patientId: string;
  serialNumber?: string;
  name: string;
  model?: string;
  parent?: Reference;
}
