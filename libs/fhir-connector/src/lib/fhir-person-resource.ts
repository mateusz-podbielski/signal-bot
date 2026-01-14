import {
  AddressType,
  AddressUse,
  CodeableConcept,
  CodingSystem,
  ContactPoint, CountryCode,
  Gender, HumanName,
  Identifier,
  IdentifierCode,
  IdentifierUse,
  NameUse,
  Person,
  ResourceType
} from '@signalbot-backend/interfaces';
import { FhirResource } from './fhir-resource';

export class FhirPerson {
  private person: Person;

  constructor(resourceType = ResourceType.RelatedPerson) {
    this.person = {
      resourceType,
      gender: Gender.unknown,
      active: true,
      identifier: [],
      telecom: [],
      address: [
        {
          use: AddressUse.home,
          line: [''],
          type: AddressType.physical,
          postalCode: '',
          city: '',
          country: CountryCode.PL
        }
      ]
    };
  }

  public static humanName(name: HumanName[]): string {
    return `${name[0].given.join(' ')} ${name[0].family}`;
  }

  public static pesel(identifiers: Identifier[]): string {
    return identifiers.find((i: Identifier) => i.type.coding[0].code === 'PESEL').value || '';
  }

  public getResource<T>(): T {
    return (this.person as unknown) as T;
  }

  public setName(family: string, given: string[]): Person {
    this.person = {
      ...this.person,
      name: [{
        use: NameUse.official,
        family,
        given
      }]
    };
    return this.person;
  }

  public setContactPoint(contactPoints: ContactPoint[]): Person {
    this.person = {
      ...this.person,
      telecom: [...this.person.telecom, ...contactPoints]
    };
    return this.person;
  }

  public async setIdentifier(system: CodingSystem, code: IdentifierCode, value: string): Promise<Person> {
    const type: CodeableConcept = await FhirResource.codeableConceptBuilder(system, code);
    const identifier: Identifier = {
      system,
      value,
      type,
      use: IdentifierUse.official
    };
    this.person = {
      ...this.person,
      identifier: [...this.person.identifier, identifier]
    };
    return this.person;
  }
}
