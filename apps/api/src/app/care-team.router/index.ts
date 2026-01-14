import { Response } from 'express';
import { CareTeamController } from '@signalbot-backend/controllers';
import { CareTeam, CareTeamResources, ResourceType, UserDataRequest } from '@signalbot-backend/interfaces';
import { errorHandler } from '../error-handler';
import AppRouter from '../app.router';

export class CareTeamRouter extends AppRouter {
  private controller: CareTeamController = new CareTeamController();

  public routes(): void {
    this.router.get('/patient/:patientId', this.getCareTeamByPatient.bind(this));
    this.router.get('/patient/:patientId/members', this.getCareTeamByPatientWithMembers.bind(this));
  }

  private getCareTeamByPatient(req: UserDataRequest, resp: Response): void {
    this.controller.getCareTeamByPatient(req.userData._id, req.params.patientId)
      .then((careTeam: CareTeam) => resp.send(careTeam))
      .catch(errorHandler(resp));
  }

  private getCareTeamByPatientWithMembers(req: UserDataRequest, resp: Response): void {
    this.controller.getCareTeamByResourceWithMembers(req.userData._id, req.params.patientId, ResourceType.Patient)
      .then((careTeamResources: CareTeamResources[]) => resp.send(careTeamResources))
      .catch(errorHandler(resp));
  }
}
