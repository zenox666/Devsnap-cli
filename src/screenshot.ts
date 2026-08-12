import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CliError, messageOf } from './utils.js';

export interface ShotOptions {
  url: string;
  file: string;
  width?: number;
  height?: number;
  timeout?: number;
}

export async function takeShot(options: ShotOptions): Promise<string> {
  const { url, file, width = 1280, height = 800, timeout = 15000 } = options;
  const chromium = await loadChromium();

  await fs.mkdir(path.dirname(file), { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    await page.screenshot({ path: file });
    return file;
  } catch (err) {
    throw new CliError(`Screenshot of ${url} failed: ${messageOf(err)}`);
  } finally {
    await browser.close();
  }
}

async function loadChromium() {
  try {
    const playwright = await import('playwright');
    return playwright.chromium;
  } catch {
    throw new CliError(
      'Playwright is not installed. Run "npm install playwright && npx playwright install chromium", or pass --no-screenshot.',
    );
  }
}
