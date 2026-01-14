import { DateTime } from 'luxon';
import fs from 'fs-extra';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  Attachment,
  CodeableConcept,
  CodingSystem,
  CompositionStatus,
  DocumentContent,
  DocumentPayload,
  DocumentReference,
  DocumentReferenceStatus,
  DocumentType,
  JsonPatch,
  JsonPatchOperation,
  Reference,
  ResourceType
} from '@signalbot-backend/interfaces';
import { AttachmentController } from './attachment.controller';
import { createReference } from './controller-tools';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { Mailer } from '@signalbot-backend/mailer';

const medicalTypes: DocumentType[] = [
  DocumentType.medicalReport,
  DocumentType.testResult,
  DocumentType.recipe,
  DocumentType.otherMedical
];

export class DocumentReferenceController {
  private resource: FhirResource = new FhirResource(ResourceType.DocumentReference);

  /**
   * Creates the Document Reference
   * @param uid
   * @param documentPayload
   * @param file
   */
  public async create(uid: string, documentPayload: DocumentPayload, file: Express.Multer.File): Promise<DocumentReference> {
    const documentReference: DocumentReference = {
      resourceType: ResourceType.DocumentReference,
      status: DocumentReferenceStatus.current,
      docStatus: CompositionStatus.final,
      subject: await createReference(documentPayload.patient),
      author: [await createReference(uid)],
      date: DateTime.local().toISODate(),
      description: documentPayload.description,
      content: [{
        attachment: AttachmentController.getAttachment(file)
      }],
      type: await FhirResource.codeableConceptBuilder(CodingSystem.DocumentType, documentPayload.documentType)
    };
    return this.resource.create<DocumentReference>(documentReference);
  }

  /**
   * Reads the Document Reference
   * @param docReferId
   */
  public read(docReferId: string): Promise<DocumentReference> {
    return this.resource.read<DocumentReference>(docReferId);
  }

  /**
   * Deletes the Document Reference with given id
   * @param uid
   * @param docRefId
   */
  public async delete(uid: string, docRefId: string): Promise<'deleted' | 'archived'> {
    const docRef: DocumentReference = await this.read(docRefId);
    const author: Reference = await createReference(uid);

    if (!docRef.author.map((ref: Reference) => ref.reference).includes(author.reference)) {
      throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only the author of document can remove the document');
    }
    return medicalTypes.includes(this.getDocumentType(docRef))
      ? this.changeStatus(docRefId, DocumentReferenceStatus.superseded).then(() => 'archived')
      : this.removeDocument(docRef).then(() => 'deleted');
  }

  /**
   * Replaces the DocumentReference file
   * @param uid User identifier
   * @param docRefId
   * @param url
   * @param file
   */
  public async updateFile(uid: string, docRefId: string, url: string, file: Express.Multer.File): Promise<DocumentReference> {
    const attachment: Attachment = AttachmentController.getAttachment(file);
    const docRef: DocumentReference = await this.read(docRefId);
    const userRef: Reference = await createReference(uid);
    if (!docRef.author.map((ref: Reference) => ref.reference).includes(userRef.reference)) {
      throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only author can replace the file');
    }

    return fs.remove(url).then(() => {
      const index: number = docRef.content.map((content: DocumentContent) => content.attachment)
        .findIndex((attachment: Attachment) => attachment.url === url);

      if (index === -1) {
        throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'Can not find file with given url');
      }

      const patch: JsonPatch = {
        op: JsonPatchOperation.REPLACE,
        path: `/content/${index}/attachment`,
        value: attachment
      };
      return this.resource.update<DocumentReference>(docRefId, [patch]);
    });
  }

  /**
   * Change the status of Document Reference
   * @param docRefId
   * @param status
   */
  public changeStatus(docRefId: string, status: DocumentReferenceStatus): Promise<DocumentReference> {
    return FhirResource.codeableConceptBuilder(CodingSystem.DocumentType, status)
      .then((value: CodeableConcept) => {
        const patch: JsonPatch = {
          op: JsonPatchOperation.REPLACE,
          path: '/status',
          value
        };
        return this.resource.update<DocumentReference>(docRefId, [patch]);
      });
  }

  public shareDocument(uid: string, email: string, docRefId: string): Promise<void> {
    return this.resource.read<DocumentReference>(docRefId)
      .then((docRef: DocumentReference) => {
        if (docRef.content === undefined || docRef.content.length === 0) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'Provided document reference does not contain any attachment');
        }
        return Mailer.shareDocuments(uid, email, docRef);
      });
  }

  public update(docRefId: string, jsonPatch: JsonPatch[]): Promise<DocumentReference> {
    return this.resource.update<DocumentReference>(docRefId, jsonPatch);
  }

  private removeDocument(docRef: DocumentReference): Promise<void> {
    const promises: Promise<void>[] = docRef.content
      .map((content: DocumentContent) => AttachmentController.dropAttachmentFile(content.attachment));
    return Promise.all(promises).then(() => this.resource.delete(docRef.id));
  }

  private getDocumentType(docRef: DocumentReference): DocumentType {
    return docRef.type.coding[0].code as DocumentType;
  }
}
