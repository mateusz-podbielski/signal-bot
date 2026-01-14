import { Response } from 'express';
import { ObservationController } from '@signalbot-backend/controllers';
import { BmiResponse, Observation, ObservationsMap, ObservationType, UserDataRequest } from '@signalbot-backend/interfaces';
import { expressValidate } from '@signalbot-backend/validators';
import { Validator } from './validator';
import AppRouter from '../app.router';
import { errorHandler } from '../error-handler';

export class ObservationRouter extends AppRouter {
  private controller: ObservationController = new ObservationController();

  public routes(): void {
    this.router.get('/', this.readAllRoute.bind(this));

    this.router.get('/patient/:patientId',
      expressValidate,
      this.readAllForPatientRoute.bind(this)
    );

    this.router.get('/patient/:patientId/last', this.readLastRouteHandler.bind(this));
    this.router.get('/patient/:patientId/bmi', this.getBMIRouteHandler.bind(this));

    this.router.get('/patient/:patientId/report',
      Validator.createReportValidator,
      expressValidate,
      this.getReportRouteHandler.bind(this)
    );

    this.router.get('/patient/:patientId/:observationType',
      Validator.getByTypeValidator,
      expressValidate,
      this.readByTypeForPatientRouteHandler.bind(this)
    );

    this.router.post('/:observationType', Validator.createValidator, expressValidate, this.createRouteHandler.bind(this));
    this.router.get('/:observationType', this.readAllForTypeRoute.bind(this));
    this.router.put('/BloodType', this.updateBloodType.bind(this));
  }

  private getReportRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.createReport(
      req.userData._id,
      req.params.patientId,
      req.query.observationType as ObservationType,
      req.query.from as string,
      req.query.to as string
    )
      .then((base64Data: Buffer) => {
        resp.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=raport.pdf'
        });
        resp.write(base64Data);
        resp.end();
      })
      .catch(errorHandler(resp));
  }

  private getBMIRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.bmi(req.userData._id, req.params.patientId)
      .then((bmiResponse: BmiResponse) => resp.send(bmiResponse))
      .catch(errorHandler(resp));
  }

  private updateBloodType(req: UserDataRequest, resp: Response): void {
    this.controller.updateBloodType(req.userData._id, req.body)
      .then((observation: Observation) => resp.send(observation))
      .catch(errorHandler(resp));
  }

  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.params.observationType as ObservationType, req.body)
      .then((observation: Observation) => resp.send(observation))
      .catch(errorHandler(resp));
  }

  private readLastRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.readLast(req.userData._id, req.params.patientId)
      .then((map: ObservationsMap) => resp.send(map))
      .catch(errorHandler(resp));
  }

  private readAllRoute(req: UserDataRequest, resp: Response): void {
    this.controller.readAll(req.userData._id, req.query)
      .then((observations: Observation[]) => resp.send(observations))
      .catch(errorHandler(resp));
  }

  private readByTypeForPatientRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.readByTypeForPatient(req.userData._id, req.params.patientId, req.params.observationType as ObservationType, req.query)
      .then((observations: Observation[]) => resp.send(observations))
      .catch(errorHandler(resp));
  }

  private readAllForPatientRoute(req: UserDataRequest, resp: Response): void {
    this.controller.readAllForPatient(req.userData._id, req.params.patientId, req.query)
      .then((observations: Observation[]) => resp.send(observations))
      .catch(errorHandler(resp));
  }

  private readAllForTypeRoute(req: UserDataRequest, resp: Response): void {
    this.controller.readAllForType(
      req.userData._id,
      req.params.observationType as ObservationType,
      req.query
    )
      .then((observations: Observation[]) => resp.send(observations))
      .catch(errorHandler(resp));
  }
}
