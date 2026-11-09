import {inject, injectable} from 'inversify';
import type {DocumentType, ReturnModelType} from '@typegoose/typegoose';
import type {Types} from 'mongoose';
import type {Logger} from '../../logger/index.js';
import {Component, SortType} from '../../types/index.js';
import type {City} from '../../types/index.js';
import type {CommentEntity} from '../comment/comment.entity.js';
import type {UserEntity} from '../user/user.entity.js';
import {USER_PUBLIC_FIELDS} from '../user/user.constant.js';
import type {CreateOfferDto} from './dto/create-offer.dto.js';
import type {UpdateOfferDto} from './dto/update-offer.dto.js';
import type {OfferEntity} from './offer.entity.js';
import type {OfferService} from './offer-service.interface.js';
import type {OfferDetails, OfferPreview} from './offer-view.type.js';
import {DEFAULT_OFFER_COUNT, OFFER_PREVIEW_FIELDS, OFFER_UPDATE_FIELDS, PREMIUM_OFFER_COUNT} from './offer.constant.js';

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.OfferModel) private readonly offerModel: ReturnModelType<typeof OfferEntity>,
    @inject(Component.CommentModel) private readonly commentModel: ReturnModelType<typeof CommentEntity>,
    @inject(Component.UserModel) private readonly userModel: ReturnModelType<typeof UserEntity>,
  ) {}

  private getOfferData(dto: CreateOfferDto | UpdateOfferDto): UpdateOfferDto {
    return Object.fromEntries(OFFER_UPDATE_FIELDS
      .filter((field) => dto[field] !== undefined)
      .map((field) => [field, dto[field]]));
  }

  private async getFavoriteIds(userId?: string): Promise<Set<string>> {
    if (!userId) {
      return new Set();
    }

    const user = await this.userModel.findById(userId).select('favoriteOffers').exec();
    return new Set(user?.favoriteOffers.map((offerId) => String(offerId)) ?? []);
  }

  private createPreview(
    offer: Omit<OfferPreview, 'id' | 'isFavorite'> & {_id: Types.ObjectId},
    favoriteIds: Set<string>,
  ): OfferPreview {
    const id = offer._id.toString();

    return {
      id,
      title: offer.title,
      price: offer.price,
      type: offer.type,
      isFavorite: favoriteIds.has(id),
      postDate: offer.postDate,
      city: offer.city,
      previewImage: offer.previewImage,
      isPremium: offer.isPremium,
      rating: offer.rating,
      commentCount: offer.commentCount,
    };
  }

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const offer = await this.offerModel.create({
      ...this.getOfferData(dto),
      userId: dto.userId,
      rating: 0,
      ratingSum: 0,
      commentCount: 0,
    });
    this.logger.info(`Создано новое предложение по аренде: offerId=${offer._id.toString()}, userId=${dto.userId}.`);

    return offer;
  }

  public async findById(offerId: string, userId?: string): Promise<OfferDetails | null> {
    const offer = await this.offerModel
      .findById(offerId)
      .populate<{userId: DocumentType<UserEntity>}>({path: 'userId', select: USER_PUBLIC_FIELDS})
      .exec();

    if (!offer || !offer.userId) {
      return null;
    }

    const favoriteIds = await this.getFavoriteIds(userId);

    return {
      ...this.createPreview(offer, favoriteIds),
      description: offer.description,
      images: offer.images,
      bedrooms: offer.bedrooms,
      maxAdults: offer.maxAdults,
      amenities: offer.amenities,
      location: {
        latitude: offer.location.latitude,
        longitude: offer.location.longitude,
      },
      user: {
        id: offer.userId._id.toString(),
        name: offer.userId.name,
        email: offer.userId.email,
        avatarPath: offer.userId.avatarPath,
        type: offer.userId.type,
      },
    };
  }

  public async find(count = DEFAULT_OFFER_COUNT, userId?: string): Promise<OfferPreview[]> {
    const favoriteIds = await this.getFavoriteIds(userId);
    const offers = await this.offerModel
      .find({}, OFFER_PREVIEW_FIELDS)
      .sort({postDate: SortType.Down, _id: SortType.Down})
      .limit(count)
      .exec();

    return offers.map((offer) => this.createPreview(offer, favoriteIds));
  }

  public async updateById(offerId: string, dto: UpdateOfferDto, userId?: string): Promise<OfferDetails | null> {
    const offer = await this.offerModel
      .findByIdAndUpdate(offerId, {$set: this.getOfferData(dto)}, {returnDocument: 'after'})
      .exec();

    if (!offer) {
      return null;
    }

    this.logger.info(`Предложение обновлено: offerId=${offerId}.`);
    return this.findById(offerId, userId);
  }

  public async deleteById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    const offer = await this.offerModel.findByIdAndDelete(offerId).exec();

    if (!offer) {
      return null;
    }

    const comments = await this.commentModel.deleteMany({offerId}).exec();
    await this.userModel.updateMany({favoriteOffers: offerId}, {$pull: {favoriteOffers: offerId}}).exec();
    this.logger.info(`Предложение удалено: offerId=${offerId}, comments=${comments.deletedCount}.`);
    return offer;
  }

  public async findPremium(city: City, userId?: string): Promise<OfferPreview[]> {
    const favoriteIds = await this.getFavoriteIds(userId);
    const offers = await this.offerModel
      .find({city, isPremium: true}, OFFER_PREVIEW_FIELDS)
      .sort({postDate: SortType.Down, _id: SortType.Down})
      .limit(PREMIUM_OFFER_COUNT)
      .exec();

    return offers.map((offer) => this.createPreview(offer, favoriteIds));
  }

  public async findFavorites(userId: string): Promise<OfferPreview[]> {
    const favoriteIds = await this.getFavoriteIds(userId);
    const offers = await this.offerModel
      .find({_id: {$in: [...favoriteIds]}}, OFFER_PREVIEW_FIELDS)
      .sort({postDate: SortType.Down, _id: SortType.Down})
      .exec();

    return offers.map((offer) => this.createPreview(offer, favoriteIds));
  }

  public async addToFavorites(offerId: string, userId: string): Promise<boolean> {
    if (!await this.exists(offerId)) {
      return false;
    }

    const result = await this.userModel.updateOne({_id: userId}, {$addToSet: {favoriteOffers: offerId}}).exec();

    if (result.matchedCount) {
      this.logger.info(`Предложение добавлено в избранное: offerId=${offerId}, userId=${userId}.`);
    }

    return result.matchedCount > 0;
  }

  public async removeFromFavorites(offerId: string, userId: string): Promise<boolean> {
    if (!await this.exists(offerId)) {
      return false;
    }

    const result = await this.userModel.updateOne({_id: userId}, {$pull: {favoriteOffers: offerId}}).exec();

    if (result.matchedCount) {
      this.logger.info(`Предложение удалено из избранного: offerId=${offerId}, userId=${userId}.`);
    }

    return result.matchedCount > 0;
  }

  public async exists(offerId: string): Promise<boolean> {
    return (await this.offerModel.exists({_id: offerId})) !== null;
  }

  public async incCommentCount(offerId: string, rating: number): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel.findByIdAndUpdate(offerId, [
      {$set: {
        commentCount: {$add: [{$ifNull: ['$commentCount', 0]}, 1]},
        ratingSum: {$add: [{$ifNull: ['$ratingSum', 0]}, rating]},
      }},
      {$set: {
        rating: {$divide: [
          {$floor: {$add: [
            {$divide: [{$multiply: ['$ratingSum', 10]}, '$commentCount']},
            0.5,
          ]}},
          10,
        ]},
      }},
    ], {returnDocument: 'after', updatePipeline: true}).exec();
  }

  public async resetCommentStats(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel.findByIdAndUpdate(offerId, {
      $set: {commentCount: 0, rating: 0, ratingSum: 0},
    }, {returnDocument: 'after'}).exec();
  }
}
