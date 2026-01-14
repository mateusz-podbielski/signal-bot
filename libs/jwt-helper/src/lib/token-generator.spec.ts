import { TokenGenerator } from './token-generator';
import { TestMongoServer } from '@signalbot-backend/tests';

describe('Token Generator', () => {
  let tokenGenerator: TokenGenerator;
  let dbHandler: TestMongoServer;

  beforeAll(async () => {
    dbHandler = new TestMongoServer();
    await dbHandler.create();
    await dbHandler.connect()
  });

  afterEach(async () => {
    await dbHandler.clearDatabase()
  });

  afterAll(async () => {
    await dbHandler.closeDatabase()
  });

  beforeEach(() => {
    tokenGenerator = new TokenGenerator();
  });

  it('should be created', () => {
    expect(tokenGenerator).toBeTruthy();
  });
});
