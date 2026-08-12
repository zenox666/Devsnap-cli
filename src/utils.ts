import { promises as fs } from 'node:fs';
import path from 'node:path';

export class CliError extends Error {}

export async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if (isMissing(err)) return null;
    throw new CliError(`Cannot read ${file}: ${messageOf(err)}`);
  }
}

export async function readJson<T>(file: string): Promise<T | null> {
  const raw = await readText(file);
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new CliError(`${path.basename(file)} is not valid JSON: ${messageOf(err)}`);
  }
}

export async function writeText(file: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents, 'utf8');
}

export async function assertDirectory(dir: string): Promise<void> {
  let stat;
  try {
    stat = await fs.stat(dir);
  } catch {
    throw new CliError(`No such directory: ${dir}`);
  }
  if (!stat.isDirectory()) {
    throw new CliError(`${dir} is not a directory`);
  }
}

export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isMissing(err: unknown): boolean {
  return (err as NodeJS.ErrnoException)?.code === 'ENOENT';
}
