import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export class TestMongoServer {
  public mongod: MongoMemoryServer;

  public async create(): Promise<void> {
    this.mongod = await MongoMemoryServer.create();
  }

  async connect(): Promise<void> {
    const uri = this.mongod.getUri();

    const mongooseOpts = {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    };

    await mongoose.connect(uri, mongooseOpts);
  }

  async closeDatabase(): Promise<void> {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.mongod.stop();
  }

  async clearDatabase(): Promise<void> {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}
