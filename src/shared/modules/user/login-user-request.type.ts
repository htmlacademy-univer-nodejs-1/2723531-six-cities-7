import type {Request} from 'express';
import type {LoginUserDto} from './dto/login-user.dto.js';

export type LoginUserRequest = Request<Request['params'], unknown, LoginUserDto>;
