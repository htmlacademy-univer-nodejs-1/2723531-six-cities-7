import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import type {NextFunction, Request, Response} from 'express';
import type {Logger} from '../../../logger/index.js';
import {Component} from '../../../types/index.js';
import {createErrorObject} from '../../../helpers/index.js';
import {HttpError} from '../errors/http-error.js';
import type {ExceptionFilter} from './exception-filter.interface.js';

@injectable()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
  ) {}

  public catch(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed') {
      this.logger.warn(`Некорректный JSON: method=${req.method}, status=400.`);
      res.status(StatusCodes.BAD_REQUEST).json(createErrorObject('Некорректный JSON в теле запроса.'));
      return;
    }

    if (error instanceof HttpError) {
      this.logger.warn(
        `HTTP-ошибка: method=${req.method}, status=${error.httpStatusCode}.`,
      );

      res
        .status(error.httpStatusCode)
        .json(createErrorObject(error.message));

      return;
    }

    this.logger.error(
      `Ошибка сервера при обработке запроса: method=${req.method}.`,
      {
        name: error.name,
        message: 'Внутренняя ошибка сервера.',
      },
    );

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(createErrorObject('Внутренняя ошибка сервера.'));
  }
}
