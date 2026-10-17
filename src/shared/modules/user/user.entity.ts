import {
  defaultClasses,
  getModelForClass,
  modelOptions,
  prop
} from '@typegoose/typegoose';
import {USER_TYPES} from '../../types/index.js';
import type {User, UserType} from '../../types/index.js';

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

  @prop({required: true})
  public password!: string;

  @prop({
    type: () => String,
    enum: USER_TYPES,
    required: true,
    default: 'regular',
  })
  public type!: UserType;
}

export const UserModel = getModelForClass(UserEntity);
