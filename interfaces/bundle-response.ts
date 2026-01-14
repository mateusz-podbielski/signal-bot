import {ResourceType} from './resource';

export interface BundleResponseLink {
  relation: string;
  url: string;
}

export interface BundleResponse<T> {
  resourceType: ResourceType.Bundle;
  id: string;
  meta: {
    lastUpdated: string;
  };
  type: string;
  total: number;
  link: BundleResponseLink[];
  entry: BundleEntry<T>[];
}

export interface BundleEntry<T> {
  fullUrl: string;
  resource: T;
}
