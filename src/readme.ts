import type { PackageManager, Stack } from './detect.js';

export interface ReadmeOptions {
  screenshot?: string;
}

export function renderReadme(stack: Stack, options: ReadmeOptions = {}): string {
  const blocks = [
    `# ${stack.name}`,
    techStack(stack),
    section('Setup', codeBlock(setupCommands(stack))),
    section('Run', codeBlock(runCommands(stack))),
    section('Build', codeBlock(buildCommands(stack))),
  ];

  if (options.screenshot) {
    blocks.push(section('Screenshot', `![${stack.name}](${options.screenshot})`));
  }

  return `${blocks.join('\n\n')}\n`;
}

function techStack(stack: Stack): string {
  const items = [...new Set([languageLabel(stack.language), ...stack.frameworks])].filter(Boolean);
  if (items.length === 0) {
    return section('Tech stack', '_Nothing detected. Fill this in._');
  }
  return section('Tech stack', items.map((item) => `- ${item}`).join('\n'));
}

function setupCommands(stack: Stack): string[] {
  if (stack.language === 'python') {
    return ['python -m venv .venv', 'pip install -r requirements.txt'];
  }
  return [`${stack.packageManager} install`];
}

function runCommands(stack: Stack): string[] {
  if (stack.language === 'python') {
    return ['python main.py'];
  }

  const script = firstScript(stack, ['dev', 'start', 'serve']);
  return [script ? runScript(stack.packageManager, script) : 'node index.js'];
}

function buildCommands(stack: Stack): string[] {
  if (stack.language === 'python') {
    return ['# no build step'];
  }

  const script = firstScript(stack, ['build', 'compile']);
  return [script ? runScript(stack.packageManager, script) : '# no build script in package.json'];
}

function firstScript(stack: Stack, candidates: string[]): string | undefined {
  return candidates.find((name) => Boolean(stack.scripts[name]));
}

function runScript(manager: PackageManager, script: string): string {
  return manager === 'npm' ? `npm run ${script}` : `${manager} ${script}`;
}

function languageLabel(language: Stack['language']): string {
  switch (language) {
    case 'typescript':
      return 'TypeScript';
    case 'javascript':
      return 'JavaScript';
    case 'python':
      return 'Python';
    default:
      return '';
  }
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}`;
}

function codeBlock(lines: string[]): string {
  return ['```bash', ...lines, '```'].join('\n');
}
