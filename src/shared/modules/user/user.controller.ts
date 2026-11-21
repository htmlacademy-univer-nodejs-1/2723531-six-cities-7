import {rename, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import type {Request, Response} from 'express';
import {BaseController, DocumentExistsMiddleware, HttpError, ValidateDtoMiddleware, ValidateObjectIdMiddleware} from '../../libs/rest/index.js';
import {getUserId} from '../../libs/rest/helpers/request-user.js';
import type {Logger} from '../../logger/index.js';
import type {Config, RestSchema} from '../../libs/config/index.js';
import {Component, HttpMethod} from '../../types/index.js';
import {fillDTO} from '../../helpers/index.js';
import type {UserService} from './user-service.interface.js';
import type {CreateUserRequest} from './create-user-request.type.js';
import type {LoginUserRequest} from './login-user-request.type.js';
import {UserRdo} from './rdo/user.rdo.js';
import {CreateUserDto} from './dto/create-user.dto.js';
import {LoginUserDto} from './dto/login-user.dto.js';
import {UploadAvatarMiddleware} from './upload-avatar.middleware.js';
import {AVATAR_URL_PATH, DEFAULT_AVATAR_FILENAME} from './user.constant.js';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
  ) {
    super(logger);

    const validatorOptions = {whitelist: true, forbidNonWhitelisted: true};
    this.addRoute({
      path: '/register',
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [new ValidateDtoMiddleware(CreateUserDto, validatorOptions)],
    });
    this.addRoute({
      path: '/login',
      method: HttpMethod.Post,
      handler: this.login,
      middlewares: [new ValidateDtoMiddleware(LoginUserDto, validatorOptions)],
    });
    this.addRoute({path: '/login', method: HttpMethod.Get, handler: this.checkAuth});
    this.addRoute({
      path: '/:userId/avatar',
      method: HttpMethod.Post,
      handler: this.uploadAvatar,
      middlewares: [
        new ValidateObjectIdMiddleware('userId'),
        new UploadAvatarMiddleware(this.config.get('UPLOAD_DIRECTORY'), logger),
        new DocumentExistsMiddleware(userService, 'userId', 'Пользователь не найден.'),
      ],
    });
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

    const dto = {...body, avatarPath: this.getAvatarUrl(DEFAULT_AVATAR_FILENAME)};
    const user = await this.userService.create(dto, this.config.get('SALT'));
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

  public async uploadAvatar(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const file = req.file;

    if (!file) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Файл аватара не получен.');
    }

    const filePath = join(this.config.get('UPLOAD_DIRECTORY'), file.filename);
    const avatarPath = this.getAvatarUrl(file.filename);
    await rename(file.path, filePath);
    let user: Awaited<ReturnType<UserService['updateById']>>;

    try {
      user = await this.userService.updateById(userId, {avatarPath});

      if (!user) {
        throw new HttpError(StatusCodes.NOT_FOUND, 'Пользователь не найден.');
      }
    } catch (error: unknown) {
      await rm(filePath, {force: true}).catch(() => {
        this.logger.warn(`Не удалось удалить файл аватара после ошибки: userId=${userId}.`);
      });
      throw error;
    }

    this.ok(res, fillDTO(UserRdo, user.toObject({virtuals: true})));
  }

  private getAvatarUrl(filename: string): string {
    const origin = this.config.get('PUBLIC_URL') || `http://localhost:${this.config.get('PORT')}`;
    return new URL(`${AVATAR_URL_PATH}/${filename}`, origin).href;
  }
}
