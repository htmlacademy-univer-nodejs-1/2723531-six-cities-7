import {inject, injectable} from 'inversify';
import chalk from 'chalk';
import type {CommandInterface} from './command.interface.js';
import {TSVFileReader} from '../../shared/libs/file-reader/index.js';
import {createOffer, getErrorMessage} from '../../shared/helpers/index.js';
import type {DatabaseClient} from '../../shared/libs/database-client/index.js';
import type {UserService} from '../../shared/modules/user/index.js';
import type {OfferService} from '../../shared/modules/offer/index.js';
import {Component} from '../../shared/types/index.js';

@injectable()
export class ImportCommand implements CommandInterface {
  constructor(
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.OfferService) private readonly offerService: OfferService,
  ) {}

  public getName(): string {
    return '--import';
  }

  private async onImportedLine(line: string, lineNumber: number, salt: string): Promise<void> {
    try {
      const offer = createOffer(line);
      const user = await this.userService.findOrCreate(offer.user, salt);

      await this.offerService.create({
        title: offer.title,
        description: offer.description,
        postDate: offer.postDate,
        city: offer.city,
        previewImage: offer.previewImage,
        images: offer.images,
        isPremium: offer.isPremium,
        type: offer.type,
        bedrooms: offer.bedrooms,
        maxAdults: offer.maxAdults,
        price: offer.price,
        amenities: offer.amenities,
        userId: user._id.toString(),
        location: offer.location,
      });
    } catch (error: unknown) {
      throw new Error(`Строка ${lineNumber}: ${getErrorMessage(error)}`);
    }
  }

  private onCompleteImport(count: number): void {
    console.info(chalk.green(`Импорт завершён. Предложений: ${count}.`));
  }

  public async execute(...parameters: string[]): Promise<void> {
    const [filename, uri, salt] = parameters;

    if (parameters.length !== 3 || !filename?.trim() || !uri?.trim() || !salt?.trim()) {
      console.error(chalk.red('Укажите аргументы: --import <path> <uri> <salt>.'));
      process.exitCode = 1;
      return;
    }

    if (!/^mongodb(?:\+srv)?:\/\//.test(uri.trim())) {
      console.error(chalk.red('Адрес базы данных должен начинаться с mongodb:// или mongodb+srv://.'));
      process.exitCode = 1;
      return;
    }

    const reader = new TSVFileReader(filename.trim());
    let connected = false;
    reader.on('line', (
      line: string,
      lineNumber: number,
      resolve: () => void,
      reject: (error: unknown) => void,
    ) => {
      this.onImportedLine(line, lineNumber, salt).then(resolve, reject);
    });
    reader.on('end', (count: number) => this.onCompleteImport(count));

    try {
      await this.databaseClient.connect(uri.trim());
      connected = true;
      await reader.read();
    } catch (error: unknown) {
      process.exitCode = 1;
      console.error(chalk.red(`Не удалось импортировать файл: ${filename.trim()}`));
      console.error(chalk.red(getErrorMessage(error)));
    } finally {
      reader.removeAllListeners();

      if (connected) {
        try {
          await this.databaseClient.disconnect();
        } catch (error: unknown) {
          process.exitCode = 1;
          console.error(chalk.red(`Не удалось закрыть соединение с MongoDB: ${getErrorMessage(error)}`));
        }
      }
    }
  }
}
