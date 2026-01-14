import { DateTime } from 'luxon';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  Appointment,
  AppointmentParticipant,
  AppointmentParticipantRequired,
  AppointmentParticipantRole,
  AppointmentParticipantStatus,
  AppointmentPayload,
  AppointmentStatus,
  BundleResponse,
  CodingSystem,
  DateRangeWithLimit,
  FhirResourceId,
  JsonPatch,
  JsonPatchOperation,
  PractitionerRole,
  PractitionerRoleCode,
  Reference,
  Resource,
  ResourceType
} from '@signalbot-backend/interfaces';
import { bundleToResponse, createReference, searchQuery } from './controller-tools';
import { PractitionerController } from './practitioner.controller';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class AppointmentController {
  private resource: FhirResource = new FhirResource(ResourceType.Appointment);

  public async create(uid: string, payload: AppointmentPayload): Promise<Appointment> {
    return AppointmentController.payloadToResource(uid, payload)
      .then((data: Partial<Appointment>) => this.resource.create<Appointment>(data));
  }

  public getAppointment(uid: string, appointmentId: string): Promise<Appointment> {
    return this.isAppointmentActor(uid, appointmentId)
      .then(() => this.resource.read<Appointment>(appointmentId));
  }

  public getAllForActor(uid: string, query: DateRangeWithLimit): Promise<Appointment[]> {
    return createReference(uid).then((ref: Reference) => {
      const searchQueryWithActor = `actor=${ref.reference}&${searchQuery(query)}`;
      return this.resource.search<BundleResponse<Appointment>>(searchQueryWithActor);
    })
      .then((bundle: BundleResponse<Appointment>) => bundleToResponse<Appointment>(bundle));
  }

  public patchAppointmentStatus(uid: string, appointmentId: string, status: AppointmentStatus): Promise<Appointment> {
    return this.isAppointmentActor(uid, appointmentId)
      .then(() => {
        const jsonPatch: JsonPatch[] = [
          {
            op: JsonPatchOperation.REPLACE,
            path: '/status',
            value: status
          }
        ];
        return this.resource.update<Appointment>(appointmentId, jsonPatch);
      });
  }

  public patchAppointmentParticipant(uid: string, appointmentId: string, participantId: string): Promise<Appointment> {
    return this.isAppointmentActor(uid, appointmentId)
      .then(() => Promise.all([
        this.resource.read<Appointment>(appointmentId).then((appointment: Appointment) => appointment.participant.length),
        AppointmentController.participant(participantId)
      ]))
      .then(([index, participant]: [number, AppointmentParticipant]) => {
        const jsonPatch: JsonPatch[] = [
          {
            op: JsonPatchOperation.ADD,
            path: `/participant/${index}`,
            value: participant
          }
        ];
        return this.resource.update<Appointment>(appointmentId, jsonPatch);
      });
  }

  public putAppointment(uid: string, appointmentId: string, payload: AppointmentPayload): Promise<Appointment> {
    return this.isAppointmentActor(uid, appointmentId)
      .then(() => AppointmentController.payloadToResource(uid, payload))
      .then((data: Partial<Appointment>) => this.resource.updatePut<Appointment>(appointmentId, data));
  }

  public deleteAppointmentParticipant(uid: string, appointmentId: string, participantRef: string): Promise<Appointment> {
    return this.isAppointmentActor(uid, appointmentId)
      .then(() => this.resource.read<Appointment>(appointmentId))
      .then((appointment: Appointment) => appointment.participant.findIndex((participant: AppointmentParticipant) => participant.actor.reference === participantRef))
      .then((index: number) => {
        const jsonPatch: JsonPatch[] = [
          {
            op: JsonPatchOperation.REMOVE,
            path: `/participant/${index}`
          }
        ];
        return this.resource.update<Appointment>(appointmentId, jsonPatch);
      });
  }

  public async deleteAppointment(uid: string, appointmentId: string): Promise<void> {
    const appointment: Appointment = await this.resource.read<Appointment>(appointmentId);
    if (appointment.participant.length >= 2) {
      throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Can not delete appointment with more then two participants');
    }
    return this.isAppointmentActor(uid, appointmentId).then(() => this.resource.delete(appointmentId));
  }

  private async isAppointmentActor(uid: string, appointmentId: string): Promise<void> {
    return Promise.all([
      createReference(uid),
      this.resource.read<Appointment>(appointmentId)
    ])
      .then(([ref, appointment]: [Reference, Appointment]) => {
        const actor: AppointmentParticipant = appointment.participant.find((participant: AppointmentParticipant) => participant.actor.reference === ref.reference);
        return actor !== undefined;
      })
      .then((isActor: boolean) => {
        if (!isActor) {
          throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only appointment actor can change the appointment status');
        }
        return;
      });
  }

  private static async payloadToResource(uid: string, payload: AppointmentPayload): Promise<Partial<Appointment>> {
    const data: Partial<Appointment> = {
      resourceType: ResourceType.Appointment,
      status: AppointmentStatus.proposed,
      description: payload.description,
      participant: [
        {
          required: AppointmentParticipantRequired.required,
          status: AppointmentParticipantStatus.tentative,
          actor: await createReference(payload.patient),
          type: [await FhirResource.codeableConceptBuilder(CodingSystem.AppointmentParticipantRole, AppointmentParticipantRole.PATIENT)]
        }
      ],
      created: DateTime.local().toISO(),
      start: payload.start,
      end: payload.end,
    };
    data.participant.push(await AppointmentController.participant(payload.specialist));
    if (uid !== payload.specialist && uid !== payload.patient) {
      data.participant.push(await AppointmentController.participant(uid));
    }
    return data;
  }

  private static async participant(uid: string): Promise<AppointmentParticipant> {
    const fhirRes: Resource = await FhirResource.getFhirResourceId(uid)
      .then((fhirResId: FhirResourceId) => new FhirResource(fhirResId.resourceType).read(fhirResId.fhirId));

    let role: AppointmentParticipantRole;

    switch (fhirRes.resourceType) {
      case ResourceType.RelatedPerson:
        role = AppointmentParticipantRole.RELATED;
        break;
      case ResourceType.Practitioner:
        role = await AppointmentController.practitionerRole(uid);
        break;
      default:
        role = AppointmentParticipantRole.OTHER;
        break;
    }

    return {
      required: AppointmentParticipantRequired.required,
      status: AppointmentParticipantStatus.tentative,
      actor: await createReference(uid),
      type: [await FhirResource.codeableConceptBuilder(CodingSystem.AppointmentParticipantRole, role)]
    };
  }

  private static async practitionerRole(practitioner: string): Promise<AppointmentParticipantRole> {
    const practitionerRole: PractitionerRole = await new PractitionerController().getPractitionerRoleResource(practitioner);
    switch (practitionerRole.code[0].coding[0].code as PractitionerRoleCode) {
      case PractitionerRoleCode.PHY:
        return AppointmentParticipantRole.DOCTOR;
      case PractitionerRoleCode.NRS:
        return AppointmentParticipantRole.NURSE;
      case PractitionerRoleCode.THE:
        return AppointmentParticipantRole.THERAP;
      case PractitionerRoleCode.PSY:
        return AppointmentParticipantRole.THERAP;
      case PractitionerRoleCode.OTH:
        return AppointmentParticipantRole.OTHER;
    }
  }
}
