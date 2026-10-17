import type {DocumentType} from '@typegoose/typegoose';
import type {CreateUserDto} from './dto/create-user.dto.js';
import type {UserEntity} from './user.entity.js';

export interface UserService {
  create(dto: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>>;

  findById(userId: string): Promise<DocumentType<UserEntity> | null>;

  findByEmail(email: string): Promise<DocumentType<UserEntity> | null>;
}
