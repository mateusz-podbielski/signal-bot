import { Response } from 'express';
import { Person, RelatedPerson, UserDataRequest } from '@signalbot-backend/interfaces';
import { RelatedPersonController, UserController } from '@signalbot-backend/controllers';
import AppRouter from '../app.router';
import { Validator } from './validator';
import { errorHandler } from '../error-handler';
import { expressValidate } from '@signalbot-backend/validators';

export class RelatedPersonRouter extends AppRouter {
  private controller: RelatedPersonController = new RelatedPersonController();
  private userController: UserController = new UserController();

  public routes(): void {
    this.router.post(
      '/child',
      Validator.childValidator,
      expressValidate,
      this.postChildRouteHandler.bind(this)
    );

    this.router.patch(
      '/family-relation',
      Validator.familyRelationValidator,
      expressValidate,
      this.patchFamilyRelation.bind(this),
    );

    this.router.patch(
      '/:propertyName',
      Validator.patchPropertyValidator,
      expressValidate,
      this.patchPropertyHandler.bind(this)
    );
  }

  private patchFamilyRelation(req: UserDataRequest, resp: Response): void {
    this.controller.changePatientRelation(req.userData._id, req.body.familyRelation)
      .then((relatedPerson: RelatedPerson) => resp.send(relatedPerson))
      .catch(errorHandler(resp));
  }

  private postChildRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.addChild(req.body, req.userData._id).then((uid: string) => {
      resp.send({ uid });
    })
      .catch(errorHandler(resp));
  }

  private patchPropertyHandler(req: UserDataRequest, resp: Response): void {
    this.userController.updateProperty<Person>(req.userData._id, req.params.propertyName, req.body.value)
      .then((person: Person) => resp.send(person))
      .catch(errorHandler(resp));
  }
}
