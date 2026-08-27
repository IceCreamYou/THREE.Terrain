# Agent Process

This file defines the process for changes in this repository.
It does not document library functions.
Read [llms.txt](llms.txt) for library usage and API information.

## Repository areas

- `src/` contains the library source.
- `demo/` contains the interactive terrain demo and its local assets.
- `scripts/` contains build, vendor, and screenshot tools.
- `vendor/` contains browser files required by static hosting.
- `dist/` contains generated library bundles.
- `README.md`, `llms.txt`, and `SKILL.md` contain documentation.

Do not hand-edit files in `dist/`.
Run `npm run build` to generate library bundles.

Treat files in `vendor/` as imported or generated files; do not change them manually.
Run `npm run vendor` after a dependency update.
Run `npm run build:eztree` after a change to the vendored eztree source.
Preserve the license files for all vendored dependencies.

Keep API descriptions and usage examples in `llms.txt` and the README.
Keep agent workflow instructions in this file.
Keep those three files up to date when relevant changes are made.

## Randomness

Use the seeded randomness utilities rather than `Math.random`.
Generate a random seed on each run if no seed is supplied.
Use an explicit seed when you need to reproduce a demo result.

## Demo changes

Start the demo with `npm start` for manual checks.
Use a URL with a seed when you compare terrain or decoration changes.
Use `scripts/capture-readme-screenshots.mjs` to update README images after substantial changes to the demo.
Do not add test controls, debug overlays, or test-only URL behavior to the shipped demo.

For visual changes, inspect the result at the camera positions that the change affects.
Check the result after a window resize.

Codex has a known bug where it fails to start Chrome in its sandbox. If this affects you, use Playwright instead.

## Validation

Run these commands after source, demo, or build changes:

```bash
npm run build
git diff --check
```

Run `npm run screenshots -- --output-dir /tmp/three-terrain-screenshots` after screenshot or camera changes.
Inspect every generated image before you replace a README image.

If you change static hosting files, run `npm run vendor` or `npm run build:eztree` as required.
Serve the repository with a static server and load the demo before you finish.
Check the browser console and network requests for errors.

## Documentation changes

Update documentation when behavior, settings, URLs, or the development process changes.
Keep process text short, direct, and specific.
