import { Response } from 'express';
import { Invitation, ResourceType, UserDataRequest } from '@signalbot-backend/interfaces';
import { InvitationsController } from '@signalbot-backend/controllers';
import { expressValidate } from '@signalbot-backend/validators';

import AppRouter from '../app.router';
import Validator from './validator';
import { errorHandler } from '../error-handler';

export class InvitationsRouter extends AppRouter {
  private controller: InvitationsController = new InvitationsController();

  public routes(): void {
    this.router.post('/',
      Validator.invitationValidator,
      expressValidate,
      this.inviteMemberRouteHandler.bind(this)
    );
    this.router.get('/', this.fetchInvitationsRouteHandler.bind(this));
    this.router.delete('/:invitationId', this.deleteInvitationRouteHandler.bind(this));
    this.router.put('/:invitationId/accept', this.acceptInvitationRouteHandler.bind(this));
    this.router.put('/:invitationId/reject', this.rejectInvitationRouteHandler.bind(this));
  }

  private rejectInvitationRouteHandler(req: UserDataRequest, resp: Response) {
    this.controller.rejectInvitation(req.userData._id, req.params.invitationId)
      .then((invitations: Invitation[]) => resp.send(invitations))
      .catch(errorHandler(resp));
  }

  private acceptInvitationRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.acceptInvitation(req.userData._id, req.params.invitationId)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }

  private deleteInvitationRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.deleteInvitation(req.userData._id.toString(), req.params.invitationId)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }

  private fetchInvitationsRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.fetchInvitations(req.userData._id)
      .then((invitations: Invitation[]) => {
        resp.send(invitations);
      })
      .catch(errorHandler(resp));
  }

  private inviteMemberRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.inviteMember(
      req.userData._id,
      req.body.phoneNumber as string,
      req.body.resourceType as ResourceType,
      req.body.careTeamId
    )
      .then((invitations: Invitation[]) => {
        resp.status(200).send(invitations);
      })
      .catch(errorHandler(resp));
  }
}
