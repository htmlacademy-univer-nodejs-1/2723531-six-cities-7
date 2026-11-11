import {injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import {Router} from 'express';
import type {Response} from 'express';
import asyncHandler from 'express-async-handler';
import type {Logger} from '../../../logger/index.js';
import type {Route} from '../route.interface.js';
import type {Controller} from './controller.interface.js';

const DEFAULT_CONTENT_TYPE = 'application/json';

@injectable()
export abstract class BaseController implements Controller {
  private readonly _router: Router;

  constructor(
    protected readonly logger: Logger,
  ) {
    this._router = Router();
  }

  public get router(): Router {
    return this._router;
  }

  public addRoute(route: Route): void {
    const wrappedHandler = asyncHandler(route.handler.bind(this));

    this._router[route.method](route.path, wrappedHandler);

    this.logger.info(
      `Маршрут зарегистрирован: ${route.method.toUpperCase()} ${route.path}`,
    );
  }

  public send<T>(res: Response, statusCode: number, data: T): void {
    res
      .type(DEFAULT_CONTENT_TYPE)
      .status(statusCode)
      .json(data);
  }

  public ok<T>(res: Response, data: T): void {
    this.send(res, StatusCodes.OK, data);
  }

  public created<T>(res: Response, data: T): void {
    this.send(res, StatusCodes.CREATED, data);
  }

  public noContent(res: Response): void {
    res.status(StatusCodes.NO_CONTENT).send();
  }
}
