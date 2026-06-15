# MD2DOC-Evolution | v1.4.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/eric861129/MD2DOC-Evolution)
[![CI](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml/badge.svg)](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml)

[中文](README.md) | [English](README_EN.md)

![Feature demo](docs/images/MD2DOC-角色對話-GIF.gif)

MD2DOC-Evolution is an open-source Markdown-to-Word DOCX manuscript workspace for technical book authors, engineers, and professional content creators. It keeps the writing flow close to Markdown while producing Word manuscripts suitable for review, publishing, and handoff.

Live demo: [https://huangchiyu.com/MD2DOC-Evolution/](https://huangchiyu.com/MD2DOC-Evolution/)

## v1.4.0 Highlights

- Professional workspace UI: compact command bar, Markdown quick-action rail, editor, and Word print preview.
- More stable build stack: Tailwind through the Vite plugin, npm Buffer polyfill, and packaged GSAP dependencies.
- Shared command model: the quick-action rail and slash commands now use the same command definitions.
- Registry-style preview renderer: preview rendering now follows the same extension direction as the DOCX builder.
- AI Agent Prompt: the header prompt includes the GitHub repo so external AI agents can follow the project format more reliably.
- Export readiness signals: word count, block count, Frontmatter status, and DOCX readiness are visible before export.
- Mobile editor/preview tabs: the mobile layout avoids squeezed split panes.

## Supported Syntax

| Feature | Syntax | Notes |
| :--- | :--- | :--- |
| Frontmatter | `---` YAML block | Supports `title`, `author`, `header`, `footer`, and other metadata |
| Table of contents | `[TOC]` | Creates a Word-style TOC block |
| Headings | `#` to `###` | Maps to H1 through H3 |
| Code blocks | <code>```ts:ln</code> / <code>```json:no-ln</code> | Supports language labels and line-number flags |
| Mermaid | <code>```mermaid</code> | Supported in preview and DOCX export |
| Callouts | `> [!NOTE]` / `> [!TIP]` / `> [!WARNING]` | Note, tip, and warning blocks |
| Dialogue | `User "::` / `AI ::"` / `System :":` | Left, right, and centered dialogue bubbles |
| Tables | Markdown table | Exported as Word tables |
| Images | `![alt](image-id-or-url)` | Supports dropped images and Markdown image syntax |
| Links | `[text](url)` | Can export with QR Code support |

## AI Assisted Generation

To convert existing notes, transcripts, or drafts into MD2DOC-Evolution format, click the AI Prompt button in the header and paste the prompt into ChatGPT, Claude, or another AI agent.

The built-in prompt includes:

- GitHub repo reference: `https://github.com/eric861129/MD2DOC-Evolution`
- Required formatting for Frontmatter, TOC, headings, code blocks, callouts, tables, and dialogue
- An output contract that asks the agent to return only the converted Markdown manuscript
- A silent quality check before the agent answers

See the full rules in [AI Generation Guide](docs/AI_GENERATION_GUIDE.md).

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md): design philosophy and core features.
- [AI Generation Guide](docs/AI_GENERATION_GUIDE.md): conversion rules for users and AI agents.
- [Architecture](docs/ARCHITECTURE.md): tech stack, directory structure, and core workflows.
- [Development Guide](docs/DEVELOPMENT_GUIDE.md): local setup, testing, and debugging.
- [Customization](CUSTOMIZATION.md): layout, styling, and export customization.

## Sample Output

Sample Word document:

- [Download sample DOCX](samples/範例Word.docx)

<div align="center">
  <img src="docs/images/1.jpg" width="48%" alt="Cover and header" />
  <img src="docs/images/2.jpg" width="48%" alt="Chat dialogues" />
  <br/>
  <img src="docs/images/3.jpg" width="48%" alt="Callouts and styles" />
  <img src="docs/images/4.jpg" width="48%" alt="Code blocks" />
  <br/>
  <img src="docs/images/5.jpg" width="48%" alt="Tables and lists" />
  <img src="docs/images/6.jpg" width="48%" alt="Tables and lists" />
</div>

## Getting Started

### Requirements

- Node.js 20+
- npm

### Local Development

```bash
git clone https://github.com/eric861129/MD2DOC-Evolution.git
cd MD2DOC-Evolution
npm install
npm run dev
```

Local dev URL:

```text
http://localhost:3000/MD2DOC-Evolution/
```

## Verification

```bash
npm run typecheck
npm run test:run
npm run build
npm run verify
```

`npm run verify` runs type checking, unit/component tests, and the production build. GitHub Actions uses the same verification flow.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS via `@tailwindcss/vite`
- docx
- Mermaid
- Vitest + Testing Library

## Contributing

Issues, suggestions, and pull requests are welcome. The repository currently keeps the branch flow rules:

- `main` accepts `dev` or `hotfix/*`
- `dev` accepts `dev_feature_*`, `dev_refactor_*`, `dev_hotfix_*`, or `hotfix/*`

Before opening a PR, run:

```bash
npm run verify
```

## License

MIT License. See [LICENSE](LICENSE) for details.
