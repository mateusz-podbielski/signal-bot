import { TestMongoServer } from '@signalbot-backend/tests';
import { BundleResponse, DateRangeWithLimit, Gender, Person, ResourceType } from '@signalbot-backend/interfaces';
import { bundleToResponse, searchQuery } from '../controller-tools';

describe('Controller Tools', () => {
  let dbHandler: TestMongoServer;

  beforeAll(async () => {
    dbHandler = new TestMongoServer();
    await dbHandler.create();
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  it('bundleToResponse() returns the array of resources', () => {
    const total = 3;
    const person: Person = {
      identifier: [],
      gender: Gender.female,
      telecom: [],
      active: true,
      resourceType: ResourceType.Person,
      name: []
    };
    const bundle: BundleResponse<Person> = {
      resourceType: ResourceType.Bundle,
      id: '1',
      meta: {
        lastUpdated: '2021-08-09 16:56:37.423Z'
      },
      type: 'searchset',
      total,
      link: [
        {
          relation: 'self',
          url: 'http://localhost:8090/fhir/Observation?code=BodyHeight&subject=Patient%2F52'
        }
      ],
      entry: [
        {
          fullUrl: '',
          resource: { ...person, id: '2' }
        },
        {
          fullUrl: '',
          resource: { ...person, id: '3' }
        },
        {
          fullUrl: '',
          resource: { ...person, id: '4' }
        }
      ]
    };

    expect(bundleToResponse<Person>(bundle).length).toEqual(3);
    expect(bundleToResponse<Person>(bundle)[2].id).toEqual('4');
  });

  it('bundleToResponse() returns empty array', () => {
    const bundle: BundleResponse<Person> = {
      resourceType: ResourceType.Bundle,
      id: '1',
      meta: {
        lastUpdated: '2021-08-09 16:56:37.423Z'
      },
      type: 'searchset',
      total: 0,
      link: [
        {
          relation: 'self',
          url: 'http://localhost:8090/fhir/Observation?code=BodyHeight&subject=Patient%2F52'
        }
      ],
      entry: []
    };

    expect(bundleToResponse<Person>(bundle).length).toEqual(0);
  });

  it('searchQuery() should give full search query', () => {
    const query: DateRangeWithLimit = {
      limit: '100',
      from: '2020-01-01',
      to: '2020-12-31',
    };
    expect(searchQuery(query)).toEqual('_count=100;date=ge2020-01-01;date=le2020-12-31');
  });

  it('searchQuery() should give search query with limit and ge', () => {
    const query: DateRangeWithLimit = {
      limit: '100',
      from: '2020-01-01',
    };
    expect(searchQuery(query)).toEqual('_count=100;date=ge2020-01-01');
  });

  it('searchQuery() should give search query with limit', () => {
    const query: DateRangeWithLimit = {
      limit: '100',
    };
    expect(searchQuery(query)).toEqual('_count=100');
  });
});
