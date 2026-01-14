import {
  BundleEntry,
  BundleResponse, DateRangeWithLimit,
  ExtensionUrl,
  Reference,
  Resource,
  ResourceExtension,
  ResourceType
} from '@signalbot-backend/interfaces';
import { getFhirResourceId } from '@signalbot-backend/user-resource';
import { FhirResource } from '@signalbot-backend/fhir-connector';

export function createReference(uid: string): Promise<Reference> {
  return getFhirResourceId(uid)
    .then((fhirResourceId) => FhirResource.referenceBuilder(fhirResourceId.resourceType, fhirResourceId.fhirId));
}

export function extensionIndex(resourceType: ResourceType, id: string, url: ExtensionUrl): Promise<number> {
  return new FhirResource(resourceType).read(id)
    .then((resource: Resource) => resource.extension)
    .then((extensions: ResourceExtension[]) => extensions.findIndex((extension: ResourceExtension) => extension.url === url));
}

export function bundleToResponse<T>(bundle: BundleResponse<T>): T[] {
  return bundle.total > 0 ? bundle.entry.map((entry: BundleEntry<T>) => entry.resource) : [];
}

export function searchQuery(query: DateRangeWithLimit): string {
  const searchQuery: string[] = [];
  if (query.limit) searchQuery.push(`_count=${query.limit}`);
  if (query.from) searchQuery.push(`date=ge${query.from}`);
  if (query.to) searchQuery.push(`date=le${query.to}`);
  return searchQuery.join('&');
}

export function assert<T>(data: unknown): T {
  return data as unknown as T;
}
