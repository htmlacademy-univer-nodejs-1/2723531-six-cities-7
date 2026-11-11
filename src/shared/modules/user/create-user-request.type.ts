import type {Request} from 'express';
import type {CreateUserDto} from './dto/create-user.dto.js';

export type CreateUserRequest = Request<Request['params'], unknown, CreateUserDto>;
