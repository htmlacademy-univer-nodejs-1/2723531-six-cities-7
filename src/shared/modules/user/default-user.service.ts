import {inject, injectable} from 'inversify';
import type {DocumentType, ReturnModelType} from '@typegoose/typegoose';
import {hashPassword} from '../../helpers/index.js';
import type {Logger} from '../../logger/index.js';
import {Component} from '../../types/index.js';
import type {CreateUserDto} from './dto/create-user.dto.js';
import type {UserEntity} from './user.entity.js';
import type {UserService} from './user-service.interface.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.UserModel) private readonly userModel: ReturnModelType<typeof UserEntity>,
  ) {}

  public async create(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>> {
    const password = await hashPassword(dto.password, salt);
    const user = await this.userModel.create({...dto, password});
    this.logger.info('Создан новый пользователь.');

    return user;
  }

  public async findById(userId: string): Promise<DocumentType<UserEntity> | null> {
    return this.userModel.findById(userId).exec();
  }

  public async findByEmail(email: string): Promise<DocumentType<UserEntity> | null> {
    return this.userModel.findOne({email}).exec();
  }
}
