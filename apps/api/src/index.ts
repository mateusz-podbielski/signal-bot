import dotenv from 'dotenv';

dotenv.config();

import { Express } from 'express';
import express from 'express';
import cors from 'cors';

import { logger, logLevels } from '@signalbot-backend/logger';
import { connectMongoDB } from '@signalbot-backend/mongo-connect';
import { ApiRouter } from './app';
import { ActionsRouter } from './app/actions.router';
import { FhirResourcesLoader } from './fhir-resources-loader';
import { ApiServiceBroker } from './app/api-service-broker';
import { i18n } from '@signalbot-backend/i18next';

export class Application {
  public app: Express;

  constructor() {
    this.app = express();
    const fhir: FhirResourcesLoader = new FhirResourcesLoader();

    connectMongoDB()
      .then((mongoUrl: string) => logger.log(logLevels.info, `MongoDB has been connected at ${mongoUrl}`))
      .then(() => fhir.fhirHealthCheck())
      .then(() => fhir.postResources())
      .then(() => logger.log(logLevels.info, 'Resources posted'))
      .then(() => this.setup())
      .then(() => ApiServiceBroker.getInstance())
      .then(() => i18n)
      .catch((error: unknown) => {
        logger.log(logLevels.error, error);
        process.exit(1);
      });
  }

  private async setup(): Promise<void> {
    this.app.use(express.json());
    this.app.use('/api', cors(), new ApiRouter().router);
    this.app.use('/action', cors(), new ActionsRouter().router);

    return new Promise((resolve, reject) => {
      this.app.listen(process.env.BACKEND_API_PORT, () => {
        logger.log(logLevels.info, `App started and listen at http://localhost:${process.env.BACKEND_API_PORT}`);
        resolve(void 0);
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
}

new Application();
