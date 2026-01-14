import { Request, Response } from 'express';
import { AxiosError } from 'axios';
import { flattenDeep } from 'lodash';
import { Observation, ObservationType } from '@signalbot-backend/interfaces';
import { expressValidate } from '@signalbot-backend/validators';

import AppRouter from './app.router';
import { Weight, WeightItem } from '../../interfaces/weight';
import { GenericController } from '../controllers/generic.controller';
import { Glucose, GlucoseItem } from '../../interfaces/glucose';
import { Validators } from './Validators';
import { Pressure, PressureItem } from '../../interfaces/pressure';
import { LiveSpO2Temp, SaturationItem, TemperatureItem } from '../../interfaces/liveSpO2Temp';

export class BtHbRouter extends AppRouter {
  private controller: GenericController = new GenericController();

  public routes(): void {
    this.router.use(
      '/:imei/Weight',
      Validators.weightValidator,
      expressValidate,
      this.weightRouteHandler.bind(this)
    );

    this.router.use(
      '/:imei/Glucose',
      Validators.glucoseValidator,
      expressValidate,
      this.glucoseRouteHandler.bind(this)
    );

    this.router.use(
      '/:imei/Pressure',
      Validators.pressureValidator,
      expressValidate,
      this.pressureRouteHandler.bind(this)
    );

    this.router.post(
      '/:imei/LiveSpO2Temp',
      this.liveSpO2TempRouteHandler.bind(this)
    );

    this.router.post(
      '/:imei',
      (req: Request, resp: Response)=> {
        resp.sendStatus(200);
        //TODO Change to proper device check
      }
    );

    this.router.post(
      '/:id/Status',
      (req: Request, resp: Response)=> {
        resp.sendStatus(200);
        //TODO Change to proper device check
      }
    );

    this.router.post(
      '/:id/HWInfo',
      (req: Request, resp: Response)=> {
        resp.sendStatus(200);
        //TODO Change to proper device check
      }
    );

    this.router.post(
      '/:id/Location',
      (req: Request, resp: Response)=> {
        resp.sendStatus(200);
        //TODO Change to proper device check
      }
    );
  }

  private weightRouteHandler(req: Request, resp: Response): void {
    console.log('WEIGHT', req.body);
    const promises = (req.body as Weight).W.map(
      (item: WeightItem) => this.controller.saveSingleQuantityObservation(req.params.imei, item.W, item.ET, ObservationType.BodyWeight)
    );
    this.getResponses(promises, resp);
  }

  private glucoseRouteHandler(req: Request, resp: Response): void {
    console.log('GLUCOSE', req.body);
    const promises = (req.body as Glucose).G.map(
      (item: GlucoseItem) => this.controller.saveSingleQuantityObservation(req.params.imei, item.G, item.ET, ObservationType.GlucoseLevel)
    );
    this.getResponses(promises, resp);
  }

  private pressureRouteHandler(req: Request, resp: Response): void {
    console.log('PRESSURE', req.body);
    const promises = (req.body as Pressure).P.map(
      (item: PressureItem) => this.controller.savePressure(req.params.imei, item)
    );
    this.getResponses(promises, resp);
  }

  private liveSpO2TempRouteHandler(req: Request, resp: Response): void {
    console.log('SAT TEMP', req.body);
    let promises: Promise<Observation>[] = [];
    const data: LiveSpO2Temp = req.body;
    if (data.T && data.T.length) {
      promises = data.T.map((item: TemperatureItem) => this.controller.saveSingleQuantityObservation(req.params.imei, item.T, item.ET, ObservationType.BodyTemp));
    }
    if (data.Oxi && data.Oxi.length) {
      const oxiPromises: Promise<Observation>[] = flattenDeep((req.body as LiveSpO2Temp).Oxi.map(
        (item: SaturationItem) => [
          this.controller.saveSingleQuantityObservation(req.params.imei, item.P, item.ET, ObservationType.HeartRate),
          this.controller.saveSingleQuantityObservation(req.params.imei, item.S, item.ET, ObservationType.Saturation),
        ]
      ));
      promises = [...promises, ...oxiPromises];
    }
    this.getResponses(promises, resp);
  }

  private getResponses(promises: Promise<Observation | Observation[]>[], resp: Response): void {
    Promise.all(promises)
      .then(() => resp.send())
      .catch((err: AxiosError) => resp.status(400).send(err));
  }
}
