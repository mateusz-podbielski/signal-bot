import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {conf} from '@conf';
import {BitlyShortenData, BitlyShortenResponse} from './bitly-interfaces';

export class BitlyApi {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: conf.BITLY_API_URL,
      headers: {
        authorization: `Bearer ${process.env.BACKEND_BITLY_TOKEN}`,
      },
    });
  }

  /**
   * Crates shorten link using bit.ly
   * @param long_url
   * @return shorten link
   */
  public shorten(long_url: string): Promise<string> {
    const data: BitlyShortenData = {
      long_url,
      domain: 'bit.ly',
      group_guid: 'signalbot2021',
    };
    return this.http.post<BitlyShortenResponse>('/shorten', data)
      .then((response: AxiosResponse<BitlyShortenResponse>) => response.data.link);
  }
}
