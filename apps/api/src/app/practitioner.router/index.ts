import { Response } from 'express';
import { CareTeamResources, Person, PractitionerRole, Role, UserDataRequest } from '@signalbot-backend/interfaces';
import { PractitionerController, UserController } from '@signalbot-backend/controllers';
import AppRouter from '../app.router';
import { Validator } from './validator';
import { Authenticate } from '@signalbot-backend/authenticate';
import { expressValidate } from '@signalbot-backend/validators';
import { errorHandler } from '../error-handler';

export class PractitionerRouter extends AppRouter {
  private userController: UserController = new UserController();
  private practitionerController: PractitionerController = new PractitionerController();

  public routes(): void {
    this.router.patch(
      '/:propertyName',
      Authenticate.grantAccess([Role.therapist, Role.physician, Role.nurse]),
      Validator.patchPropertyValidator,
      expressValidate,
      this.patchPropertyHandler.bind(this)
    );

    this.router.get('/care-teams/members', this.getCareTeamsMembers.bind(this));

    this.router.get('/practitioner-role', this.getPractitionerRole.bind(this));

    this.router.get('/:practitionerId/practitioner-role', this.getPractitionerRoleById.bind(this));
  }

  private getCareTeamsMembers(req: UserDataRequest, resp: Response): void {
    this.practitionerController.getCareTeamsMembers(req.userData._id)
      .then((careTeamResources: CareTeamResources[]) => resp.send(careTeamResources))
      .catch(errorHandler(resp));
  }

  private patchPropertyHandler(req: UserDataRequest, resp: Response): void {
    this.userController.updateProperty<Person>(req.userData._id, req.params.propertyName, req.body.value)
      .then((person: Person) => resp.send(person))
      .catch(errorHandler(resp));
  }

  private getPractitionerRoleById(req: UserDataRequest, resp: Response): void {
    this.practitionerController.getPractitionerRoleById(req.params.practitionerId, req.userData._id)
      .then((practitionerRole: PractitionerRole) => {
        resp.send(practitionerRole);
      })
      .catch(errorHandler(resp));
  }

  private getPractitionerRole(req: UserDataRequest, resp: Response): void {
    this.practitionerController.getPractitionerRoleResource(req.userData._id)
      .then((practitionerRole: PractitionerRole) => {
        resp.send(practitionerRole);
      })
      .catch(errorHandler(resp));
  }
}
