import type {Request} from 'express';
import type {UpdateOfferDto} from './dto/update-offer.dto.js';

export type UpdateOfferRequest = Request<Request['params'], unknown, UpdateOfferDto>;
