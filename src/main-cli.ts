#!/usr/bin/env node
import 'reflect-metadata';
import { CLIApplication, GenerateCommand, HelpCommand, ImportCommand, VersionCommand } from './cli/index.js';
import {createContainer} from './shared/container.js';

async function bootstrap(): Promise<void> {
  const container = createContainer();
  container.bind(ImportCommand).toSelf();
  const cliApplication = new CLIApplication();
  cliApplication.registerCommand([
    new HelpCommand(),
    new VersionCommand(),
    container.get(ImportCommand),
    new GenerateCommand()
  ]);

  await cliApplication.provideCommand(process.argv);
}

await bootstrap();
