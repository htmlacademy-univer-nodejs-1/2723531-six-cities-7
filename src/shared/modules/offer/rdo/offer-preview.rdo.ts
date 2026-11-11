import {Expose} from 'class-transformer';
import type {City, HousingType} from '../../../types/index.js';

export class OfferPreviewRdo {
  @Expose()
  public id!: string;

  @Expose()
  public title!: string;

  @Expose()
  public price!: number;

  @Expose()
  public type!: HousingType;

  @Expose()
  public isFavorite!: boolean;

  @Expose()
  public postDate!: Date;

  @Expose()
  public city!: City;

  @Expose()
  public previewImage!: string;

  @Expose()
  public isPremium!: boolean;

  @Expose()
  public rating!: number;

  @Expose()
  public commentCount!: number;
}
