import {
  defaultClasses,
  getModelForClass,
  modelOptions,
  prop
} from '@typegoose/typegoose';
import type {Ref} from '@typegoose/typegoose';
import {AMENITIES, CITIES, HOUSING_TYPES} from '../../types/index.js';
import type {Amenity, City, HousingType} from '../../types/index.js';
import {UserEntity} from '../user/index.js';

class OfferLocation {
  @prop({required: true})
  public latitude!: number;

  @prop({required: true})
  public longitude!: number;
}

@modelOptions({
  schemaOptions: {
    collection: 'offers',
  },
})
export class OfferEntity extends defaultClasses.TimeStamps {
  @prop({required: true})
  public title!: string;

  @prop({required: true})
  public description!: string;

  @prop({required: true})
  public postDate!: Date;

  @prop({type: () => String, enum: CITIES, required: true})
  public city!: City;

  @prop({required: true})
  public previewImage!: string;

  @prop({type: () => [String], required: true})
  public images!: string[];

  @prop({default: false})
  public isPremium!: boolean;

  @prop({default: false})
  public isFavorite!: boolean;

  @prop({required: true})
  public rating!: number;

  @prop({type: () => String, enum: HOUSING_TYPES, required: true})
  public type!: HousingType;

  @prop({required: true})
  public bedrooms!: number;

  @prop({required: true})
  public maxAdults!: number;

  @prop({required: true})
  public price!: number;

  @prop({type: () => [String], enum: AMENITIES, required: true})
  public amenities!: Amenity[];

  @prop({ref: () => UserEntity, required: true})
  public userId!: Ref<UserEntity>;

  @prop({default: 0})
  public commentCount!: number;

  @prop({type: () => OfferLocation, required: true, _id: false})
  public location!: OfferLocation;
}

export const OfferModel = getModelForClass(OfferEntity);
