import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  BundleEntry,
  BundleResponse,
  ExtensionUrl,
  FhirResourceId,
  JsonPatch,
  JsonPatchOperation,
  Reference,
  ResourceType,
  Schedule,
  SchedulePayload
} from '@signalbot-backend/interfaces';
import { createReference } from './controller-tools';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class ScheduleController {
  private resource: FhirResource = new FhirResource(ResourceType.Schedule);

  public create(uid: string, payload: SchedulePayload): Promise<Schedule> {
    return this.payloadToResource(uid, payload)
      .then((schedule: Partial<Schedule>) => this.resource.create<Schedule>(schedule));
  }

  public readAll(uid: string): Promise<Schedule[]> {
    return FhirResource.getFhirResourceId(uid)
      .then((fhirResource: FhirResourceId) => this.resource.search<BundleResponse<Schedule>>(`actor=${fhirResource.resourceType}/${fhirResource.fhirId}`))
      .then((bundle: BundleResponse<Schedule>) => bundle.total > 0 ? bundle.entry.map((entry: BundleEntry<Schedule>) => entry.resource) : []);
  }

  public read(uid: string, id: string): Promise<Schedule> {
    return this.hasAccess(uid, id).then(() => this.resource.read<Schedule>(id));
  }

  public update(uid: string, id: string, payload: SchedulePayload): Promise<Schedule> {
    return this.hasAccess(uid, id)
      .then(() => this.payloadToResource(uid, payload))
      .then((schedule: Partial<Schedule>) => {
        const jsonPatch: JsonPatch[] = [
          {
            op: JsonPatchOperation.REPLACE,
            path: '/actor',
            value: schedule.actor
          },
          {
            op: JsonPatchOperation.REPLACE,
            path: '/planningHorizon',
            value: schedule.planningHorizon
          },
          {
            op: JsonPatchOperation.REPLACE,
            path: '/comment',
            value: schedule.comment
          },
          {
            op: JsonPatchOperation.REPLACE,
            path: '/extension/0/valueString',
            value: payload.name
          }
        ];
        return this.resource.update<Schedule>(id, jsonPatch);
      });
  }

  public updateActive(uid: string, id: string, active: boolean): Promise<Schedule> {
    const jsonPatch: JsonPatch[] = [
      {
        op: JsonPatchOperation.REPLACE,
        path: '/active',
        value: active
      }
    ];

    return this.hasAccess(uid, id).then(() => this.resource.update(id, jsonPatch));
  }

  public async delete(id: string, uid: string): Promise<void> {
    return this.hasAccess(uid, id).then(() => this.resource.delete(id));
  }

  private hasAccess(uid: string, id: string): Promise<void> {
    return Promise.all([this.resource.read<Schedule>(id), createReference(uid)])
      .then(([schedule, ref]: [Schedule, Reference]) => {
        if (schedule.actor[0].reference !== ref.reference) {
          throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Operation not permitted');
        }
        return void 0;
      });
  }

  private async payloadToResource(uid: string, payload: SchedulePayload): Promise<Partial<Schedule>> {
    return {
      resourceType: ResourceType.Schedule,
      active: true,
      actor: [
        await createReference(uid)
      ],
      planningHorizon: payload.planningHorizon,
      comment: payload.comment,
      extension: [
        {
          url: ExtensionUrl.name,
          valueString: payload.name
        }
      ]
    };
  }
}
