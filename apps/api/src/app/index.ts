import * as bodyParser from 'body-parser';

import { Authenticate } from '@signalbot-backend/authenticate';
import { Role } from '@signalbot-backend/interfaces';

import AppRouter from './app.router';
import { AuthRouter } from './auth.router';
import { UserRouter } from './user.router';
import { RelatedPersonRouter } from './related-person.router';
import { DictionaryRouter } from './dictionary.router';
import { PatientRouter } from './patient.router';
import { PractitionerRouter } from './practitioner.router';
import { TwilioRouter } from './twilio.router';
import { CheckRouter } from './check.router';
import { ServiceRequestRouter } from './service-request.router';
import { FcmRouter } from './fcm.router';
import { ChargeItemRouter } from './charge-item.router';
import { CompositionRouter } from './composition.router';
import { MessagesRouter } from './messages.router';
import { DocumentReferenceRouter } from './document-reference.router';
import { ReferenceRangeRouter } from './reference-range.router';
import { ScheduleRouter } from './schedule.router';
import { ObservationRouter } from './observation.router';
import { AppointmentRouter } from './appointment.router';
import { VersionRouter } from './version.router';
import { Auth2Router } from './auth2.router';
import { BtHubRouter } from './bthub.router';
import { CareTeamRouter } from './care-team.router';

export class ApiRouter extends AppRouter {
  constructor() {
    super();
  }

  public routes(): void {
    this.router.use(
      '/user',
      Authenticate.ensureAuthorized,
      new UserRouter().router
    );
    this.router.use(
      '/patient',
      Authenticate.ensureAuthorized,
      bodyParser.json(),
      new PatientRouter().router
    );
    this.router.use(
      '/related-person',
      Authenticate.ensureAuthorized,
      Authenticate.grantAccess([Role.relatedPerson]),
      bodyParser.json(),
      new RelatedPersonRouter().router
    );
    this.router.use(
      '/practitioner',
      Authenticate.ensureAuthorized,
      bodyParser.json(),
      new PractitionerRouter().router
    );
    this.router.use(
      '/service-request',
      Authenticate.ensureAuthorized,
      // TODO: needs to discussed
      // Authenticate.grantAccess([Role.relatedPerson]),
      bodyParser.json(),
      new ServiceRequestRouter().router
    );
    this.router.use('/care-team', Authenticate.ensureAuthorized, new CareTeamRouter().router);
    this.router.use('/twilio', Authenticate.ensureAuthorized, new TwilioRouter().router);
    this.router.use('/fcm', Authenticate.ensureAuthorized, bodyParser.json(), new FcmRouter().router);
    this.router.use('/charge-item', Authenticate.ensureAuthorized, new ChargeItemRouter().router);
    this.router.use('/composition', Authenticate.ensureAuthorized, new CompositionRouter().router);
    this.router.use('/system-message', Authenticate.ensureAuthorized, new MessagesRouter().router);
    this.router.use('/document-reference', Authenticate.ensureAuthorized, new DocumentReferenceRouter().router);
    this.router.use('/schedule', Authenticate.ensureAuthorized, bodyParser.json(), new ScheduleRouter().router);
    this.router.use('/observation', Authenticate.ensureAuthorized, bodyParser.json(), new ObservationRouter().router);
    this.router.use('/appointment', Authenticate.ensureAuthorized, bodyParser.json(), new AppointmentRouter().router);
    this.router.use('/bthub', Authenticate.ensureAuthorized, bodyParser.json(), new BtHubRouter().router);
    /**
     * Unauthorized requests
     */
    this.router.use('/check', new CheckRouter().router);
    this.router.use('/dictionary', new DictionaryRouter().router);
    this.router.use('/auth', bodyParser.json(), new AuthRouter().router);
    this.router.use('/auth2', bodyParser.json(), new Auth2Router().router);
    this.router.use('/version', new VersionRouter().router);

    /**
     * Admin routes
     */
    this.router.use('/reference-range', bodyParser.json(), new ReferenceRangeRouter().router);
  }
}
