import { Response } from 'express';
import { CompositionResponse, Person, UserDataRequest } from '@signalbot-backend/interfaces';
import AppRouter from '../app.router';
import { Validator } from './validator';
import { expressValidate } from '@signalbot-backend/validators';
import { CompositionController, PatientController, UserController } from '@signalbot-backend/controllers';
import { errorHandler } from '../error-handler';

export class PatientRouter extends AppRouter {
  private userController: UserController = new UserController();
  private patientController: PatientController = new PatientController();
  private compositionController: CompositionController = new CompositionController();

  public routes(): void {
    this.router.get('/:patientId/last-login', this.getLastLoginHandler.bind(this));
    this.router.get('/:patientId/documents', this.getDocumentsRouteHandler.bind(this));
    this.router.patch(
      '/:propertyName',
      Validator.patchPropertyValidator,
      expressValidate,
      this.patchPropertyHandler.bind(this)
    );
  }

  private getLastLoginHandler(req: UserDataRequest, resp: Response): void {
    this.patientController.lastLogin(req.userData._id, req.params.patientId)
      .then((lastLogin: string) => resp.send({ lastLogin }))
      .catch(errorHandler(resp));
  }

  private patchPropertyHandler(req: UserDataRequest, resp: Response): void {
    this.userController.updateProperty<Person>(req.userData._id, req.params.propertyName, req.body.value)
      .then((person: Person) => resp.send(person))
      .catch(errorHandler(resp));
  }

  private getDocumentsRouteHandler(req: UserDataRequest, resp: Response): void {
    this.compositionController.readForPatient(req.params.patientId)
      .then((compositionResponse: CompositionResponse[]) => resp.send(compositionResponse))
      .catch((err) => resp.status(500).send(err));
  }
}
