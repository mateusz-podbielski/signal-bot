/**
 * @link http://hl7.org/fhir/datatypes.html#Attachment
 */
export interface Attachment {
  contentType: string;
  data?: string;
  url?: string;
  size: number;
  hash?: string;
  title: string;
  creation: string;
}
