import { ContentTable, TDocumentDefinitions } from 'pdfmake/interfaces';
import i18next from 'i18next';
import { FhirPerson, FhirResource } from '@signalbot-backend/fhir-connector';
import { DateTime } from 'luxon';
import { PeselValidator } from '@signalbot-backend/validators';
import {
  BloodPressure,
  FhirResourceId,
  Observation,
  ObservationComponent,
  ObservationType,
  Person,
  ResourceType
} from '@signalbot-backend/interfaces';
import { Chart } from './chart';

export class ObservationsReport {
  private readonly observationTableHeader;
  constructor() {
    i18next.init({
      ns: 'observation-report'
    });
    this.observationTableHeader = [
      { text: i18next.t('date'), style: 'observationTableHeader' },
      { text: i18next.t('value'), style: 'observationTableHeader' },
      { text: i18next.t('method'), style: 'observationTableHeader' }
    ];
  }

  public async createReport(uid: string, patientId: string, type: ObservationType, observations: Observation[]): Promise<TDocumentDefinitions> {
    const patient: Person = await FhirResource.getFhirResourceId(patientId)
      .then((fhirResId: FhirResourceId) => new FhirResource(ResourceType.Patient).read<Person>(fhirResId.fhirId));

    const performer: Person = await FhirResource.getFhirResourceId(uid)
      .then((fhirResId: FhirResourceId) => new FhirResource(fhirResId.resourceType).read<Person>(fhirResId.fhirId));

    return {
      info: {
        title: i18next.t('observationReport'),
        author: FhirPerson.humanName(performer.name),
        subject: i18next.t('observationReport')
      },
      content: [
        {
          columns: [
            {
              stack: [
                { text: i18next.t('observationReport'), fontSize: 25, color: '#10234E' },
                {
                  text: i18next.t('generatedAt', { date: DateTime.local().toFormat('dd-LL-yyyy') }),
                  margin: [0, 5]
                }
              ]
            },
            {
              image: 'data:image/png;base64,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',
              width: 138,
              height: 64
            }
          ]
        },
        {
          stack: [
            { text: FhirPerson.humanName(patient.name), fontSize: 25, color: '#10234E' },
            { text: i18next.t('patient') }
          ],
          margin: [0, 20]
        },
        this.infoTable(patient),
        { text: i18next.t(type), fontSize: 18, color: '#10234E', margin: [0, 20] },
        {
          image: await this.getChart(observations, type),
          width: 520,
          height: 260
        },
        { text: i18next.t('measurements'), fontSize: 18, color: '#10234E', margin: [0, 20] },
        // this.observationsTable(type, observations)
      ],
      styles: {
        tableLabel: {
          fontSize: 12,
          lineHeight: 1.2
        },
        tableValue: {
          fontSize: 16,
          lineHeight: 1.5,
          color: '#10234E'
        },
        observationTableHeader: {
          bold: true,
          color: '#526085',
          fontSize: 12,
          margin: [15, 10]
        },
        observationTable: {
          margin: [15, 10],
          fontSize: 12
        }
      }
    };
  }

  private infoTable(person: Person): ContentTable {
    const pesel: string = FhirPerson.pesel(person.identifier);
    const ageCount: { years?: number, months?: number } = PeselValidator.age(pesel);
    let age = '';
    if (ageCount.years) {
      age += i18next.t('years', { years: ageCount.years.toString() });
    }

    if (ageCount.years) {
      if (ageCount.years) {
        age += ' ';
      }
      age += i18next.t('monthsShort', { months: ageCount.months.toString() });
    }
    return {
      layout: 'noBorders',
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            {
              text: i18next.t('gender'),
              style: ['tableLabel']
            },
            {
              text: i18next.t('age'),
              style: ['tableLabel']
            },
            {
              text: i18next.t('pesel'),
              style: ['tableLabel']
            },
            {
              text: i18next.t('address'),
              style: ['tableLabel']
            }
          ],
          [
            { text: i18next.t(person.gender), style: ['tableValue'] },
            { text: age, style: ['tableValue'] },
            { text: pesel, style: ['tableValue'] },
            { text: '', style: ['tableValue'] }
          ]
        ]
      }
    };
  }

  private observationsTable(type: ObservationType, observations: Observation[]): ContentTable {
    switch (type) {
      case ObservationType.BloodPressure:
        return this.bloodPressureObservationTable(observations);
      case ObservationType.Pain:
        return this.integerObservationTable(observations);
      case ObservationType.Mood:
        return this.integerObservationTable(observations);
      default:
        return this.singleQuantityValueObservationTable(observations);
    }
  }

  private getChart(observations: Observation[], type: ObservationType): Promise<string> {
    switch (type) {
      case ObservationType.BloodPressure:
        return this.bloodPressureChart(observations);
      case ObservationType.Pain:
        return this.getIntegerChart(observations, type);
      case ObservationType.Mood:
        return this.getIntegerChart(observations, type);
      default:
        return this.getValueQuantityChart(observations, type);
    }
  }

  private getIntegerChart(observations: Observation[], type: ObservationType): Promise<string> {
    return new Chart().getChart(
      observations.map((observation: Observation) => DateTime.fromISO(observation.effectiveDateTime).setLocale('pl').toFormat('d.L.yy')),
      [{
        data: observations.map((observation: Observation) => observation.valueInteger),
        label: i18next.t(type),
        fill: false
      }]
    );
  }

  private getValueQuantityChart(observations: Observation[], type: ObservationType): Promise<string> {
    return new Chart().getChart(
      observations.map((observation: Observation) => DateTime.fromISO(observation.effectiveDateTime).setLocale('pl').toFormat('d.L.yy')),
      [{
        data: observations.map((observation: Observation) => observation.valueQuantity.value),
        label: i18next.t(type),
        fill: false
      }]
    );
  }

  private getBloodPressureItem(components: ObservationComponent[], type: BloodPressure): number {
    return components.find((c: ObservationComponent) => c.code.coding[0].code === type).valueQuantity.value;
  }

  private getBloodPressure(observations: Observation[]): { systolic: number[], diastolic: number[] } {
    return {
      systolic: observations.map((observation: Observation) => this.getBloodPressureItem(observation.component, BloodPressure.SYSTOLIC)),
      diastolic: observations.map((observation: Observation) => this.getBloodPressureItem(observation.component, BloodPressure.DIASTOLIC))
    };
  }

  private bloodPressureChart(observations: Observation[]): Promise<string> {
    return new Chart().getChart(
      observations.map((observation: Observation) => DateTime.fromISO(observation.effectiveDateTime).setLocale('pl').toFormat('d.L.yy')),
      [
        {
          data: this.getBloodPressure(observations).systolic,
          label: i18next.t(BloodPressure.SYSTOLIC),
          fill: false
        },
        {
          data: this.getBloodPressure(observations).diastolic,
          label: i18next.t(BloodPressure.DIASTOLIC),
          fill: false
        }
      ]
    );
  }

  private bloodPressureObservationTable(observations: Observation[]): ContentTable {
    return {
      table: {
        headerRows: 1,
        widths: ['*', 120, '*'],
        body: [
          this.observationTableHeader,
          ...observations.map((observation: Observation) => [
            {
              text: DateTime.fromISO(observation.effectiveDateTime).setLocale('pl').toFormat('d LLL yyyy, HH:mm'),
              style: 'observationTable'
            },
            {
              text: `${this.getBloodPressureItem(observation.component, BloodPressure.SYSTOLIC)} / ${this.getBloodPressureItem(observation.component, BloodPressure.DIASTOLIC)} mmHg`,
              style: 'observationTable'
            },
            { text: observation.method.text, style: 'observationTable' }
          ])
        ]
      },
      layout: {
        defaultBorder: false,
        fillColor: function(rowIndex, node, columnIndex) {
          return rowIndex !== 0 && (rowIndex % 2 === 0) ? '#E3E3E3' : null;
        }
      }
    };
  }

  private integerObservationTable(observations: Observation[]): ContentTable {
    return {
      table: {
        headerRows: 1,
        widths: ['*', 80, '*'],
        body: [
          this.observationTableHeader,
          ...observations.map((observation: Observation) => [
            {
              text: DateTime.fromISO(observation.effectiveDateTime).setLocale('pl').toFormat('d LLL yyyy, HH:mm'),
              style: 'observationTable'
            },
            {
              text: observation.valueInteger,
              style: 'observationTable'
            },
            { text: observation.method.text, style: 'observationTable' }
          ])
        ]
      },
      layout: {
        defaultBorder: false,
        fillColor: function(rowIndex, node, columnIndex) {
          return rowIndex !== 0 && (rowIndex % 2 === 0) ? '#E3E3E3' : null;
        }
      }
    };
  }

  private singleQuantityValueObservationTable(observations: Observation[]): ContentTable {
    // const unit: string = observations[0].code.coding[0].code === ObservationType.BodyTemp ? '° C' : observations[0].valueQuantity.unit;
    return {
      table: {
        // headerRows: 1,
        // widths: ['*', 80, '*'],
        body: [],
        // body: [
        //   this.observationTableHeader,
        //   ...observations.map((observation: Observation) => [
        //     {
        //       text: DateTime.fromISO(observation.effectiveDateTime).setLocale('pl').toFormat('d LLL yyyy, HH:mm'),
        //       style: 'observationTable'
        //     },
        //     {
        //       text: `${observation.valueQuantity.value.toLocaleString('pl')} ${unit}`,
        //       style: 'observationTable'
        //     },
        //     { text: observation.method.text, style: 'observationTable' }
        //   ])
        // ]
      },
      // layout: {
      //   defaultBorder: false,
      //   fillColor: function(rowIndex, node, columnIndex) {
      //     return rowIndex !== 0 && (rowIndex % 2 === 0) ? '#E3E3E3' : null;
      //   }
      // }
    };
  }
}
