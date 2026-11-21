import {BaseController, DocumentExistsMiddleware, ValidateDtoMiddleware, ValidateObjectIdMiddleware} from '../../libs/rest/index.js';
import {inject, injectable} from 'inversify';
import {Component, HttpMethod} from '../../types/index.js';
import type {Logger} from '../../logger/index.js';
import type {CommentService} from './comment-service.interface.js';
import type {Request, Response} from 'express';
import {fillDTO} from '../../helpers/index.js';
import {CommentRdo} from './rdo/comment.rdo.js';
import type {OfferService} from '../offer/index.js';
import {CreateCommentDto} from './dto/create-comment.dto.js';
import type {UserService} from '../user/user-service.interface.js';

@injectable()
export class CommentController extends BaseController {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.CommentService) private readonly commentService: CommentService,
    @inject(Component.OfferService) offerService: OfferService,
    @inject(Component.UserService) userService: UserService,
  ) {
    super(logger);
    this.addRoute({
      path: '/:offerId/comments',
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [
        new ValidateObjectIdMiddleware('offerId'),
        new ValidateObjectIdMiddleware('userId', 'body'),
        new ValidateDtoMiddleware(CreateCommentDto, {whitelist: true, forbidNonWhitelisted: true}),
        new DocumentExistsMiddleware(offerService, 'offerId', 'Предложение не найдено.'),
        new DocumentExistsMiddleware(userService, 'userId', 'Автор комментария не найден.', 'body'),
      ],
    });
  }

  public async create(
    req: Request<Request['params'], unknown, Omit<CreateCommentDto, 'offerId'>>,
    res: Response,
  ): Promise<void> {
    const offerId = req.params.offerId as string;

    const {text, rating, userId} = req.body;

    const comment = await this.commentService.create({offerId, text, rating, userId});
    const response = fillDTO(CommentRdo, comment.toObject({virtuals: true}));
    this.created(res, response);
  }
}
