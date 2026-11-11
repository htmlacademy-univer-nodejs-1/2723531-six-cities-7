import {Expose, Type} from 'class-transformer';
import type {Amenity} from '../../../types/index.js';
import {UserRdo} from '../../user/rdo/user.rdo.js';
import {OfferPreviewRdo} from './offer-preview.rdo.js';

class CoordinatesRdo {
  @Expose()
  public latitude!: number;

  @Expose()
  public longitude!: number;
}

export class OfferRdo extends OfferPreviewRdo {
  @Expose()
  public description!: string;

  @Expose()
  public images!: string[];

  @Expose()
  public bedrooms!: number;

  @Expose()
  public maxAdults!: number;

  @Expose()
  public amenities!: Amenity[];

  @Expose()
  @Type(() => UserRdo)
  public user!: UserRdo;

  @Expose()
  @Type(() => CoordinatesRdo)
  public location!: CoordinatesRdo;
}
