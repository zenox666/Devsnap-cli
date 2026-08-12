# devsnap-cli

A small command line tool that looks at a project folder and writes a README for it. If the app is
running locally it can also grab a screenshot and link it from the README.

I built this because I kept starting side projects, pushing them to GitHub, and leaving the README
empty for weeks. This gets a usable first draft in one command.

## What it does

- reads `package.json`, `tsconfig.json`, `requirements.txt` and `pyproject.toml`
- picks up React, Vite, Next.js, Express, Vue, Svelte, Tailwind, Django, Flask and FastAPI
- guesses the package manager from the lockfile
- writes Setup / Run / Build sections from the scripts that actually exist
- optionally screenshots a running dev server into `docs/shots/`

It will not overwrite an existing README unless you pass `--force`.

## Install

```bash
npm install
npm run build
npm link
```

`npm link` is optional. Without it, run the built file directly with `node dist/index.js`.

## Usage

```bash
devsnap                          # scan the current folder
devsnap ../my-app                # scan somewhere else
devsnap --url http://localhost:5173
devsnap --screenshot --force
devsnap --no-screenshot          # useful when a script always passes --url
```

| Option            | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `--url <url>`     | screenshot this url, implies `--screenshot`            |
| `--screenshot`    | screenshot `http://localhost:3000`                     |
| `--no-screenshot` | skip the screenshot, wins over the two flags above     |
| `--out <file>`    | write somewhere other than `<directory>/README.md`     |
| `--force`         | overwrite an existing README                           |
| `-h, --help`      | show usage                                             |

## Screenshots

Playwright is an optional dependency and it is only imported when you actually ask for a
screenshot, so the rest of the tool works without it. The browser binary is a separate download:

```bash
npx playwright install chromium
```

If launching still complains that the executable is missing, run `npx playwright install` without
the browser name. Some versions keep the headless build in a separate download.

Start your dev server first, then run devsnap with `--url`. If the page never loads, devsnap prints
a warning, still writes the README, and exits with code 1 so a script can notice.

## Notes

Generated files are a starting point, not the finished thing. Read the output before committing it.

## License

MIT
