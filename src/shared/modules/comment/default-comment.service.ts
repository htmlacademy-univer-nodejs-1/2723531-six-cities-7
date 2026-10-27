import {inject, injectable} from 'inversify';
import type {DocumentType, ReturnModelType} from '@typegoose/typegoose';
import type {Logger} from '../../logger/index.js';
import {Component, SortType} from '../../types/index.js';
import type {OfferService} from '../offer/offer-service.interface.js';
import {USER_PUBLIC_FIELDS} from '../user/user.constant.js';
import type {CommentService} from './comment-service.interface.js';
import type {CommentEntity} from './comment.entity.js';
import type {CreateCommentDto} from './dto/create-comment.dto.js';
import {MAX_COMMENT_COUNT} from './comment.constant.js';

@injectable()
export class DefaultCommentService implements CommentService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CommentModel) private readonly commentModel: ReturnModelType<typeof CommentEntity>,
    @inject(Component.OfferService) private readonly offerService: OfferService,
  ) {}

  public async create(dto: CreateCommentDto): Promise<DocumentType<CommentEntity>> {
    if (!await this.offerService.exists(dto.offerId)) {
      throw new Error('Предложение не найдено.');
    }

    const comment = await this.commentModel.create({
      text: dto.text,
      rating: dto.rating,
      offerId: dto.offerId,
      userId: dto.userId,
    });

    try {
      const offer = await this.offerService.incCommentCount(dto.offerId, dto.rating);

      if (!offer) {
        throw new Error('Предложение не найдено.');
      }
    } catch (error: unknown) {
      await this.commentModel.deleteOne({_id: comment._id}).exec();
      throw error;
    }

    this.logger.info(`Комментарий создан: commentId=${comment._id.toString()}, offerId=${dto.offerId}, userId=${dto.userId}.`);
    return comment.populate({path: 'userId', select: USER_PUBLIC_FIELDS});
  }

  public async findByOfferId(offerId: string): Promise<DocumentType<CommentEntity>[]> {
    return this.commentModel
      .find({offerId})
      .sort({postDate: SortType.Down, _id: SortType.Down})
      .limit(MAX_COMMENT_COUNT)
      .populate({path: 'userId', select: USER_PUBLIC_FIELDS})
      .exec();
  }

  public async deleteByOfferId(offerId: string): Promise<number> {
    const result = await this.commentModel.deleteMany({offerId}).exec();
    await this.offerService.resetCommentStats(offerId);
    this.logger.info(`Комментарии удалены: offerId=${offerId}, count=${result.deletedCount}.`);
    return result.deletedCount;
  }
}
