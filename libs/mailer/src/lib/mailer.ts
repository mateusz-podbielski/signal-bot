import * as sgMail from '@sendgrid/mail';
import fs from 'fs-extra';
import { ClientResponse } from '@sendgrid/client/src/response';
import { EmailData } from '@sendgrid/helpers/classes/email-address';
import {
  Attachment, DocumentContent,
  DocumentReference,
  MailAttachment,
  MailAttachmentDisposition,
  Person
} from '@signalbot-backend/interfaces';
import { getUserData, humanName } from '@signalbot-backend/user-resource';
import { templates } from './templates-map';
import { conf } from '@conf';

sgMail.setApiKey(process.env.BACKEND_SENDGRID_API_KEY || '');

export class Mailer {
  public static async sendMail(
    to: EmailData | EmailData[],
    subject: string,
    templateId: string,
    dynamicTemplateData: { [key: string]: string },
    attachments?: Attachment[]
  ): Promise<[ClientResponse, unknown]> {
    const msg = {
      to,
      from: conf.FROM_EMAIL,
      templateId,
      attachments: attachments ? await Promise.all(attachments.map((att: Attachment) => Mailer.getMailAttachment(att))) : undefined,
      dynamic_template_data: dynamicTemplateData
    };
    return sgMail.send(msg);
  }

  public static sendRegistrationEmail(email: string, firstName: string, lastName: string): Promise<[ClientResponse, unknown]> {
    return Mailer.sendMail(
      email,
      'Potwierdzenie rejestracji w serwisie SignalBot',
      templates.REGISTRATION_EMAIL_ID,
      {
        firstName,
        lastName
      }
    );
  }

  public static sendChangePasswordEmail(email: EmailData | EmailData[], firstName: string, lastName: string): Promise<[ClientResponse, unknown]> {
    return Mailer.sendMail(
      email,
      'Zmiana hasła',
      templates.CHANGE_PASSWORD_EMAIL_ID,
      {
        firstName,
        lastName
      }
    );
  }

  public static async shareDocuments(uid: string, email: string, docRef: DocumentReference): Promise<void> {
    const attachments: Attachment[] = docRef.content.map((content: DocumentContent) => content.attachment);

    return getUserData(uid).then((person: Person) => humanName(person))
      .then((name: { firstName: string, lastName: string }) =>
        Mailer.sendMail(email, 'Udostępnione pliki', templates.SHARE_DOCUMENTS, name, attachments)
      )
      .then(() => void 0);
  }

  public static shareCompositionDocuments(
    recipientEmail: string,
    senderData: {firstName: string, lastName: string},
    attachments: Attachment[],
    subject: string,
    message: string,
  ): Promise<void> {
    const templateData: { [key: string]: string } = {
      ...senderData,
      message,
      subject
    };
    return Mailer.sendMail(recipientEmail, subject, templates.SHARE_DOCUMENTS, templateData, attachments)
      .then(() => void 0);
  }

  private static async getMailAttachment(attachment: Attachment): Promise<MailAttachment> {
    return {
      content: await fs.readFile(attachment.url, { encoding: 'base64' }),
      filename: attachment.title,
      disposition: MailAttachmentDisposition.attachment,
      content_id: attachment.title,
      type: attachment.contentType
    };
  }
}
