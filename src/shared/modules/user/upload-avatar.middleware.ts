import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import type {NextFunction, Request, Response} from 'express';
import {StatusCodes} from 'http-status-codes';
import mimeTypes from 'mime-types';
import multer from 'multer';
import {nanoid} from 'nanoid';
import {HttpError} from '../../libs/rest/index.js';
import type {Middleware} from '../../libs/rest/index.js';
import type {Logger} from '../../logger/index.js';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export class UploadAvatarMiddleware implements Middleware {
  private readonly upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: MAX_AVATAR_BYTES, files: 1, fields: 0},
  }).single('avatar');

  constructor(
    private readonly directory: string,
    private readonly logger: Logger,
  ) {}

  public async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.is('multipart/form-data')) {
      throw new HttpError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, 'Отправьте аватар в формате multipart/form-data.');
    }

    await this.parseFile(req, res);
    const file = req.file;
    const extension = file && this.getExtension(file);

    if (!file || !extension) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Загрузите изображение в формате JPG или PNG.');
    }

    await mkdir(this.directory, {recursive: true});
    const stagedDirectory = await mkdtemp(join(this.directory, '.avatar-'));
    const filename = `${nanoid()}.${extension}`;
    const stagedFile = join(stagedDirectory, filename);

    try {
      await writeFile(stagedFile, new Uint8Array(file.buffer));
    } catch (error: unknown) {
      await this.removeStagedDirectory(stagedDirectory);
      throw error;
    }

    if (res.destroyed) {
      await this.removeStagedDirectory(stagedDirectory);
      return;
    }

    res.once('close', () => {
      void this.removeStagedDirectory(stagedDirectory);
    });
    file.path = stagedFile;
    file.filename = filename;
    next();
  }

  private parseFile(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      this.upload(req, res, (error: unknown) => {
        if (error) {
          const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
            ? 'Размер аватара не должен превышать 2 МиБ.'
            : 'Отправьте один файл в поле avatar.';
          reject(new HttpError(StatusCodes.BAD_REQUEST, message));
          return;
        }

        resolve();
      });
    });
  }

  private getExtension(file: Express.Multer.File): string | undefined {
    const originalExtension = extname(file.originalname).toLowerCase();
    const extension = mimeTypes.extension(file.mimetype);

    if (file.mimetype === 'image/jpeg' && originalExtension === '.jpg' &&
      file.buffer.subarray(0, 3).toString('hex') === 'ffd8ff') {
      return extension === 'jpeg' || extension === 'jpg' ? 'jpg' : undefined;
    }

    if (extension === 'png' && file.mimetype === 'image/png' && originalExtension === '.png' &&
      file.buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      return extension;
    }

    return undefined;
  }

  private async removeStagedDirectory(directory: string): Promise<void> {
    try {
      await rm(directory, {recursive: true, force: true});
    } catch {
      this.logger.warn('Не удалось удалить временный файл аватара.');
    }
  }
}
