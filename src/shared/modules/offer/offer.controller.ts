import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import type {Request, Response} from 'express';
import {BaseController, DocumentExistsMiddleware, HttpError, ValidateDtoMiddleware, ValidateObjectIdMiddleware} from '../../libs/rest/index.js';
import {getUserId} from '../../libs/rest/helpers/request-user.js';
import type {Logger} from '../../logger/index.js';
import type {City} from '../../types/index.js';
import {CITIES, Component, HttpMethod} from '../../types/index.js';
import {fillDTO} from '../../helpers/index.js';
import type {OfferService} from './offer-service.interface.js';
import type {OfferDetails} from './offer-view.type.js';
import type {CreateOfferRequest} from './create-offer-request.type.js';
import {CreateOfferDto} from './dto/create-offer.dto.js';
import {UpdateOfferDto} from './dto/update-offer.dto.js';
import type {UpdateOfferRequest} from './update-offer-request.type.js';
import {OfferPreviewRdo} from './rdo/offer-preview.rdo.js';
import {OfferRdo} from './rdo/offer.rdo.js';
import {CommentRdo, CommentService} from '../comment/index.js';
import type {UserService} from '../user/user-service.interface.js';

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.CommentService) private readonly commentService: CommentService,
    @inject(Component.UserService) userService: UserService,
  ) {
    super(logger);

    const validateOfferId = new ValidateObjectIdMiddleware('offerId');
    const validateFavoriteUserId = new ValidateObjectIdMiddleware('userId', 'query');
    const offerExists = new DocumentExistsMiddleware(offerService, 'offerId', 'Предложение не найдено.');
    const favoriteUserExists = new DocumentExistsMiddleware(userService, 'userId', 'Пользователь не найден.', 'query');

    this.addRoute({path: '/', method: HttpMethod.Get, handler: this.index});
    this.addRoute({
      path: '/',
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [
        new ValidateDtoMiddleware(CreateOfferDto),
        new ValidateObjectIdMiddleware('userId', 'body'),
        new DocumentExistsMiddleware(userService, 'userId', 'Автор предложения не найден.', 'body'),
      ],
    });
    this.addRoute({path: '/premium', method: HttpMethod.Get, handler: this.findPremium});
    this.addRoute({
      path: '/favorites',
      method: HttpMethod.Get,
      handler: this.findFavorites,
      middlewares: [validateFavoriteUserId, favoriteUserExists],
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Get,
      handler: this.show,
      middlewares: [validateOfferId, offerExists],
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Patch,
      handler: this.update,
      middlewares: [
        validateOfferId,
        new ValidateDtoMiddleware(UpdateOfferDto, {
          skipUndefinedProperties: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
        offerExists,
      ],
    });
    this.addRoute({
      path: '/:offerId',
      method: HttpMethod.Delete,
      handler: this.delete,
      middlewares: [validateOfferId, offerExists],
    });
    this.addRoute({
      path: '/:offerId/favorite',
      method: HttpMethod.Put,
      handler: this.addFavorite,
      middlewares: [validateFavoriteUserId, validateOfferId, offerExists, favoriteUserExists],
    });
    this.addRoute({
      path: '/:offerId/favorite',
      method: HttpMethod.Delete,
      handler: this.removeFavorite,
      middlewares: [validateFavoriteUserId, validateOfferId, offerExists, favoriteUserExists],
    });
    this.addRoute({
      path: '/:offerId/comments',
      method: HttpMethod.Get,
      handler: this.getComments,
      middlewares: [validateOfferId, offerExists],
    });
  }

  private async getOffer(offerId: string, userId?: string): Promise<OfferDetails> {
    const offer = await this.offerService.findById(offerId, userId);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение не найдено.');
    }

    return offer;
  }

  public async index(req: Request, res: Response): Promise<void> {
    const rawLimit = req.query.limit;
    const limit = rawLimit === undefined ? undefined : Number(rawLimit);

    if (limit !== undefined && (typeof rawLimit !== 'string' || !Number.isSafeInteger(limit) || limit < 1)) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Параметр limit должен быть положительным целым числом.');
    }

    const offers = await this.offerService.find(limit, getUserId(res));
    this.ok(res, fillDTO(OfferPreviewRdo, offers));
  }

  public async show(req: Request, res: Response): Promise<void> {
    const offer = await this.getOffer(req.params.offerId as string, getUserId(res));
    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async create({body}: CreateOfferRequest, res: Response): Promise<void> {
    const createdOffer = await this.offerService.create(body);
    const offer = await this.getOffer(createdOffer._id.toString());
    this.created(res, fillDTO(OfferRdo, offer));
  }

  public async update(req: UpdateOfferRequest, res: Response): Promise<void> {
    const offerId = req.params.offerId as string;
    const offer = await this.offerService.updateById(offerId, req.body);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение не найдено.');
    }

    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const offerId = req.params.offerId as string;

    if (!await this.offerService.deleteById(offerId)) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение не найдено.');
    }

    this.noContent(res);
  }

  public async findPremium(req: Request, res: Response): Promise<void> {
    const city = req.query.city;

    if (typeof city !== 'string' || !CITIES.includes(city as City)) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Укажите город в параметре city.');
    }

    const offers = await this.offerService.findPremium(city as City, getUserId(res));
    this.ok(res, fillDTO(OfferPreviewRdo, offers));
  }

  public async findFavorites(req: Request, res: Response): Promise<void> {
    const offers = await this.offerService.findFavorites(req.query.userId as string);
    this.ok(res, fillDTO(OfferPreviewRdo, offers));
  }

  public async addFavorite(req: Request, res: Response): Promise<void> {
    const userId = req.query.userId as string;
    const offerId = req.params.offerId as string;

    if (!await this.offerService.addToFavorites(offerId, userId)) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение или пользователь не найден.');
    }

    const offer = await this.getOffer(offerId, userId);
    this.ok(res, fillDTO(OfferPreviewRdo, offer));
  }

  public async removeFavorite(req: Request, res: Response): Promise<void> {
    const userId = req.query.userId as string;

    if (!await this.offerService.removeFromFavorites(req.params.offerId as string, userId)) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение или пользователь не найден.');
    }

    this.noContent(res);
  }

  public async getComments(req: Request, res: Response): Promise<void> {
    const offerId = req.params.offerId as string;
    const comments = await this.commentService.findByOfferId(offerId);
    const commentObjects = comments.map((comment) => comment.toObject({virtuals: true}));
    this.ok(res, fillDTO(CommentRdo, commentObjects));
  }
}
