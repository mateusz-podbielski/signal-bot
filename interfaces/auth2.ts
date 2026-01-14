export interface Auth2 {
  token: string;
  audience: string;
}

export interface Auth2Token {
  authToken?: string;
  refreshToken?: string;
  expires?: number;
}
