# BookPublisher MD2Docx - Gemini Development Context

## Project Overview
A Markdown to Word (DOCX) conversion tool specifically designed for technical book authors. It bridges the gap between Markdown writing and professional publishing requirements.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6.
- **Styling:** CSS-in-JS/Theming (constants/theme.ts), Bootstrap CSS mentioned in mandates but currently using a custom modular architecture with centralized theming.
- **Core Libraries:** `docx` (Word generation), `marked` (Markdown parsing), `mermaid` (Chart rendering).
- **Testing:** Vitest, React Testing Library.

## Key Architectures
- **Registry Pattern:** Used for Docx generation (`services/docx/registry.ts`). Handlers for different block types are registered in `services/docx/builders/index.ts`.
- **AST Parsing:** Markdown is parsed into tokens using `marked` and then processed into `ParsedBlock` objects in `services/parser/ast.ts`.

## Branching & Workflow (Per CONTRIBUTING.md)
- **`main`**: Production (Squash Merge from `dev`).
- **`dev`**: Integration branch.
- **Feature Branch:** `dev_feature_yyyyMMdd_XXXX` (branched from `dev`).
- **Version Bumping:** 
    - Minor for new features.
    - Patch for bug fixes.
- **Required Updates on Bump:** `package.json`, `README.md`, `README_EN.md`, `CHANGELOG.md`.

## Coding Standards
- Follow existing patterns in `services/docx/builders/`.
- Use TypeScript for all new code.
- Ensure new features have corresponding tests in `tests/`.

## Shared Context
- The project uses a custom Regex + AST approach for parsing.
- Always check `services/types.ts` for data structures.
- Word document styling is defined in `constants/theme.ts` and `services/docx/builders/common.ts`.
