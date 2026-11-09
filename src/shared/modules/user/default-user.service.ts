import {inject, injectable} from 'inversify';
import type {DocumentType, ReturnModelType} from '@typegoose/typegoose';
import {hashPassword, verifyPassword} from '../../helpers/index.js';
import type {Logger} from '../../logger/index.js';
import {Component} from '../../types/index.js';
import type {CreateUserDto} from './dto/create-user.dto.js';
import type {UserEntity} from './user.entity.js';
import type {UserService} from './user-service.interface.js';
import type {UpdateUserDto} from './dto/update-user.dto.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.UserModel) private readonly userModel: ReturnModelType<typeof UserEntity>,
  ) {}

  public async create(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>> {
    const password = await hashPassword(dto.password, salt);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      avatarPath: dto.avatarPath,
      type: dto.type,
      password,
    });
    this.logger.info(`Создан новый пользователь: userId=${user._id.toString()}.`);

    return user;
  }

  public async findById(userId: string): Promise<DocumentType<UserEntity> | null> {
    return this.userModel.findById(userId).exec();
  }

  public async findByEmail(email: string): Promise<DocumentType<UserEntity> | null> {
    return this.userModel.findOne({email}).exec();
  }

  public async findOrCreate(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>> {
    const user = await this.findByEmail(dto.email);
    return user ?? this.create(dto, salt);
  }

  public async updateById(userId: string, dto: UpdateUserDto): Promise<DocumentType<UserEntity> | null> {
    const update: UpdateUserDto = {};

    if (dto.name !== undefined) {
      update.name = dto.name;
    }

    if (dto.avatarPath !== undefined) {
      update.avatarPath = dto.avatarPath;
    }

    const user = await this.userModel.findByIdAndUpdate(userId, {$set: update}, {returnDocument: 'after'}).exec();

    if (user) {
      this.logger.info(`Пользователь обновлён: userId=${user._id.toString()}.`);
    }

    return user;
  }

  public async verifyUser(email: string, password: string, salt: string): Promise<DocumentType<UserEntity> | null> {
    const user = await this.userModel.findOne({email}).select('+password').exec();

    if (!user || !await verifyPassword(password, salt, user.password)) {
      return null;
    }

    return this.findById(user._id.toString());
  }
}
