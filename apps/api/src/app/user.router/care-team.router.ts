import {Response} from 'express';

import {CareTeam, ResourceType, UserDataRequest} from '@signalbot-backend/interfaces';
import { CareTeamController } from '@signalbot-backend/controllers';

import AppRouter from '../app.router';

export class CareTeamRouter extends AppRouter {
  private controller: CareTeamController = new CareTeamController();

  public routes(): void {
    this.router.get('/', this.getCareTeamsRouteHandler.bind(this));
    this.router.get('/member/:resourceType', this.getMemberRouteHandler.bind(this));
  }

  private getCareTeamsRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.findAll(req.userData._id.toString())
      .then((careTeams: CareTeam[]) => resp.send(careTeams));
  }

  private  getMemberRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.members(req.userData._id.toString(), req.params.resourceType.toString() as ResourceType)
      .then(response => resp.send(response))
  }
}
