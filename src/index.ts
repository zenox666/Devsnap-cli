#!/usr/bin/env node
import path from 'node:path';
import { detectStack } from './detect.js';
import { renderReadme } from './readme.js';
import { takeShot } from './screenshot.js';
import { CliError, assertDirectory, exists, messageOf, writeText } from './utils.js';

const DEFAULT_URL = 'http://localhost:3000';
const SHOTS_DIR = path.join('docs', 'shots');

interface Options {
  dir: string;
  out?: string;
  url?: string;
  wantsShot: boolean;
  force: boolean;
  help: boolean;
}

const HELP = `devsnap - scan a project and write a README

Usage
  devsnap [directory] [options]

Options
  --url <url>       screenshot this url (default ${DEFAULT_URL})
  --screenshot      screenshot ${DEFAULT_URL}
  --no-screenshot   skip the screenshot, even if --url is set
  --out <file>      readme path (default <directory>/README.md)
  --force           overwrite an existing readme
  -h, --help        show this message
`;

export function parseArgs(argv: string[]): Options {
  const options: Options = { dir: '.', wantsShot: false, force: false, help: false };
  let sawNoShot = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--screenshot':
        options.wantsShot = true;
        break;
      case '--no-screenshot':
        sawNoShot = true;
        break;
      case '--url':
        options.url = takeValue(argv, ++i, '--url');
        options.wantsShot = true;
        break;
      case '--out':
        options.out = takeValue(argv, ++i, '--out');
        break;
      default:
        if (arg.startsWith('-')) throw new CliError(`Unknown option: ${arg}`);
        options.dir = arg;
    }
  }

  if (sawNoShot) {
    options.wantsShot = false;
  }
  return options;
}

function takeValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('-')) throw new CliError(`${flag} needs a value`);
  return value;
}

async function main(): Promise<number> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return 0;
  }

  const root = path.resolve(options.dir);
  await assertDirectory(root);

  const target = options.out ? path.resolve(options.out) : path.join(root, 'README.md');
  if (!options.force && (await exists(target))) {
    throw new CliError(`${target} already exists. Use --force to overwrite.`);
  }

  const stack = await detectStack(root);
  console.log(`${stack.name}: ${stack.frameworks.join(', ') || 'no frameworks detected'}`);

  let shotPath: string | undefined;
  let shotFailed = false;

  if (options.wantsShot) {
    const url = options.url ?? DEFAULT_URL;
    const file = path.join(root, SHOTS_DIR, 'home.png');
    try {
      await takeShot({ url, file });
      shotPath = toPosix(path.relative(path.dirname(target), file));
      console.log(`saved ${path.relative(root, file)}`);
    } catch (err) {
      shotFailed = true;
      console.error(`warning: ${messageOf(err)}`);
    }
  }

  await writeText(target, renderReadme(stack, { screenshot: shotPath }));
  console.log(`wrote ${path.relative(process.cwd(), target) || target}`);

  return shotFailed ? 1 : 0;
}

function toPosix(file: string): string {
  return file.split(path.sep).join('/');
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    console.error(err instanceof CliError ? err.message : messageOf(err));
    process.exitCode = 1;
  });
