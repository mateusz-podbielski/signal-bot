import { DateTime } from 'luxon';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  Annotation,
  BundleEntry,
  BundleResponse,
  CodingSystem,
  FhirResourceId,
  JsonPatch,
  JsonPatchOperation,
  Reference,
  ResourceType,
  ServiceRequest,
  ServiceRequestPayload,
  ServiceRequestPriority,
  ServiceRequestStatus
} from '@signalbot-backend/interfaces';
import { getFhirResourceId } from '@signalbot-backend/user-resource';

export class ServiceRequestController {
  private fhirResource: FhirResource = new FhirResource(ResourceType.ServiceRequest);

  public create(payload: ServiceRequestPayload, uid: string): Promise<ServiceRequest> {
    return ServiceRequestController.payloadToResource(payload, uid)
      .then((data: Partial<ServiceRequest>) => this.fhirResource.create({
        ...data,
        resourceType: ResourceType.ServiceRequest
      }));
  }

  public read(uid: string, id?: string): Promise<ServiceRequest | ServiceRequest[]> {
    return this.fhirResource.read(id);
  }

  public readAll(uid: string, query: { [key: string]: string }): Promise<ServiceRequest | ServiceRequest[]> {
    return getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) => this.fhirResource.search<BundleResponse<ServiceRequest>>(this.readAllSearch(fhirResourceId.fhirId, query)))
      .then((bundle: BundleResponse<ServiceRequest>) => bundle.total > 0 ? bundle.entry.map((entry: BundleEntry<ServiceRequest>) => entry.resource) : []);

  }

  public update(uid: string, id: string, payload: ServiceRequestPayload): Promise<ServiceRequest> {
    return ServiceRequestController.payloadToResource(payload, uid)
      .then((serviceRequestData: Partial<ServiceRequest>) => {
        return this.fhirResource.updatePut<ServiceRequest>(id, {
          ...serviceRequestData,
          resourceType: ResourceType.ServiceRequest
        });
      });
  }

  public changeStatus(id: string, value: ServiceRequestStatus): Promise<ServiceRequest> {
    const patchData: JsonPatch = {
      op: JsonPatchOperation.REPLACE,
      path: '/status',
      value
    };
    return this.fhirResource.update(id, [patchData]);
  }

  public delete(id: string): Promise<void> {
    return this.fhirResource.delete(id);
  }

  private readAllSearch(fhirId: string, query: { [key: string]: string }): string {
    const search: string[] = [
      `requester=${fhirId}`,
    ];
    if (query.from) {
      search.push(`occurrence=gt${query.from}`);
    }
    if (query.to) {
      search.push(`occurrence=lt${query.to}`);
    }
    if (query.date) {
      search.push(`occurrence=eq${query.date}`);
    }
    return search.join('&');
  }

  private static async payloadToResource(payload: ServiceRequestPayload, uid: string): Promise<Partial<ServiceRequest>> {
    return {
      status: ServiceRequestStatus.active,
      priority: ServiceRequestPriority.routine,
      occurrenceDateTime: payload.occurrenceDateTime,
      code: await FhirResource.codeableConceptBuilder(CodingSystem.ServiceRequestType, payload.code),
      subject: await ServiceRequestController.referenceFromUid(payload.patientId),
      requester: await ServiceRequestController.referenceFromUid(uid),
      performer: await ServiceRequestController.referenceFromUid(payload.performerId),
      note: [await ServiceRequestController.createAnnotation(payload.noteText, uid)]
    };
  }

  private static referenceFromUid(uid: string): Promise<Reference> {
    return getFhirResourceId(uid)
      .then((fhirResource: FhirResourceId) => FhirResource.referenceBuilder(fhirResource.resourceType, fhirResource.fhirId));
  }

  private static async createAnnotation(text: string, uid: string): Promise<Annotation> {
    return {
      text,
      time: DateTime.local().toISODate(),
      authorReference: await getFhirResourceId(uid)
        .then((fhirResourceId: FhirResourceId) => FhirResource.referenceBuilder(fhirResourceId.resourceType, fhirResourceId.fhirId))
    };
  }
}
