import type {Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import {HttpError} from '../errors/http-error.js';

export function getUserId(res: Response): string | undefined {
  const userId: unknown = res.locals.userId;
  return typeof userId === 'string' ? userId : undefined;
}

export function requireUserId(res: Response): string {
  const userId = getUserId(res);

  if (!userId) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Необходима авторизация.');
  }

  return userId;
}
