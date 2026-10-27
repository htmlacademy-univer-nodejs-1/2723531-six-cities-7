import {defaultClasses, getModelForClass, modelOptions, prop} from '@typegoose/typegoose';
import type {Ref} from '@typegoose/typegoose';
import {Types} from 'mongoose';
import type {OfferEntity} from '../offer/offer.entity.js';
import type {UserEntity} from '../user/user.entity.js';

@modelOptions({
  schemaOptions: {
    collection: 'comments',
  },
})
export class CommentEntity extends defaultClasses.TimeStamps {
  @prop({required: true})
  public text!: string;

  @prop({required: true, default: Date.now})
  public postDate!: Date;

  @prop({required: true})
  public rating!: number;

  @prop({ref: 'OfferEntity', type: () => Types.ObjectId, required: true})
  public offerId!: Ref<OfferEntity>;

  @prop({ref: 'UserEntity', type: () => Types.ObjectId, required: true})
  public userId!: Ref<UserEntity>;
}

export const CommentModel = getModelForClass(CommentEntity);
