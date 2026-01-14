import { DateTime } from 'luxon';
import { flatten } from 'lodash';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  BloodPressure,
  BloodTypeElement,
  BloodTypePayload,
  BMIInterpretation,
  BmiResponse,
  BundleResponse,
  CodeableConcept,
  CodingSystem,
  DateRangeWithLimit,
  Feeding,
  FeedingMethod,
  FhirResourceId,
  Observation,
  OBSERVATION_TYPES,
  ObservationComponent,
  ObservationMethod,
  ObservationPayload,
  ObservationsMap,
  ObservationStatus,
  ObservationType,
  Patient,
  Quantity,
  Reference,
  ResourceType
} from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { bundleToResponse, createReference, searchQuery } from './controller-tools';
import { ReferenceRangeController } from './reference-range.controller';
import { CareTeamController } from './care-team.controller';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { MakePdf, ObservationsReport } from '@signalbot-backend/make-pdf';

export class ObservationController {
  private resource: FhirResource = new FhirResource(ResourceType.Observation);
  private referencesController = new ReferenceRangeController();
  private careTeamController = new CareTeamController();
  private patientResource: FhirResource = new FhirResource(ResourceType.Patient);
  private observationsReport: ObservationsReport = new ObservationsReport();
  private makePdf: MakePdf = new MakePdf();

  public async create(uid: string, type: ObservationType, payload: ObservationPayload): Promise<Observation> {
    let data: Partial<Observation>;
    switch (type) {
      case ObservationType.BodyHeight:
        data = await this.bodyObservation(uid, type, payload);
        break;
      case ObservationType.BodyWeight:
        data = await this.bodyObservation(uid, type, payload);
        break;
      case ObservationType.Activity:
        data = await this.activity(uid, payload);
        break;
      case ObservationType.HeartRate:
        data = await this.heartRate(uid, payload);
        break;
      case ObservationType.Mood:
        data = await this.mood(uid, payload);
        break;
      case ObservationType.GlucoseLevel:
        data = await this.glucoseLevel(uid, payload);
        break;
      case ObservationType.BodyTemp:
        data = await this.bodyTemp(uid, payload);
        break;
      case ObservationType.Pain:
        data = await this.pain(uid, payload);
        break;
      case ObservationType.BloodPressure:
        data = await this.bloodPressure(uid, payload);
        break;
      case ObservationType.Feeding:
        data = await this.feeding(uid, payload);
        break;
      case ObservationType.BloodType:
        data = await this.bloodType(uid, payload);
        break;
    }

    return this.resource.create<Observation>(data);
  }

  public async updateBloodType(uid: string, payload: ObservationPayload): Promise<Observation> {
    const data: Partial<Observation> = await this.bloodType(uid, payload);
    return this.checkAllowed(uid, payload.patient).then(() => FhirResource.getFhirResourceId(payload.patient))
      .then((fhirResourceId: FhirResourceId) => fhirResourceId.fhirId)
      .then((patientId: string) => this.readLastForPatient(patientId, ObservationType.BloodType))
      .then((observation: Observation) => observation.id)
      .then((observationId: string) => this.resource.updatePut<Observation>(observationId, data));
  }

  public readAllForType(uid: string, type: ObservationType, query: DateRangeWithLimit): Promise<Observation[]> {
    return createReference(uid)
      .then((ref: Reference) => this.resource.search<BundleResponse<Observation>>(`performer=${ref.reference}&code=${type}&${searchQuery(query)}`))
      .then((bundle: BundleResponse<Observation>) => bundleToResponse<Observation>(bundle));
  }

  public async readAllForPatient(uid: string, patientId: string, queryData: DateRangeWithLimit): Promise<Observation[]> {
    return this.checkAllowed(uid, patientId)
      .then(() => createReference(patientId))
      .then((ref: Reference) => this.resource.search<BundleResponse<Observation>>(`subject=${ref.reference}&${searchQuery(queryData)}`))
      .then((bundle: BundleResponse<Observation>) => bundleToResponse<Observation>(bundle));
  }

  public readByTypeForPatient(uid: string, patientId: string, type: ObservationType, queryData: DateRangeWithLimit): Promise<Observation[]> {
    return this.checkAllowed(uid, patientId)
      .then(() => createReference(patientId))
      .then((ref: Reference) => this.resource.search<BundleResponse<Observation>>(`subject=${ref.reference}&code=${type}&${searchQuery(queryData)}`))
      .then((bundle: BundleResponse<Observation>) => bundleToResponse<Observation>(bundle));
  }

  public readAll(uid: string, query: DateRangeWithLimit): Promise<Observation[]> {
    return createReference(uid)
      .then((ref: Reference) => this.resource.search<BundleResponse<Observation>>(`performer=${ref.reference}&${searchQuery(query)}`))
      .then((bundle: BundleResponse<Observation>) => bundleToResponse<Observation>(bundle));
  }

  public readLast(uid: string, patientId: string): Promise<ObservationsMap> {
    const promises: Promise<Observation[]>[] =
      OBSERVATION_TYPES.map((type: string) =>
        this.resource.search(`code=${type}&_count=1`)
          .then((bundle: BundleResponse<Observation>) => bundleToResponse<Observation>(bundle))
      );

    return this.checkAllowed(uid, patientId)
      .then(() => Promise.all(promises))
      .then((observations: Observation[][]) => flatten<Observation>(observations))
      .then((observations: Observation[]) => {
        return {
          [ObservationType.BodyHeight]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.BodyHeight) || null,
          [ObservationType.BodyWeight]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.BodyWeight) || null,
          [ObservationType.BodyTemp]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.BodyTemp) || null,
          [ObservationType.Feeding]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.Feeding) || null,
          [ObservationType.Mood]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.Mood) || null,
          [ObservationType.Pain]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.Pain) || null,
          [ObservationType.HeartRate]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.HeartRate) || null,
          [ObservationType.GlucoseLevel]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.GlucoseLevel) || null,
          [ObservationType.Activity]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.Activity) || null,
          [ObservationType.BloodPressure]: observations.find((o: Observation) => o.code.coding[0].code === ObservationType.BloodPressure) || null
        } as ObservationsMap;
      });
  }

  public async bmi(uid: string, patientId: string): Promise<BmiResponse> {
    return this.checkAllowed(uid, patientId).then(() => FhirResource.getFhirResourceId(uid))
      .then((fhirResourceId: FhirResourceId) => fhirResourceId.fhirId)
      .then((patientId: string) => Promise.all([
        this.readLastForPatient(patientId, ObservationType.BodyWeight)
          .then((observation: Observation) => observation.valueQuantity.value),
        this.readLastForPatient(patientId, ObservationType.BodyHeight)
          .then((observation: Observation) => observation.valueQuantity.value)
      ]))
      .then(([weight, height]: [number, number]) => weight / Math.pow((height / 100), 2))
      .then((value: number) => parseFloat(value.toFixed(1)))
      .then((bmi: number) => Promise.all([bmi, this.bmiInterpretation(bmi)]))
      .then(([bmi, interpretation]: [number, CodeableConcept]) => ({ bmi, interpretation }));
  }

  public async createReport(uid: string, patientId: string, type: ObservationType, from: string, to: string): Promise<Buffer> {
    return this.readByTypeForPatient(
      uid,
      patientId,
      type,
      {
        from,
        to
      }
    )
      .then((observations: Observation[]) => {
        if (observations.length === 0) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'No observations with given criteria');
        }
        return this.observationsReport.createReport(uid, patientId, type, observations)
      })
      .then((docDef: TDocumentDefinitions) => this.makePdf.getPDF(docDef));
  }

  private bmiInterpretation(bmi: number): Promise<CodeableConcept> {
    let code: BMIInterpretation = BMIInterpretation.UNDERWEIGHT;

    if (bmi >= 18.5 && bmi <= 24.9) {
      code = BMIInterpretation.NORMAL;
    }
    if (bmi > 24.9 && bmi <= 29.9) {
      code = BMIInterpretation.OVERWEIGHT;
    }
    if (bmi > 29.9) {
      code = BMIInterpretation.OBESE;
    }
    return FhirResource.codeableConceptBuilder(CodingSystem.BmiInterpretation, code);
  }

  private readLastForPatient(patientId: string, type: ObservationType) {
    return this.resource.search<BundleResponse<Observation>>(`subject=${patientId}&code=${type}&_count=1`)
      .then((bundle: BundleResponse<Observation>) => bundleToResponse<Observation>(bundle))
      .then((observations: Observation[]) => {
        if (observations.length > 0) return observations[0];
        throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, `Missing ${type} observation`);
      });
  }

  private async bloodType(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    const component: ObservationComponent[] = [
      {
        code: await FhirResource.codeableConceptBuilder(CodingSystem.BloodTypeElement, BloodTypeElement.TYPE),
        valueString: (payload.value as BloodTypePayload).type
      },
      {
        code: await FhirResource.codeableConceptBuilder(CodingSystem.BloodTypeElement, BloodTypeElement.RHESUS_FACTOR),
        valueString: (payload.value as BloodTypePayload).rh
      }
    ];

    return {
      ...await ObservationController.observation(uid, ObservationType.BloodType, payload),
      component
    };
  }

  private async checkAllowed(uid: string, patientId: string): Promise<void> {
    const allowed: boolean = patientId === uid || await this.careTeamController.sameCareTeam(uid, patientId);
    if (!allowed) {
      throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only care team member can see observations');
    }
  }

  private async bodyObservation(uid: string, type: ObservationType, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, type, payload),
      valueQuantity: (payload.value as Quantity)
    };
  }

  private async heartRate(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, ObservationType.HeartRate, payload),
      valueQuantity: (payload.value as Quantity),
      referenceRange: []
    };
  }

  private async bodyTemp(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, ObservationType.BodyTemp, payload),
      valueQuantity: (payload.value as Quantity),
      referenceRange: []
    };
  }

  private async glucoseLevel(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, ObservationType.GlucoseLevel, payload),
      valueQuantity: (payload.value as Quantity),
      referenceRange: []
    };
  }

  private async activity(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, ObservationType.Activity, payload),
      valueQuantity: payload.value as Quantity
    };
  }

  private async mood(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, ObservationType.Mood, payload),
      valueInteger: payload.value as number
    };
  }

  private async pain(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    return {
      ...await ObservationController.observation(uid, ObservationType.Pain, payload),
      valueInteger: payload.value as number
    };
  }

  private async bloodPressure(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    const component: ObservationComponent[] = ObservationController.bloodPressureComponent(payload.value as Quantity[]);
    return {
      ...await ObservationController.observation(uid, ObservationType.BloodPressure, payload),
      component
    };
  }

  public static bloodPressureComponent(quantities: Quantity[]): ObservationComponent[] {
    const systolicQuantity = quantities.find((q: Quantity) => q.code === BloodPressure.SYSTOLIC);
    const diastolicQuantity = quantities.find((q: Quantity) => q.code === BloodPressure.DIASTOLIC);

    if (systolicQuantity === undefined || diastolicQuantity === undefined) {
      throw new CustomError(ErrorCode.INCORRECT_FORM_DATA, 'Systolic or diastolic not found');
    }
    return [
      {
        code: {
          coding: [{
            system: CodingSystem.BloodPressure,
            code: BloodPressure.SYSTOLIC,
            display: 'Ciśnienie skurczowe'
          }],
          text: 'Ciśnienie skurczowe'
        },
        valueQuantity: systolicQuantity,
        referenceRange: []
      },
      {
        code: {
          coding: [{
            system: CodingSystem.BloodPressure,
            code: BloodPressure.DIASTOLIC,
            display: 'Ciśnienie rozkurczowe'
          }],
          text: 'Ciśnienie rozkurczowe'
        },
        valueQuantity: diastolicQuantity,
        referenceRange: []
      }
    ];
  }

  private async feeding(uid: string, payload: ObservationPayload): Promise<Partial<Observation>> {
    const component: ObservationComponent[] = await this.feedingComponents(payload.value as Feeding);
    return {
      ...await ObservationController.observation(uid, ObservationType.Feeding, payload),
      component
    };
  }

  private feedingComponents(feeding: Feeding): Promise<ObservationComponent[]> {
    return Promise.all(
      [
        FhirResource.codeableConceptBuilder(CodingSystem.FeedingComponents, 'method'),
        FhirResource.codeableConceptBuilder(CodingSystem.FeedingComponents, 'type'),
        FhirResource.codeableConceptBuilder(CodingSystem.FeedingComponents, 'value'),
        FhirResource.codeableConceptBuilder(CodingSystem.FeedingComponents, 'oralType')
      ]
    ).then(([methodCode, typeCode, valueCode, oralTypeCode]: CodeableConcept[]) => {
      const components: ObservationComponent[] = [
        {
          code: methodCode,
          valueString: feeding.method
        },
        {
          code: typeCode,
          valueString: feeding.type
        },
        {
          code: valueCode,
          valueInteger: feeding.value
        }
      ];
      return feeding.method === FeedingMethod.oral ? [...components, {
        code: oralTypeCode,
        valueString: feeding.oralType
      }] : components;
    })
      .then((components: ObservationComponent[]) => feeding.meal ? this.meal(components, feeding.meal): components);
  }

  private async meal(components: ObservationComponent[], meal): Promise<ObservationComponent[]> {
    const code: CodeableConcept = await FhirResource.codeableConceptBuilder(CodingSystem.FeedingComponents, 'meal');
    return [...components, {
      code,
      valueString: meal
    }];
  }

  private patient(uid: string): Promise<Patient> {
    return FhirResource.getFhirResourceId(uid)
      .then((fhirRes: FhirResourceId) => this.patientResource.read<Patient>(fhirRes.fhirId));
  }

  private static observation(uid: string, type: ObservationType, payload: ObservationPayload): Promise<Partial<Observation>> {
    return Promise.all([
      createReference(payload.patient),
      createReference(uid),
      FhirResource.codeableConceptBuilder(CodingSystem.ObservationType, type),
      FhirResource.codeableConceptBuilder(CodingSystem.ObservationMethod, ObservationMethod.MAN)
    ])
      .then(([patientRef, performerRef, typeCode, methodCode]: [Reference, Reference, CodeableConcept, CodeableConcept]) => {
        return {
          resourceType: ResourceType.Observation,
          status: ObservationStatus.registered,
          subject: patientRef,
          performer: [performerRef],
          code: typeCode,
          note: payload.note ? [
            {
              authorReference: performerRef,
              time: DateTime.local().toISO(),
              text: payload.note
            }
          ] : [],
          method: methodCode,
          effectiveDateTime: payload.effective
        };
      });
  }
}
