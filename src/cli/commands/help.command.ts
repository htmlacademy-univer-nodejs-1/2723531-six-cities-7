import type {CommandInterface} from './command.interface.js';
import chalk from 'chalk';

export class HelpCommand implements CommandInterface {
  public getName(): string {
    return '--help';
  }

  public async execute(..._parameters: string[]): Promise<void> {
    console.info(chalk.cyan(`
    Команды:
      --help                          показывает справку
      --version                       выводит номер версии
      --import <path> <uri> <salt>     импортирует данные из TSV в MongoDB
      --generate <n> <path> <url>       генерирует n предложений и сохраняет их в TSV
    `));
  }
}
