import type {DocumentType} from '@typegoose/typegoose';
import type {CreateOfferDto} from './dto/create-offer.dto.js';
import type {OfferEntity} from './offer.entity.js';
import type {UpdateOfferDto} from './dto/update-offer.dto.js';
import type {OfferDetails, OfferPreview} from './offer-view.type.js';
import type {City} from '../../types/index.js';

export interface OfferService {
  create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>>;

  findById(offerId: string, userId?: string): Promise<OfferDetails | null>;

  find(count?: number, userId?: string): Promise<OfferPreview[]>;

  updateById(offerId: string, dto: UpdateOfferDto, userId?: string): Promise<OfferDetails | null>;

  deleteById(offerId: string): Promise<DocumentType<OfferEntity> | null>;

  findPremium(city: City, userId?: string): Promise<OfferPreview[]>;

  findFavorites(userId: string): Promise<OfferPreview[]>;

  addToFavorites(offerId: string, userId: string): Promise<boolean>;

  removeFromFavorites(offerId: string, userId: string): Promise<boolean>;

  exists(offerId: string): Promise<boolean>;

  incCommentCount(offerId: string, rating: number): Promise<DocumentType<OfferEntity> | null>;

  resetCommentStats(offerId: string): Promise<DocumentType<OfferEntity> | null>;
}
