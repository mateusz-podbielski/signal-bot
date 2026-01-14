import {
  CodeableConcept,
  CodingSystem,
  Observation,
  ObservationMethod,
  ObservationPayload,
  ObservationStatus,
  ObservationType, Quantity,
  Reference,
  ResourceType
} from '@signalbot-backend/interfaces';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import { ObservationController } from './observation.controller';

export class DeviceObservationController {
  private resource: FhirResource = new FhirResource(ResourceType.Observation);

  public create(patientRef: Reference, deviceRef: Reference, type: ObservationType, payload: ObservationPayload): Promise<Observation> {
    return DeviceObservationController.bodyObservation(patientRef, deviceRef, type, payload)
      .then((data: Partial<Observation>) => this.resource.create<Observation>(data))
  }

  private static async bodyObservation(patientRef: Reference, deviceRef: Reference, type: ObservationType, payload: ObservationPayload): Promise<Partial<Observation>> {
    const data: Partial<Observation> = {
      ...await DeviceObservationController.observation(patientRef, deviceRef, type, payload),
    };

    switch(type) {
      case ObservationType.BloodPressure:
        return {
          ...data,
          component: ObservationController.bloodPressureComponent(payload.value as Quantity[])
        }
      default:
        return {
          ...data,
          valueQuantity: payload.value as Quantity,
        }
    }
  }

  private static observation(patientRef: Reference, deviceRef: Reference, type: ObservationType, payload: ObservationPayload): Promise<Partial<Observation>> {
    return Promise.all([
      FhirResource.codeableConceptBuilder(CodingSystem.ObservationType, type),
      FhirResource.codeableConceptBuilder(CodingSystem.ObservationMethod, ObservationMethod.EQU)
    ])
      .then(([typeCode, methodCode]: [CodeableConcept, CodeableConcept]) => {
        return {
          resourceType: ResourceType.Observation,
          status: ObservationStatus.registered,
          subject: patientRef,
          performer: [patientRef],
          code: typeCode,
          method: methodCode,
          effectiveDateTime: payload.effective,
          device: deviceRef,
        };
      })
  }

}
