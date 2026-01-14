import { Response } from 'express';
import {
  ServiceRequest,
  ServiceRequestPayload,
  ServiceRequestStatus,
  UserDataRequest
} from '@signalbot-backend/interfaces';
import { ServiceRequestController } from '@signalbot-backend/controllers';
import { expressValidate } from '@signalbot-backend/validators';

import { Validator } from './validator';
import AppRouter from '../app.router';
import { errorHandler } from '../error-handler';

export class ServiceRequestRouter extends AppRouter {
  private controller: ServiceRequestController = new ServiceRequestController();

  public routes(): void {
    this.router.post('/', Validator.createUpdateValidator, expressValidate, this.createRoute.bind(this));
    this.router.get('/', Validator.rangeValidator, expressValidate, this.getUserServiceRequests.bind(this));
    this.router.get('/:requestId', this.getServiceRequest.bind(this));
    this.router.put('/:requestId', Validator.createUpdateValidator, expressValidate, this.updateServiceRequest.bind(this));
    this.router.patch('/:requestId/status', Validator.changeStatusValidator, expressValidate, this.changeServiceRequestStatus.bind(this));
    this.router.delete('/:requestId', this.deleteServiceRequest.bind(this));
  }

  private createRoute(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.body as ServiceRequestPayload, req.userData._id)
      .then((serviceRequest: ServiceRequest) => resp.send(serviceRequest))
      .catch(errorHandler(resp));
  }

  private getUserServiceRequests(req: UserDataRequest, resp: Response): void {
    this.controller.readAll(req.userData._id, req.query as {[key: string]: string})
      .then((requests: ServiceRequest[]) => resp.send(requests))
      .catch(errorHandler(resp));
  }

  private getServiceRequest(req: UserDataRequest, resp: Response): void {
    this.controller.read(req.userData._id, req.params.requestId)
      .then((requests: ServiceRequest[]) => resp.send(requests))
      .catch(errorHandler(resp));
  }

  private updateServiceRequest(req: UserDataRequest, resp: Response): void {
    this.controller.update(req.userData._id, req.params.requestId, req.body as ServiceRequestPayload)
      .then((serviceRequest: ServiceRequest) => resp.send(serviceRequest))
      .catch(errorHandler(resp));
  }

  private changeServiceRequestStatus(req: UserDataRequest, resp: Response): void {
    const data: Partial<ServiceRequest> = req.body;
    this.controller.changeStatus(req.params.requestId, data.status as ServiceRequestStatus)
      .then((serviceRequest: ServiceRequest) => resp.send(serviceRequest))
      .catch(errorHandler(resp));
  }

  private deleteServiceRequest(req: UserDataRequest, resp: Response): void {
    this.controller.delete(req.params.requestId)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }
}
