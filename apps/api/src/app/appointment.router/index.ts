import { Response } from 'express';
import { AppointmentController } from '@signalbot-backend/controllers';
import { Appointment, UserDataRequest } from '@signalbot-backend/interfaces';
import { expressValidate } from '@signalbot-backend/validators';
import { Validator } from './validator';
import { errorHandler } from '../error-handler';
import AppRouter from '../app.router';

export class AppointmentRouter extends AppRouter {
  private controller = new AppointmentController();

  public routes(): void {
    this.router.post('/', Validator.createValidator, expressValidate, this.createRouteHandler.bind(this));
    this.router.get('/', Validator.getQueryParamsValidator, expressValidate, this.getForActorRouteHandler.bind(this));
    this.router.delete('/', this.deleteAppointmentRouteHandler.bind(this));
    this.router.put('/:appointmentId',
      Validator.createValidator,
      expressValidate,
      this.putAppointmentRouteHandler.bind(this)
    );

    this.router.get('/:appointmentId',
      Validator.createValidator,
      expressValidate,
      this.getAppointmentRouteHandler.bind(this)
    );

    this.router.delete('/:appointmentId/participant',
      Validator.deleteParticipantValidator,
      expressValidate,
      this.deleteParticipantRouteHandler.bind(this)
    );

    this.router.patch('/:appointmentId/patient',
      Validator.patchParticipantValidator,
      expressValidate,
      this.patchParticipantRouteHandler.bind(this)
    );

    this.router.patch('/:appointmentId/status',
      Validator.patchStatusValidator,
      expressValidate,
      this.patchStatusRouteHandler.bind(this)
    );
  }

  private getAppointmentRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.getAppointment(req.userData._id, req.params.appointmentId)
      .then((appointment: Appointment) => resp.send(appointment))
      .catch(errorHandler(resp));
  }

  private putAppointmentRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.putAppointment(req.userData._id, req.params.appointmentId, req.body)
      .then((appointment: Appointment) => resp.send(appointment))
      .catch(errorHandler(resp));
  }

  private deleteAppointmentRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.deleteAppointment(req.userData._id, req.params.appointmentId)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }
  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body)
      .then((appointment: Appointment) => resp.send(appointment))
      .catch(errorHandler(resp));
  }

  private getForActorRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.getAllForActor(req.userData._id, req.query)
      .then((appointments: Appointment[]) => resp.send(appointments))
      .catch(errorHandler(resp));
  }

  private patchParticipantRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.patchAppointmentParticipant(req.userData._id, req.params.appointmentId, req.body.participantId)
      .then((appointment: Appointment) => resp.send(appointment))
      .catch(errorHandler(resp));
  }

  private deleteParticipantRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.deleteAppointmentParticipant(req.userData._id, req.params.appointmentId, req.body.participant)
      .then((appointment: Appointment) => resp.send(appointment))
      .catch(errorHandler(resp));
  }

  private patchStatusRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.patchAppointmentStatus(req.userData._id, req.params.appointmentId, req.body.status)
      .then((appointment: Appointment) => resp.send(appointment))
      .catch(errorHandler(resp));
  }
}
