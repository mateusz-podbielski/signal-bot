import { flatten } from 'lodash';
import { DateTime } from 'luxon';

import {
  Attachment,
  BundleEntry,
  BundleResponse,
  CodingSystem,
  Composition,
  CompositionResponse,
  CompositionSection,
  CompositionStatus,
  DBUser,
  DocumentContent,
  DocumentPayload,
  DocumentReference,
  DocumentType,
  ExtensionUrl,
  JsonPatch,
  JsonPatchOperation,
  Reference,
  ResourceExtension,
  ResourceType
} from '@signalbot-backend/interfaces';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import { DocumentReferenceController } from './document-reference.controller';
import { createReference, extensionIndex } from './controller-tools';
import { UserController } from './user.controller';
import { Mailer } from '@signalbot-backend/mailer';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class CompositionController {
  private compositionResource: FhirResource = new FhirResource(ResourceType.Composition);
  private docRefController: DocumentReferenceController = new DocumentReferenceController();
  private userController: UserController = new UserController();

  /**
   * Creates new documents composition
   * @param uid
   * @param data
   * @param files
   */
  public async create(uid: string, data: DocumentPayload, files: Express.Multer.File[] = []): Promise<CompositionResponse> {
    const author: Reference[] = [await createReference(uid)];
    const compositionData: Partial<Composition> = {
      resourceType: ResourceType.Composition,
      status: CompositionStatus.preliminary,
      type: await FhirResource.codeableConceptBuilder(CodingSystem.DocumentType, data.documentType),
      subject: await createReference(data.patient),
      date: DateTime.local().toISODate(),
      author,
      title: data.title,
      extension: [
        {
          url: ExtensionUrl.description,
          valueString: data.description
        }
      ]
    };
    return this.saveDocumentsReferences(uid, data, files).then((docs: DocumentReference[]) => {
      const section: CompositionSection[] = docs.map((doc: DocumentReference) => {
        return {
          author,
          title: data.title,
          entry: [
            {
              type: ResourceType.DocumentReference,
              reference: `${ResourceType.DocumentReference}/${doc.id}`
            }
          ]
        };
      });
      return this.compositionResource.create<Composition>({
        ...compositionData,
        section
      })
        .then((composition: Composition) => this.mapToResponse(composition));
    });
  }

  /**
   * Shares the documents from composition resource by email
   * @param uid
   * @param email
   * @param subject
   * @param message
   * @param compositionId
   */
  public shareDocumentsWithEmail(uid: string, email: string, subject: string, message: string, compositionId: string): Promise<void> {
    return Promise.all([
      this.userController.userHumanName(uid, uid),
      this.getCompositionAttachments(compositionId)
    ])
      .then(([senderData, attachments]: [{ firstName: string, lastName: string }, Attachment[]]) => Mailer.shareCompositionDocuments(email, senderData, attachments, subject, message));
  }

  public async updateMeta(uid: string, compositionId: string, data: DocumentPayload): Promise<CompositionResponse> {
    const idx: number = await extensionIndex(ResourceType.Composition, compositionId, ExtensionUrl.description);
    const jsonPatch: JsonPatch[] = [
      {
        op: JsonPatchOperation.REPLACE,
        path: '/title',
        value: data.title
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: '/type',
        value: FhirResource.codeableConceptBuilder(CodingSystem.DocumentType, data.documentType)
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: '/subject',
        value: await createReference(data.patient)
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: `/extension/${idx}/valueString`,
        value: data.description
      }
    ];
    return this.compositionResource.update<Composition>(compositionId, jsonPatch)
      .then((composition: Composition) => this.mapToResponse(composition));
  }

  /**
   * Reads all documents which author is user with given uid
   * @param uid User identifier of document's author
   */
  public readAll(uid: string): Promise<CompositionResponse[]> {
    return createReference(uid).then((ref: Reference) => {
      return this.compositionResource.search<BundleResponse<Composition>>(`author=${ref.reference}`);
    })
      .then(this.bundleToResponse.bind(this));
  }

  public read(compositionId: string): Promise<CompositionResponse> {
    return this.compositionResource.read<Composition>(compositionId)
      .then(this.mapToResponse.bind(this));
  }

  public delete(uid: string, docRefId: string): Promise<'deleted' | 'archived'> {
    return this.docRefController.delete(uid, docRefId);
  }

  public readForPatient(uid: string): Promise<CompositionResponse[]> {
    return createReference(uid)
      .then((ref: Reference) => this.compositionResource.search<BundleResponse<Composition>>(`subject=${ref.reference}`))
      .then(this.bundleToResponse.bind(this));
  }

  public getFiles(docRefId: string): Promise<Attachment[]> {
    return this.docRefController.read(docRefId).then((docRef: DocumentReference) => docRef.content)
      .then((contents: DocumentContent[]) => contents.map((content: DocumentContent) => content.attachment));
  }

  private bundleToResponse(bundle: BundleResponse<Composition>): Promise<CompositionResponse[]> {
    if (bundle.total === 0) {
      return Promise.resolve([]);
    }
    const compositions: Composition[] = bundle.entry.map((entry: BundleEntry<Composition>) => entry.resource);
    const promises: Promise<CompositionResponse>[] = compositions.map(this.mapToResponse.bind(this));
    return Promise.all(promises);
  }

  private compositionSection(title: string, docsRefs: DocumentReference[]): CompositionSection[] {
    if (docsRefs.length === 0) {
      return [];
    }
    return docsRefs.map((docRef: DocumentReference) => {
      return {
        title: title,
        author: docRef.author,
        entry: [{
          type: ResourceType.DocumentReference,
          reference: `${ResourceType.DocumentReference}/${docRef.id}`
        }]
      };
    });
  }

  private async saveDocumentsReferences(uid: string, data: DocumentPayload, files: Express.Multer.File[]): Promise<DocumentReference[]> {
    if (files === undefined || files.length === 0) {
      return [];
    }
    const promises: Promise<DocumentReference>[] =
      files.map((f: Express.Multer.File) => this.docRefController.create(uid, data, f));
    return Promise.all(promises);
  }

  private async mapToResponse(composition: Composition): Promise<CompositionResponse> {
    const patient: string = await this.userController.searchByRef(composition.subject.reference)
      .then((user: DBUser) => user._id);
    if (composition.section && composition.section.length) {
      const promises: Promise<DocumentReference>[] = flatten(composition.section.map((section: CompositionSection) => section.entry))
        .map((ref: Reference) => ref.reference)
        .map((ref: string) => ref.split('/')[1])
        .map((id: string) => this.docRefController.read(id));
      return Promise.all(promises).then((docsRefs: DocumentReference[]) => {
        return {
          title: composition.title,
          description: this.getDescription(composition),
          date: composition.date,
          files: docsRefs,
          type: composition.type.coding[0].code as DocumentType,
          id: composition.id,
          patient
        };
      });
    }
    return {
      title: composition.title,
      date: composition.date,
      description: this.getDescription(composition),
      files: [],
      type: composition.type.coding[0].code as DocumentType,
      id: composition.id,
      patient
    };
  }

  private getDescription(composition: Composition): string {
    return composition.extension.find((extension: ResourceExtension) => extension.url === ExtensionUrl.description).valueString || '';
  }

  private getCompositionAttachments(compositionId: string): Promise<Attachment[]> {
    return this.compositionResource.search<BundleResponse<Composition | DocumentReference>>(`_id=${compositionId}&_include=Composition:entry`)
      .then((bundle: BundleResponse<Composition | DocumentReference>) => bundle.total > 0 ? bundle.entry : Promise.reject(new CustomError(ErrorCode.RESOURCES_NOT_FOUND)))
      .then((entries: BundleEntry<Composition | DocumentReference>[]) => entries.filter((entry: BundleEntry<DocumentReference | Composition>) => entry.resource.resourceType === ResourceType.DocumentReference))
      .then((entries: BundleEntry<DocumentReference>[]) => entries.map((entry: BundleEntry<DocumentReference>) => entry.resource.content))
      .then((contents: DocumentContent[][]) => flatten<DocumentContent>(contents).map((docCont: DocumentContent) => docCont.attachment));
  }
}
