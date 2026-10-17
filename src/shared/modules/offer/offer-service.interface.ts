import type {DocumentType} from '@typegoose/typegoose';
import type {CreateOfferDto} from './dto/create-offer.dto.js';
import type {OfferEntity} from './offer.entity.js';

export interface OfferService {
  create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>>;

  findById(offerId: string): Promise<DocumentType<OfferEntity> | null>;
}
