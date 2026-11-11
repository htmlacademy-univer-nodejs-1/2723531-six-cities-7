import type {Request} from 'express';
import type {CreateOfferDto} from './dto/create-offer.dto.js';

export type CreateOfferRequest = Request<Request['params'], unknown, Omit<CreateOfferDto, 'userId'>>;
