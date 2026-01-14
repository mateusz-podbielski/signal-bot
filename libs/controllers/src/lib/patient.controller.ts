import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  BundleEntry,
  BundleResponse, DBUser,
  Identifier,
  IdentifierCode,
  Patient,
  ResourceType
} from '@signalbot-backend/interfaces';
import { CareTeamController } from './care-team.controller';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { UserModel } from '@signalbot-backend/schemas';

export class PatientController {
  private patientResource: FhirResource = new FhirResource(ResourceType.Patient);
  private careTeamController: CareTeamController = new CareTeamController();

  private pesel(): Promise<string[]> {
    return this.patientResource.read<BundleResponse<Patient>>()
      .then((bundle: BundleResponse<Patient>) => bundle.total > 0 ? bundle.entry : [])
      .then((entries: BundleEntry<Patient>[]) => entries.map(PatientController.getPesel));
  }

  private static getPesel(entry: BundleEntry<Patient>): string {
    const identifiers: Identifier[] = entry.resource.identifier;
    return identifiers.find((identifier: Identifier) => identifier.type.coding[0].code === IdentifierCode.PESEL).value;
  }

  public isUniquePESEL(pesel: string): Promise<boolean> {
    return this.patientResource.search<BundleResponse<Patient>>(`identifier=${pesel}`)
      .then((bundle: BundleResponse<Patient>) => bundle.total === 0);
  }

  public lastLogin(uid: string, patientId: string): Promise<string> {
    return this.careTeamController.sameCareTeam(uid, patientId)
      .then((same: boolean) => same ? null : Promise.reject(new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only same care tem member can access patient data')))
      .then(() => UserModel.findById(patientId, {lastLogin: 1}))
      .then((user: DBUser) => user.lastLogin);
  }
}
