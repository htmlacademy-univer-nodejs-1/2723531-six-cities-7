import {Container} from 'inversify';
import type {ReturnModelType} from '@typegoose/typegoose';
import {MongoDatabaseClient} from './libs/database-client/index.js';
import type {DatabaseClient} from './libs/database-client/index.js';
import {PinoLogger} from './logger/index.js';
import type {Logger} from './logger/index.js';
import {DefaultUserService, UserModel} from './modules/user/index.js';
import type {UserEntity, UserService} from './modules/user/index.js';
import {DefaultOfferService, OfferModel} from './modules/offer/index.js';
import type {OfferEntity, OfferService} from './modules/offer/index.js';
import {CommentModel, DefaultCommentService} from './modules/comment/index.js';
import type {CommentEntity, CommentService} from './modules/comment/index.js';
import {Component} from './types/index.js';

export function createContainer(): Container {
  const container = new Container();

  container.bind<Logger>(Component.Logger).to(PinoLogger).inSingletonScope();
  container.bind<DatabaseClient>(Component.DatabaseClient).to(MongoDatabaseClient).inSingletonScope();
  container.bind<ReturnModelType<typeof UserEntity>>(Component.UserModel).toConstantValue(UserModel);
  container.bind<UserService>(Component.UserService).to(DefaultUserService).inSingletonScope();
  container.bind<ReturnModelType<typeof OfferEntity>>(Component.OfferModel).toConstantValue(OfferModel);
  container.bind<OfferService>(Component.OfferService).to(DefaultOfferService).inSingletonScope();
  container.bind<ReturnModelType<typeof CommentEntity>>(Component.CommentModel).toConstantValue(CommentModel);
  container.bind<CommentService>(Component.CommentService).to(DefaultCommentService).inSingletonScope();

  return container;
}
