import type {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import type {DocumentExists} from '../../../types/index.js';
import {HttpError} from '../errors/http-error.js';
import type {Middleware} from './middleware.interface.js';

export class DocumentExistsMiddleware implements Middleware {
  constructor(
    private readonly service: DocumentExists,
    private readonly field: string,
    private readonly message: string,
    private readonly source: 'params' | 'query' | 'body' = 'params',
  ) {}

  public async execute(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const id: unknown = req[this.source]?.[this.field];

    if (typeof id !== 'string') {
      throw new HttpError(StatusCodes.BAD_REQUEST, `Некорректный идентификатор в поле ${this.field}.`);
    }

    if (!await this.service.exists(id)) {
      throw new HttpError(StatusCodes.NOT_FOUND, this.message);
    }

    next();
  }
}
