# MD2DOC-Evolution | v1.5.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/eric861129/MD2DOC-Evolution)
[![CI](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml/badge.svg)](https://github.com/eric861129/MD2DOC-Evolution/actions/workflows/ci.yml)

[中文](README.md) | [English](README_EN.md)

MD2DOC-Evolution is an open-source Markdown-to-Word DOCX publishing workspace for technical authors, engineers, and content teams. It keeps the writing workflow close to Markdown while producing Word manuscripts suitable for editorial review, publisher handoff, and final production.

Live demo: [https://huangchiyu.com/MD2DOC-Evolution/](https://huangchiyu.com/MD2DOC-Evolution/)

> The right side of the professional workspace UI is a continuous white document preview. It validates structure and design language; it does not pretend to reproduce final Word pagination.

## v1.5.0 Highlights

- Publishing layouts: 17.6 × 23.6 cm, A4, A5, B5, custom paper, and custom margins.
- Margin presets: 1.27, 1.50, 2.00, 2.54 cm, publisher-exact, and mirrored binding.
- Four profiles: `technical-legacy`, `publisher-exact`, `publisher-narrow`, and `publisher-binding`.
- Publisher typography: dialogue roles and content on separate lines, refined spacing, and `☐／☒` task items.
- Bullet correctness: only real unordered lists receive Word bullets.
- Continuous preview: one white content surface instead of simulated browser pages.
- Complete editor tools: grouped desktop rail, a shared mobile/desktop Insert menu, and click import for Markdown and images.
- Bilingual samples: quick and complete manuscripts in Traditional Chinese and English.
- AI Prompt v2: separate modes for converting an existing manuscript and drafting a new manuscript.
- Tutorial center: search, chapter navigation, Word pagination guidance, and complete Markdown/DOCX downloads.
- DOCX QA: package, relationship, media, content type, TOC, bookmark, and layout validation.

## Quick Start

1. Paste Markdown or use Import for `.md` files and images.
2. Load a quick or complete sample from the sample selector.
3. Choose a document profile, paper size, and margins.
4. Review structure in the continuous preview.
5. Download a Markdown backup and DOCX.
6. In Word, press `Ctrl + A`, then `F9`, and complete the final pagination pass.

See the [complete user guide](docs/USER_GUIDE.md). The live site also exposes it from the User guide button.

## Profiles and Margins

| Profile | Primary use | 17.6 × 23.6 cm default |
| :--- | :--- | :--- |
| `technical-legacy` | Existing technical manuscripts | 2.54 cm on all sides |
| `publisher-exact` | Current publisher geometry | 2.10 cm vertical, 2.30 cm horizontal |
| `publisher-narrow` | Wider content area | 1.27 cm on all sides |
| `publisher-binding` | Duplex print and binding | Mirrored inside/outside + 0.50 cm gutter |

Different content widths naturally produce different line breaks and page counts. See [Publisher Profile](docs/PUBLISHER_PROFILE.md).

## Supported Syntax

| Feature | Syntax | Output |
| :--- | :--- | :--- |
| Frontmatter | `---` YAML block | `title`, `author`, `header`, `footer`, and metadata |
| Table of contents | `[TOC]` | A Word TOC field in publisher profiles |
| Chapter opener | `[CHAPTER]` YAML block | Number, title, summary, image, and goals |
| Headings | `#` through `###` | H1 through H3 |
| Unordered/ordered lists | `- item` / `1. item` | Native Word bullets or numbering |
| Task list | `- [ ]` / `- [x]` | `☐／☒` without a bullet |
| Quote/rule | `> quote` / `---` | Quote paragraph and horizontal rule |
| Code | <code>```ts:ln</code> / <code>```json:no-ln</code> | Language label and line-number control |
| Mermaid | <code>```mermaid</code> | Rendered for preview and DOCX |
| Callouts | `NOTE` / `TIP` / `WARNING` / `IMPORTANT` / `CAUTION` | Five publishing callouts |
| Dialogue | `Role "::` / `Role ::"` / `Role :":` | Left, right, centered; role on its own line |
| Table | Markdown table | Fixed-geometry Word table |
| Image | `![alt](image-id-or-url)` | Imported or Markdown image |
| Link | `[text](url)` | Normal hyperlink |
| Explicit QR | `[QR:label](URL)` | QR only for important print links |
| Inline formatting | bold, emphasis, `<u>underline</u>`, inline code, `[Ctrl]` | Publishing inline styles |

The [single syntax specification](services/syntaxSpec.ts) owns support status and Slash command, quick action, AI, sample, README, and guide coverage.

## Samples

All website samples live under [`content/examples`](content/examples):

- [Traditional Chinese quick example](content/examples/quick.zh.md)
- [Traditional Chinese complete manuscript](content/examples/complete.zh.md)
- [English quick example](content/examples/quick.en.md)
- [English complete manuscript](content/examples/complete.en.md)

The public DOCX fixture is generated from the complete Traditional Chinese manuscript, avoiding a second drifting QA source.

## AI Assisted Generation

The header exposes two AI Prompt v2 modes:

- Convert an existing manuscript while preserving facts, code, and citations.
- Draft a new manuscript from a brief and trusted sources, marking unknown information as pending.

Both prompts cover the chapter opener, five callouts, explicit QR, and profile/pagination boundaries. Explicit QR is only for important print links; normal Markdown links remain hyperlinks. AI structures content but does not decide paper size, margins, page numbers, or final page breaks.

See [AI Generation Guide](docs/AI_GENERATION_GUIDE.md).

## Documentation

- [Complete User Guide](docs/USER_GUIDE.md): workflow, syntax, layouts, Word post-processing, and delivery checks.
- [Project Overview](docs/PROJECT_OVERVIEW.md): positioning, workflow, and capability boundaries.
- [AI Generation Guide](docs/AI_GENERATION_GUIDE.md): AI Prompt v2 conversion contract.
- [Publisher Profile](docs/PUBLISHER_PROFILE.md): paper, margins, binding, styles, and Word contract.
- [Customization](docs/CUSTOMIZATION.md): safe extension points for profiles, paper, margins, and styles.
- [Architecture](docs/ARCHITECTURE.md): Parser, Preview, DOCX, and QA architecture.
- [Development Guide](docs/DEVELOPMENT_GUIDE.md): local setup, tests, and acceptance.

## Existing Visual Assets

![Historical dialogue demo](docs/images/MD2DOC-角色對話-GIF.gif)

The GIF and `docs/images/1.jpg` through `8.jpg` are retained as historical feature references. Use the [live site](https://huangchiyu.com/MD2DOC-Evolution/) for the current layout, continuous preview, profiles, and tutorial center.

Latest public sample DOCX: [samples/範例Word.docx](samples/範例Word.docx)

## Boundaries and Privacy

- Conversion primarily happens in the browser; the project does not provide a manuscript-upload API.
- Image URLs, fonts, hosting, or an AI service selected by the user may still make third-party requests.
- Preview is not Word pagination. Word version, fonts, printer drivers, and images can change page count.
- TOC updates, odd/even section breaks, complex cross-page tables, indexes, footnotes, and publisher macros may require Word post-processing.
- Remove confidential, personal, and unpublished commercial content before using any external AI service.

## Local Development

Requirements:

- Node.js 20.19+ on the 20.x line, 22.12+ on the 22.x line, or 24.0+
- npm

```bash
git clone https://github.com/eric861129/MD2DOC-Evolution.git
cd MD2DOC-Evolution
npm install
npm run dev
```

Local URL:

```text
http://localhost:3000/MD2DOC-Evolution/
```

## Verification

```bash
npm run verify
npm run qa:fixture
```

`npm run verify` runs TypeScript, Vitest, and the production build. `qa:fixture` generates a DOCX from the complete public sample. LibreOffice visual regression requires a verified local installation and does not replace final Word 365 review.

## Tech Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS
- `marked`, `docx`, Mermaid, QR Code
- Vitest, Testing Library, JSZip

## Contributing

Issues, suggestions, and pull requests are welcome. Run:

```bash
npm run verify
```

This development pass was explicitly requested directly on `main`; normal contributions should follow the repository's live branch protection and pull-request rules.

## License

MIT License. See [LICENSE](LICENSE).
