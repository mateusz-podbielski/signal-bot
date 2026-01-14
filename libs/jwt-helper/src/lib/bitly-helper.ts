import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { conf } from '@conf';

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
  deeplinks: unknown[];
}

export class BitlyHelper {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: conf.BITLY_API_URL,
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_BITLY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }

  public shorten(long_url: string): Promise<string> {
    const data = {
      domain: 'bit.ly',
      long_url
    };
    return this.http.post<BitlyShortenResponse>('/shorten', data)
      .then((response: AxiosResponse<BitlyShortenResponse>) => response.data.link);
  }
}
