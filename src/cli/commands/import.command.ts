import { CommandInterface } from './command.interface.js';
import { TSVFileReader } from '../../shared/libs/file-reader/index.js';
import chalk from 'chalk';

export class ImportCommand implements CommandInterface {
  public getName(): string {
    return '--import';
  }

  public execute(...parameters: string[]): void {
    const [filename] = parameters;

    if (!filename?.trim()) {
      console.log(chalk.red('Укажите путь к TSV-файлу: --import <path>.'));
      process.exitCode = 1;
      return;
    }

    const fileReader = new TSVFileReader(filename.trim());

    try {
      fileReader.read();
      console.log(chalk.yellow(fileReader.toArray()));
    } catch (err) {

      if (!(err instanceof Error)) {
        throw err;
      }
      process.exitCode = 1;
      console.log(chalk.red(`Can't import data from file: ${filename}`));
      console.log(chalk.red(`Details: ${err.message}`));
    }
  }
}
