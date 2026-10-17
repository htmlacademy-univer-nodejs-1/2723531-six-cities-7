import {inject, injectable} from 'inversify';
import type {Logger} from '../shared/logger/index.js';
import type {Config, RestSchema} from '../shared/libs/config/index.js';
import type {DatabaseClient} from '../shared/libs/database-client/index.js';
import {Component} from '../shared/types/index.js';
import {getMongoURI} from '../shared/helpers/index.js';

@injectable()
export class RestApplication {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
  ) {}

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

  public async init(): Promise<void> {
    await this.initDatabase();

    this.logger.info('RestApplication initialized');
    this.logger.info(`Порт приложения: ${this.config.get('PORT')}`);
  }
}
