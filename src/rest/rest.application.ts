import {inject, injectable} from 'inversify';
import type {Logger} from '../shared/logger/index.js';
import type {Config, RestSchema} from '../shared/libs/config/index.js';
import type {DatabaseClient} from '../shared/libs/database-client/index.js';
import {Component} from '../shared/types/index.js';
import {getMongoURI} from '../shared/helpers/index.js';
import express from 'express';
import type {Express} from 'express';
import type {Controller, ExceptionFilter} from '../shared/libs/rest/index.js';

@injectable()
export class RestApplication {
  private server: Express;
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
    @inject(Component.ExceptionFilter) private readonly exceptionFilter: ExceptionFilter,
    @inject(Component.UserController) private readonly userController: Controller,
    @inject(Component.OfferController) private readonly offerController: Controller,
  ) {
    this.server = express();
  }

  private async initDatabase(): Promise<void> {
    const uri = getMongoURI(
      this.config.get('DB_USER'),
      this.config.get('DB_PASSWORD'),
      this.config.get('DB_HOST'),
      this.config.get('DB_PORT'),
      this.config.get('DB_NAME'),
    );

    await this.databaseClient.connect(uri);
  }

  private initServer(): void {
    const port = this.config.get('PORT');
    this.server.listen(port, () => {
      this.logger.info(`Сервер запущен на порту ${port}.`);
    });
  }

  private initMiddleware(): void {
    this.server.use(express.json());
  }

  private initControllers(): void {
    this.server.use('/users', this.userController.router);
    this.server.use('/offers', this.offerController.router);
  }

  private initExceptionFilters(): void {
    this.server.use(
      this.exceptionFilter.catch.bind(this.exceptionFilter),
    );
  }

  public async init(): Promise<void> {
    await this.initDatabase();
    this.initMiddleware();
    this.initControllers();
    this.initExceptionFilters();
    this.initServer();
    this.logger.info('RestApplication initialized');
    this.logger.info(`Порт приложения: ${this.config.get('PORT')}`);
  }
}
