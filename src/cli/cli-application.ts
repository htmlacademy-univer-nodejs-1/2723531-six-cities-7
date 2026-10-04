import {CommandInterface} from './commands/command.interface';
import {CommandParser} from './command-parser.js';
export * from './commands/import.command.js';

type CommandCollection = Record<string, CommandInterface>

export class CLIApplication {
  private commands: CommandCollection = {};
  constructor(private readonly defaultCommand: string = '--help') {}

  public registerCommand(commandList: CommandInterface[]): void {
    commandList.forEach((command) => {
      if (Object.hasOwn(this.commands, command.getName())) {
        throw new Error(`Command ${command.getName()} is already registered`);
      }
      this.commands[command.getName()] = command;
    });
  }

  public getCommand(commandName: string) : CommandInterface{
    return this.commands[commandName] ?? this.getDefaultCommand();
  }

  public provideCommand(argv: string[]): void {
    const parsedCommand = CommandParser.parse(argv);
    const [commandName] = Object.keys(parsedCommand);
    const command = this.getCommand(commandName);
    const commandArguments = parsedCommand[commandName] ?? [];
    command.execute(...commandArguments);
  }

  public getDefaultCommand(): CommandInterface | never {
    if (! this.commands[this.defaultCommand]) {
      throw new Error(`The default command (${this.defaultCommand}) is not registered.`);
    }
    return this.commands[this.defaultCommand];
  }
}
