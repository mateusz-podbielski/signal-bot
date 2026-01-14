import express, { Express, Request, Response } from 'express';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerApi from '../assets/swagger-api.json';
import btHubApi from '../assets/bthub.json';
import { conf } from '@conf';
import { logger, logLevels } from '@signalbot-backend/logger';

export class SwaggerApp {
  private app: Express;


  constructor() {
    this.app = express();
    this.app.listen(conf.SWAGGER_PORT, () =>
      logger.log(logLevels.info, `Swagger docs has been started at http://localhost:${conf.SWAGGER_PORT}`)
    );
    this.app.get('/', (req: Request, res: Response) => res.sendFile(join(__dirname, '../swagger/assets', 'index.html')));
    this.app.get('/api/swagger.json', (req: Request, res: Response) => res.json(swaggerApi));
    this.app.get('/bthub/swagger.json', (req, res) => res.json(btHubApi));

    this.app.use('/api', swaggerUi.serveFiles(swaggerApi), swaggerUi.setup(swaggerApi));
    this.app.use('/bthub', swaggerUi.serveFiles(btHubApi), swaggerUi.setup(btHubApi));

  }
}
