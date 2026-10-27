import {
  defaultClasses,
  getModelForClass,
  modelOptions,
  prop
} from '@typegoose/typegoose';
import type {Ref} from '@typegoose/typegoose';
import {Types} from 'mongoose';
import {USER_TYPES} from '../../types/index.js';
import type {User, UserType} from '../../types/index.js';
import type {OfferEntity} from '../offer/offer.entity.js';

@modelOptions({
  schemaOptions: {
    collection: 'users',
  },
})
export class UserEntity extends defaultClasses.TimeStamps implements User {
  @prop({required: true})
  public name!: string;

  @prop({required: true, unique: true})
  public email!: string;

  @prop()
  public avatarPath?: string;

  @prop({required: true, select: false})
  public password!: string;

  @prop({
    type: () => String,
    enum: USER_TYPES,
    required: true,
    default: 'regular',
  })
  public type!: UserType;

  @prop({ref: 'OfferEntity', type: () => [Types.ObjectId], default: []})
  public favoriteOffers!: Ref<OfferEntity>[];
}

export const UserModel = getModelForClass(UserEntity);
