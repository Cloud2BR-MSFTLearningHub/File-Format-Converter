# File Format Converter

Atlanta, USA

![GitHub](https://img.shields.io/badge/--181717?logo=github&logoColor=ffffff)  
[Cloud2BR OSS - Learning Hub](https://github.com/Cloud2BR-MSFTLearningHub)

Last updated: 2026-06-10

---

> A free, private, **in-browser** file format converter deployed to GitHub Pages. Upload a file, pick a target format, click convert, and download the result. Every conversion runs locally in your browser — files are never uploaded to a server.

## Live app

The project is deployed to GitHub Pages from the `gh-pages` branch, with two environments driven by the `main` and `test` branches:

| Branch | Environment | Description                                                 | URL                                                                                                                                              |
| ------ | ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main` | Production  | Stable release served at the site root.                     | [https://Cloud2BR-MSFTLearningHub.github.io/File-Format-Converter/](https://Cloud2BR-MSFTLearningHub.github.io/File-Format-Converter/)           |
| `test` | Staging     | Preview of in-progress work served under the `/test/` path. | [https://Cloud2BR-MSFTLearningHub.github.io/File-Format-Converter/test/](https://Cloud2BR-MSFTLearningHub.github.io/File-Format-Converter/test/) |

> Enable Pages once (Settings → Pages → Source: **Deploy from a branch**, Branch: `**gh-pages**`, Folder: **/ (root)**). Pushing to `main` updates the root site; pushing to `test` updates the `/test/` site. Each deploy keeps the other environment intact.

## Supported conversions

| From           | To                                                   |
| -------------- | ---------------------------------------------------- |
| Markdown       | HTML, PDF, Word (`.docx`), PowerPoint (`.pptx`)      |
| Word (`.docx`) | HTML, Markdown, PDF                                  |
| PDF            | Images (per page + ZIP of all pages), extracted text |
| HTML           | Markdown, PDF                                        |
| Plain text     | Markdown, HTML, PDF, PowerPoint                      |
| CSV            | JSON                                                 |
| JSON           | CSV                                                  |

> PDF → images renders each page to PNG. You can preview and save pages individually, and also download a ZIP containing every page.

## How it works

The app is a single-page **React + TypeScript** project built with **Vite**. A small conversion engine (`src/converters/`) maps each input format to its available targets and runs the matching browser library:

- `marked` — Markdown → HTML
- `mammoth` — Word → HTML
- `turndown` — HTML → Markdown
- `docx` — Markdown/text → Word
- `pdfjs-dist` — PDF rendering and text extraction
- `pptxgenjs` — slides from headings
- `papaparse` — CSV ↔ JSON
- `html2pdf.js` — HTML → PDF
- `jszip` / `file-saver` — packaging and downloads

## Local development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and produce the production bundle in dist/
npm run preview  # serve the built bundle locally
```

## Deployment

`.github/workflows/deploy-pages.yml` builds the app and publishes it to the  
`gh-pages` branch on every push:

- Push to `**main**` → built with base `/File-Format-Converter/` → published to the root of `gh-pages` → served at `/`.
- Push to `**test**` → built with base `/File-Format-Converter/test/` → published to the `test/` folder of `gh-pages` → served at `/test/`.

The workflow uses `keep_files: true`, so deploying one branch never removes the  
other environment. Make sure the repository's Pages source is set to the  
`gh-pages` branch (root folder).

## Repository automation

This repo keeps the organization's standard pipelines:

| Workflow                                          | Trigger                                 | What it does                                                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deploy-pages.yml`              | Push to `main` / `test` and manual runs | Builds the Vite app and deploys it to the `gh-pages` branch — `main` to the root site, `test` to the `/test/` staging path.                                                           |
| `.github/workflows/validate_and_fix_markdown.yml` | Pull requests to `main`                 | Runs `markdownlint`, auto-fixes Markdown style issues when possible, validates the required header block for every tracked Markdown file, and pushes any fixes back to the PR branch. |
| `.github/workflows/update-md-date.yml`            | Pull requests to `main`                 | Looks at the full PR diff, updates the `Last updated:` line inside the standard Markdown header block for changed Markdown files, and pushes the result back to the PR branch.        |
| `.github/workflows/validate_and_fix_notebook.yml` | Pull requests to `main`                 | Validates Jupyter notebooks, normalizes widget metadata when needed, and commits notebook-format fixes back to the PR branch.                                                         |
| `.github/workflows/use-visitor-counter.yml`       | Pull requests to `main` and manual runs | Runs the vendored visitor-counter script stored in this repo to refresh Markdown counter badges and `metrics.json`, then commits the updated repository traffic data.                 |

![Total views](https://img.shields.io/badge/Total%20views-40-limegreen)

Refresh Date: 2026-04-07
