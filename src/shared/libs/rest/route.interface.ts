import type {NextFunction, Request, Response} from 'express';
import type {HttpMethod} from '../../types/http-method.enum.js';
export interface Route {
  path: string;
  method: HttpMethod;
  handler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;
}
