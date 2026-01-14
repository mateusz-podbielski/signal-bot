import {conf} from '@conf';
import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {logger, logLevels} from '@signalbot-backend/logger';
import {VALUE_SET_NAMES, ValueSetsResponse} from '@signalbot-backend/interfaces';
import {CustomError, ErrorCode} from "@signalbot-backend/custom-error";

export class FhirResourcesLoader {
  private static fhirUrl: string = process.env.BACKEND_FHIR_URL || conf.BACKEND_FHIR_URL;
  private static fhirPort: string = process.env.BACKEND_FHIR_PORT || conf.BACKEND_FHIR_PORT;
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({baseURL: `${FhirResourcesLoader.fhirUrl}:${FhirResourcesLoader.fhirPort}/fhir`});
  }

  public async postResources(): Promise<void> {
    for (let i = 0; i < VALUE_SET_NAMES.length; i++) {
      const resourceName: string = VALUE_SET_NAMES[i];
      await this.addResource(resourceName);
    }
  }

  public fhirHealthCheck(): Promise<unknown> {
    return this.http.get('/metadata');
  }

  private addResource(resourceName: string): Promise<void> {
      return this.checkResource(resourceName)
        .then((result: boolean) => result ? this.putResource(resourceName) : Promise.resolve()).catch((reason) => {
            logger.log(logLevels.info, reason.message);
              this.putResource(resourceName);
          }
        );
  }

  private async putResource(resourceName: string): Promise<void> {
    return import(`./assets/ValueSet/${resourceName}.json`)
      .then(data => this.http.put(`/ValueSet/${resourceName}`, data))
      .then(() => logger.log(logLevels.info, `Fhir ${resourceName} has been posted`))
      .then(() => void 0);
  }

  private async checkResource(resourceName: string): Promise<boolean> {
    return await this.http.get(`/ValueSet/${resourceName}`)
      .then((response: AxiosResponse<ValueSetsResponse>) => this.checkResourceVersion(response.data));
  }

  private async checkResourceVersion(valueSet: ValueSetsResponse): Promise<boolean> {
    const current: number = parseInt(valueSet.version, 10);
    const next: number = await import(`./assets/ValueSet/${valueSet.id}.json`)
      .then((json: ValueSetsResponse) => parseInt(json?.version, 10)) || 0;
    return current < next;
  }
}
