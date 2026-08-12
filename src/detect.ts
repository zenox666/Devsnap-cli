import path from 'node:path';
import { exists, readJson, readText } from './utils.js';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export interface Stack {
  name: string;
  root: string;
  language: 'typescript' | 'javascript' | 'python' | 'unknown';
  frameworks: string[];
  packageManager: PackageManager;
  scripts: Record<string, string>;
}

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const NODE_FRAMEWORKS: Array<[dependency: string, label: string]> = [
  ['next', 'Next.js'],
  ['react', 'React'],
  ['vite', 'Vite'],
  ['express', 'Express'],
  ['vue', 'Vue'],
  ['svelte', 'Svelte'],
  ['tailwindcss', 'Tailwind CSS'],
];

const PYTHON_FRAMEWORKS: Array<[needle: string, label: string]> = [
  ['django', 'Django'],
  ['flask', 'Flask'],
  ['fastapi', 'FastAPI'],
];

export async function detectStack(root: string): Promise<Stack> {
  const pkg = await readJson<PackageJson>(path.join(root, 'package.json'));
  const frameworks: string[] = [];

  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [dependency, label] of NODE_FRAMEWORKS) {
      if (deps[dependency]) frameworks.push(label);
    }
  }

  const python = await findPython(root);
  frameworks.push(...python.frameworks);

  return {
    name: pkg?.name || path.basename(path.resolve(root)),
    root,
    language: await guessLanguage(root, pkg, python.found),
    frameworks,
    packageManager: await guessPackageManager(root),
    scripts: pkg?.scripts ?? {},
  };
}

async function findPython(root: string): Promise<{ found: boolean; frameworks: string[] }> {
  const requirements = await readText(path.join(root, 'requirements.txt'));
  const pyproject = await readText(path.join(root, 'pyproject.toml'));
  const found = requirements !== null || pyproject !== null;

  if (!found) return { found: false, frameworks: [] };

  const manifest = `${requirements ?? ''}\n${pyproject ?? ''}`.toLowerCase();
  const frameworks = ['Python'];
  for (const [needle, label] of PYTHON_FRAMEWORKS) {
    if (manifest.includes(needle)) frameworks.push(label);
  }
  return { found, frameworks };
}

async function guessLanguage(
  root: string,
  pkg: PackageJson | null,
  hasPython: boolean,
): Promise<Stack['language']> {
  if (await exists(path.join(root, 'tsconfig.json'))) return 'typescript';
  if (pkg) return 'javascript';
  if (hasPython) return 'python';
  return 'unknown';
}

async function guessPackageManager(root: string): Promise<PackageManager> {
  if (await exists(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await exists(path.join(root, 'yarn.lock'))) return 'yarn';
  return 'npm';
}
