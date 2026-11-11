import type {Container} from 'inversify';
import {RestApplication} from './rest.application.js';
import {createContainer} from '../shared/container.js';
import {RestConfig} from '../shared/libs/config/index.js';
import type {Config, RestSchema} from '../shared/libs/config/index.js';
import {Component} from '../shared/types/index.js';
import {AppExceptionFilter} from '../shared/libs/rest/index.js';
import type {Controller, ExceptionFilter} from '../shared/libs/rest/index.js';
import {OfferController} from '../shared/modules/offer/offer.controller.js';
import {UserController} from '../shared/modules/user/user.controller.js';

export function createRestApplicationContainer(): Container {
  const container = createContainer();

  container.bind<Config<RestSchema>>(Component.Config).to(RestConfig).inSingletonScope();
  container.bind<RestApplication>(Component.RestApplication).to(RestApplication).inSingletonScope();
  container
    .bind<ExceptionFilter>(Component.ExceptionFilter)
    .to(AppExceptionFilter)
    .inSingletonScope();
  container.bind<Controller>(Component.UserController).to(UserController).inSingletonScope();

  container.bind<Controller>(Component.OfferController).to(OfferController).inSingletonScope();

  return container;
}
