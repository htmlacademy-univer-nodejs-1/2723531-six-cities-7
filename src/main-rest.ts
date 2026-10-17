import 'reflect-metadata';
import {RestApplication} from './rest/rest.application.js';
import {RestConfig} from './shared/libs/config/index.js';
import type {Config, RestSchema} from './shared/libs/config/index.js';
import {Component} from './shared/types/index.js';
import {createContainer} from './shared/container.js';

async function bootstrap(): Promise<void> {
  const container = createContainer();
  container.bind<Config<RestSchema>>(Component.Config).to(RestConfig).inSingletonScope();
  container.bind<RestApplication>(Component.RestApplication).to(RestApplication).inSingletonScope();
  const application = container.get<RestApplication>(Component.RestApplication);
  await application.init();
}

await bootstrap();
