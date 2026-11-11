import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import {isValidObjectId} from 'mongoose';
import type {Request, Response} from 'express';
import {BaseController, HttpError} from '../../libs/rest/index.js';
import {getUserId, requireUserId} from '../../libs/rest/helpers/request-user.js';
import type {Logger} from '../../logger/index.js';
import {CITIES, Component, HttpMethod} from '../../types/index.js';
import type {City} from '../../types/index.js';
import {fillDTO} from '../../helpers/index.js';
import type {OfferService} from './offer-service.interface.js';
import type {OfferDetails} from './offer-view.type.js';
import type {CreateOfferRequest} from './create-offer-request.type.js';
import type {UpdateOfferRequest} from './update-offer-request.type.js';
import {OfferPreviewRdo} from './rdo/offer-preview.rdo.js';
import {OfferRdo} from './rdo/offer.rdo.js';

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.OfferService) private readonly offerService: OfferService,
  ) {
    super(logger);

    this.addRoute({path: '/', method: HttpMethod.Get, handler: this.index});
    this.addRoute({path: '/', method: HttpMethod.Post, handler: this.create});
    this.addRoute({path: '/premium', method: HttpMethod.Get, handler: this.findPremium});
    this.addRoute({path: '/favorites', method: HttpMethod.Get, handler: this.findFavorites});
    this.addRoute({path: '/:offerId', method: HttpMethod.Get, handler: this.show});
    this.addRoute({path: '/:offerId', method: HttpMethod.Patch, handler: this.update});
    this.addRoute({path: '/:offerId', method: HttpMethod.Delete, handler: this.delete});
    this.addRoute({path: '/:offerId/favorite', method: HttpMethod.Put, handler: this.addFavorite});
    this.addRoute({path: '/:offerId/favorite', method: HttpMethod.Delete, handler: this.removeFavorite});
  }

  private getOfferId(req: Request): string {
    const offerId = req.params.offerId;

    if (typeof offerId !== 'string' || !isValidObjectId(offerId)) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Некорректный идентификатор предложения.');
    }

    return offerId;
  }

  private async getOffer(offerId: string, userId?: string): Promise<OfferDetails> {
    const offer = await this.offerService.findById(offerId, userId);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение не найдено.');
    }

    return offer;
  }

  private checkAuthor(offer: OfferDetails, userId: string): void {
    if (offer.user.id !== userId) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Изменять и удалять предложение может только автор.');
    }
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
    const offer = await this.getOffer(this.getOfferId(req), getUserId(res));
    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async create({body}: CreateOfferRequest, res: Response): Promise<void> {
    const userId = requireUserId(res);
    const createdOffer = await this.offerService.create({...body, userId});
    const offer = await this.getOffer(createdOffer._id.toString(), userId);
    this.created(res, fillDTO(OfferRdo, offer));
  }

  public async update(req: UpdateOfferRequest, res: Response): Promise<void> {
    const userId = requireUserId(res);
    const offerId = this.getOfferId(req);
    const existingOffer = await this.getOffer(offerId, userId);
    this.checkAuthor(existingOffer, userId);

    const offer = await this.offerService.updateById(offerId, req.body, userId);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение не найдено.');
    }

    this.ok(res, fillDTO(OfferRdo, offer));
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(res);
    const offerId = this.getOfferId(req);
    const offer = await this.getOffer(offerId, userId);
    this.checkAuthor(offer, userId);

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

  public async findFavorites(_req: Request, res: Response): Promise<void> {
    const offers = await this.offerService.findFavorites(requireUserId(res));
    this.ok(res, fillDTO(OfferPreviewRdo, offers));
  }

  public async addFavorite(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(res);
    const offerId = this.getOfferId(req);

    if (!await this.offerService.addToFavorites(offerId, userId)) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение или пользователь не найден.');
    }

    const offer = await this.getOffer(offerId, userId);
    this.ok(res, fillDTO(OfferPreviewRdo, offer));
  }

  public async removeFavorite(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(res);

    if (!await this.offerService.removeFromFavorites(this.getOfferId(req), userId)) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Предложение или пользователь не найден.');
    }

    this.noContent(res);
  }
}
