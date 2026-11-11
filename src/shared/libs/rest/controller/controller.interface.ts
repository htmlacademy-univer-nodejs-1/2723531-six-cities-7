import type {Response, Router} from 'express';
import type {Route} from '../route.interface.js';

export interface Controller {
  readonly router: Router;

  addRoute(route: Route): void;

  send<T>(res: Response, statusCode: number, data: T): void;

  ok<T>(res: Response, data: T): void;

  created<T>(res: Response, data: T): void;

  noContent(res: Response): void;
}
