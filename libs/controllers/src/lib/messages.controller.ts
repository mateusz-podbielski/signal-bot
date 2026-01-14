import { Types } from 'mongoose';
import { getFhirResourceId, getUserResource } from '@signalbot-backend/user-resource';
import { DBSystemMessage, FhirResourceId, Person, SystemMessage } from '@signalbot-backend/interfaces';
import { SystemMessageModel } from '@signalbot-backend/schemas';
import { Mailer, templates } from '@signalbot-backend/mailer';

export class MessagesController {
  public create(uid: string, messageData: Partial<SystemMessage>): Promise<unknown> {
    return this.save(uid, messageData)
      .then(() => getFhirResourceId(uid))
      .then((fhirResourceId: FhirResourceId) => getUserResource(fhirResourceId.fhirId, fhirResourceId.resourceType))
      .then((person: Person) => {
        return { lastName: person.name[0].family, firstName: person.name[0].given.join(' ') };
      })
      .then((name: { firstName: string, lastName: string }) => {
        const mainEmail: Promise<unknown> = Mailer.sendMail('kontakt@i-care.pl', messageData.title, templates.SYSTEM_MESSAGE, {
          ...name,
          message: messageData.message,
          email: messageData.email
        });
        const userEmail: Promise<unknown> = Mailer.sendMail(messageData.email, messageData.title, templates.SYSTEM_MESSAGE_COPY, {
          ...name,
          message: messageData.message,
          email: messageData.email
        });

        return messageData.sendCopyToUser ? Promise.all([mainEmail, userEmail]) : mainEmail;
      });
  }

  public save(uid: string, message: Partial<SystemMessage>): Promise<DBSystemMessage> {
    return SystemMessageModel.create({ ...message, uid: new Types.ObjectId(uid) });
  }
}
