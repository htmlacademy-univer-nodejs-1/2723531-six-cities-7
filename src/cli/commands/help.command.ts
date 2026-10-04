import {CommandInterface} from './command.interface';
import chalk from 'chalk';

export class HelpCommand implements CommandInterface {
  public getName(): string {
    return '--help';
  }

  public async execute(..._parameters: string[]): Promise<void> {
    console.info(chalk.cyan(`
    Команды:
      --help                  показывает справку
      --version               выводит номер версии
      --import <path>          импортирует данные из TSV
    `));
  }
}
