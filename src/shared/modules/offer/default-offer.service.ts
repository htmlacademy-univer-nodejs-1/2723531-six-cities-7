import {inject, injectable} from 'inversify';
import type {DocumentType, ReturnModelType} from '@typegoose/typegoose';
import type {Logger} from '../../logger/index.js';
import {Component} from '../../types/index.js';
import type {CreateOfferDto} from './dto/create-offer.dto.js';
import type {OfferEntity} from './offer.entity.js';
import type {OfferService} from './offer-service.interface.js';

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.OfferModel) private readonly offerModel: ReturnModelType<typeof OfferEntity>,
  ) {}

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const offer = await this.offerModel.create(dto);
    this.logger.info('Создано новое предложение по аренде.');

    return offer;
  }

  public async findById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel.findById(offerId).exec();
  }
}
