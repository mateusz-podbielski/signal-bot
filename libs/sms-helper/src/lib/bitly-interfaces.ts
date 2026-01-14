export interface BitlyShortenData {
  long_url: string;
  domain: string;
  group_guid: string;
}

export interface BitlyDeepLink {
  guid: string;
  bitlink: string;
  app_uri_path: string;
  install_url: string;
  app_guid: string;
  os: string;
  install_type: string;
  created: string;
  modified: string;
  brand_guid: string;
}

export interface BitlyShortenResponse {
  references: unknown;
  link: string;
  id: string;
  long_url: string;
  title: string;
  archived: boolean;
  created_at: string;
  created_by: string;
  client_id: string;
  custom_bitlinks: string[];
  tags: string[];
  deeplinks: BitlyDeepLink[];
}
