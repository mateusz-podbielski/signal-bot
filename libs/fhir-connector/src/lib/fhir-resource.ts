import axios, { AxiosResponse, AxiosInstance } from 'axios';
import {
  ResourceType,
  Reference,
  JsonPatch,
  CodeableConcept,
  CodingSystem,
  ValueSetsResponse, ValueSetItem, FhirResourceId, DBUser
} from '@signalbot-backend/interfaces';
import { conf } from '@conf';
import { UserModel } from '@signalbot-backend/schemas';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { rolesMap } from '@signalbot-backend/roles-map';

export class FhirResource {
  public resourceType: ResourceType;
  private http: AxiosInstance;

  private static fhirUrl: string = process.env.BACKEND_FHIR_URL || conf.BACKEND_FHIR_URL;
  private static fhirPort: string = process.env.BACKEND_FHIR_PORT || conf.BACKEND_FHIR_PORT;
  private static FHIR_URL = `${FhirResource.fhirUrl}:${FhirResource.fhirPort}/fhir`;

  constructor(resourceType: ResourceType) {
    this.resourceType = resourceType;
    this.http = axios.create({
      baseURL: FhirResource.FHIR_URL
    });
  }

  /**
   * Builds proper internal reference for Fhir resource
   * @param resourceType
   * @param resourceId
   */
  public static referenceBuilder(resourceType: ResourceType, resourceId: string): Reference {
    return {
      type: resourceType,
      reference: `${resourceType}/${resourceId}`
    };
  }

  private static async getValueSet(system: CodingSystem, code: unknown): Promise<ValueSetItem> {
    const response: ValueSetItem[] = await axios.get<ValueSetsResponse>(`${FhirResource.FHIR_URL}${system}`)
      .then((response: AxiosResponse) => response.data.compose.include[0].concept)
      .catch(err => console.log(err));
    return response.find((item: ValueSetItem) => item.code == code);
  }

  public static async codeableConceptBuilder(system: CodingSystem, code: unknown): Promise<CodeableConcept> {
    const valueSetItem: ValueSetItem = await FhirResource.getValueSet(system, code);
    if (valueSetItem === undefined) {
      throw new CustomError(ErrorCode.UNEXPECTED_ERROR, `ValueSet item not found`, { system, code });
    }
    return {
      coding: [{
        system,
        code,
        display: valueSetItem.display
      }],
      text: valueSetItem.display
    };
  }

  /**
   * Returns User Fhir resource id and its ResourceType
   * @param uid
   * @return resource id and type
   */
  public static getFhirResourceId(uid: string): Promise<FhirResourceId> {
    return UserModel
      .findById(uid, { fhirId: 1, roles: 1 })
      .then((user: DBUser | null) => {
        if (user === null || user.fhirId === undefined) {
          throw new CustomError(ErrorCode.USER_NOT_FOUND);
        }
        return {
          fhirId: user.fhirId,
          resourceType: rolesMap[user.roles[0]] || ResourceType.Person
        };
      });
  }

  public create<T>(data: Partial<T>): Promise<T> {
    return this.http.post(`/${this.resourceType}`, data).then((response: AxiosResponse) => response.data);
  }

  public read<T>(id?: string): Promise<T> {
    const url: string = id ? `/${this.resourceType}/${id}` : `/${this.resourceType}`;
    return this.http.get<T>(url).then((response: AxiosResponse<T>) => response.data);
  }

  /**
   * Updates the Fhir resource
   * @param id identifier of resource to update
   * @param data data to update in json+patch format
   */
  public update<T>(id: string, data: JsonPatch[]): Promise<T> {
    return this.http.patch<T>(
      `/${this.resourceType}/${id}`,
      data,
      { headers: { 'Content-Type': 'application/json-patch+json' } }
    ).then((response: AxiosResponse<T>) => response.data);
  }

  public updatePut<T>(id: string, data: Partial<T>): Promise<T> {
    return this.http.put<T>(
      `/${this.resourceType}/${id}`,
      { ...data, id },
      { headers: { 'Content-Type': 'application/json' } }
    ).then((response: AxiosResponse<T>) => response.data);
  }

  public search<T>(searchParams: string): Promise<T> {
    return this.http.get<T>(`/${this.resourceType}?${searchParams}`).then((response: AxiosResponse<T>) => response.data);
  }

  public delete(id: string): Promise<void> {
    return this.http.delete(`/${this.resourceType}/${id}`).then(() => void 0);
  }
}
