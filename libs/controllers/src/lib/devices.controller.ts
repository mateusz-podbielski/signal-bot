import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  BundleResponse,
  Device,
  DeviceNameType,
  DevicePayload,
  FhirDeviceStatus,
  FhirResourceId,
  Reference,
  ResourceType
} from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { CareTeamController } from './care-team.controller';
import { bundleToResponse } from './controller-tools';

export class DevicesController {
  private deviceResource: FhirResource = new FhirResource(ResourceType.Device);

  /**
   * Creates the observation device for patient
   * @param uid user, who creates the device
   * @param devicePayload data to create the device
   * @return Promise with Device object
   */
  public async create(uid: string, devicePayload: DevicePayload): Promise<Device> {
    const patient: Reference = await FhirResource.getFhirResourceId(devicePayload.patientId)
      .then((fhirResId: FhirResourceId) => FhirResource.referenceBuilder(fhirResId.resourceType, fhirResId.fhirId));

    return new CareTeamController().sameCareTeam(uid, devicePayload.patientId)
      .then((theSame: boolean) => {
        if (theSame) return;
        throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'User and patient not in the same care team');
      })
      .then(() => this.createResource(devicePayload, patient));
  }

  /**
   * Get all devices registered fir patient
   * @param uid patient Mongo ID
   */
  public getDevices(uid: string): Promise<Device[]> {
    return FhirResource.getFhirResourceId(uid)
      .then((fhirResId: FhirResourceId) => FhirResource.referenceBuilder(fhirResId.resourceType, fhirResId.fhirId))
      .then((ref: Reference) => this.deviceResource.search<BundleResponse<Device>>(`patient=${ref.reference}`))
      .then((bundle: BundleResponse<Device>) => bundleToResponse<Device>(bundle));
  }

  public getBySerial(serialNumber: string): Promise<Device> {
    return this.deviceResource.search<BundleResponse<Device>>(`udi-di=${serialNumber}&status=${FhirDeviceStatus.active}`)
      .then((bundle: BundleResponse<Device>) => bundleToResponse<Device>(bundle))
      .then((data: Device | Device[]) => {
        if (Array.isArray(data) && !data.length) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'Can not find the active device with given serial number');
        }
        return Array.isArray(data) ? data[0] : data;
      });
  }

  public async getMeasureDevice(serialNumber: string, model: string, name: string): Promise<Device> {
    const device: Device = await this.getBySerial(serialNumber);
    const bundleResponse: BundleResponse<Device> = await this.deviceResource.search(`patient=${device.patient.reference}&device-name=${model}`);
    if (bundleResponse.total > 0) return bundleResponse.entry[0].resource;

    return this.createResource({
      parent: { type: ResourceType.Device, reference: `${ResourceType.Device}/${device.id}` },
      model,
      name,
      patientId: null
    }, device.patient);
  }

  private async createResource(devicePayload: DevicePayload, patient: Reference, parent?: Reference): Promise<Device> {
    const deviceData: Partial<Device> = {
      resourceType: ResourceType.Device,
      status: FhirDeviceStatus.active,
      deviceName: [{
        name: devicePayload.name,
        type: DeviceNameType.userFriendlyName
      }],
      patient
    };
    if (devicePayload.model) {
      deviceData.deviceName.push({
        name: devicePayload.model,
        type: DeviceNameType.modelName
      });
    }
    if (devicePayload.serialNumber) {
      deviceData.udiCarrier = {
        deviceIdentifier: devicePayload.serialNumber
      };
    }
    if (parent) {
      deviceData.parent = parent;
    }
    return this.deviceResource.create<Device>(deviceData);
  }
}
