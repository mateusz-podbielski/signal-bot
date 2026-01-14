export enum JsonPatchOperation {
  ADD = 'add',
  REMOVE = 'remove',
  REPLACE = 'replace',
  MOVE = 'move',
  COPY = 'copy',
  TEST = 'test',
}

export interface JsonPatch {
  op: JsonPatchOperation;
  path: string;
  value?: unknown;
}
