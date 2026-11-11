import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import type {Request, Response} from 'express';
import {BaseController, HttpError} from '../../libs/rest/index.js';
import {getUserId} from '../../libs/rest/helpers/request-user.js';
import type {Logger} from '../../logger/index.js';
import type {Config, RestSchema} from '../../libs/config/index.js';
import {Component, HttpMethod} from '../../types/index.js';
import {fillDTO} from '../../helpers/index.js';
import type {UserService} from './user-service.interface.js';
import type {CreateUserRequest} from './create-user-request.type.js';
import type {LoginUserRequest} from './login-user-request.type.js';
import {UserRdo} from './rdo/user.rdo.js';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
  ) {
    super(logger);

    this.addRoute({path: '/register', method: HttpMethod.Post, handler: this.create});
    this.addRoute({path: '/login', method: HttpMethod.Post, handler: this.login});
    this.addRoute({path: '/login', method: HttpMethod.Get, handler: this.checkAuth});
    this.addRoute({path: '/:userId/avatar', method: HttpMethod.Post, handler: this.uploadAvatar});
  }

  public async create({body}: CreateUserRequest, res: Response): Promise<void> {
    if (getUserId(res)) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Регистрация доступна только неавторизованным пользователям.');
    }

    const existingUser = await this.userService.findByEmail(body.email);

    if (existingUser) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        'Пользователь уже существует.',
        'UserController',
      );
    }

    const user = await this.userService.create(body, this.config.get('SALT'));
    this.created(res, fillDTO(UserRdo, user.toObject({virtuals: true})));
  }

  public async login({body}: LoginUserRequest, _res: Response): Promise<void> {
    const user = await this.userService.verifyUser(body.email, body.password, this.config.get('SALT'));

    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Неверный email или пароль.', 'UserController');
    }

    throw new HttpError(StatusCodes.NOT_IMPLEMENTED, 'Выдача токена будет реализована в разделе авторизации.');
  }

  public checkAuth(_req: Request, _res: Response): void {
    throw new HttpError(StatusCodes.NOT_IMPLEMENTED, 'Проверка токена будет реализована в разделе авторизации.');
  }

  public uploadAvatar(_req: Request, _res: Response): void {
    throw new HttpError(StatusCodes.NOT_IMPLEMENTED, 'Загрузка аватара будет реализована в разделе работы с файлами.');
  }
}
