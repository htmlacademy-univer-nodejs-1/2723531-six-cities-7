export interface CommandInterface {
  getName(): string;
  execute(...parameters: string[]): void;
}
