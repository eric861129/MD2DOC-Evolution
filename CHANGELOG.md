# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-21

### Added
- **Resizable Layout**:
    - Implemented a draggable divider between the Markdown editor and the Preview pane.
    - Users can now customize the split ratio (default 50/50) to optimize their workspace.
- **Direct File Import via Drag-and-Drop**:
    - Support for dragging and dropping `.md` files directly into the editor.
    - Automatically reads and populates the editor with the file's content, streamlining the import process.

### Changed
- **UI Evolution (v2 Style)**:
    - Redesigned the **Header** to group "Reset", "Language", and "Theme" buttons into a single, cohesive action bar.
    - Introduced an **Ultra-Flat Footer** (VS Code style) that displays project info and a GitHub link in a single, non-intrusive line.
    - Improved overall visual balance with refined padding and typography.

## [1.2.10] - 2026-01-20

### Added
- **Slash Command System**:
    - Introduced a powerful slash command menu triggered by typing `/` in the editor.
    - **Context-Aware Popup**: The menu appears right at the cursor position (and intelligently flips up if close to the bottom).
    - **Rich Command Set**: Quickly insert Headings, Lists, Tables, Code Blocks, Mermaid Charts, Callouts, and Chat Dialogues.
    - **Keyboard Navigation**: Full support for arrow keys and Enter to select commands.
    - **Filtering**: Real-time filtering of commands as you type (e.g., `/table`, `/code`).
    - **TOC Support**: Added `[TOC]` command for one-click Table of Contents insertion.

## [1.2.9] - 2026-01-16

### Added
- **Quick Action Sidebar**:
    - Introduced a new floating sidebar for quick insertion of Markdown templates (Headings, Code blocks, Mermaid, Callouts, Chat dialogues, Tables, and TOC).
    - Intelligent cursor positioning after insertion for immediate editing.
- **Optimized Image Handling**:
    - Support for dragging and dropping images directly into the editor.
    - **Image Registry System**: Images are now stored in an internal registry and referenced by short IDs in Markdown (e.g., `![alt](img_id)`), preventing long Base64 strings from cluttering the editor while maintaining full preview and export capabilities.

### Changed
- **UI/UX Layout Optimization**:
    - Adjusted the main editor/preview split to 40% / 60% for a better visual experience.
    - Increased preview paper maximum width and reduced internal margins to maximize content display area.
    - Forced images to scale to full page width in Word export while maintaining aspect ratio.

### Fixed
- **Syntax Parsing**: Fixed a conflict where image syntax (`![]()`) was being incorrectly parsed as a link (`[]()`).
- **Runtime Stability**: Resolved critical `ReferenceError` issues related to missing imports in the preview renderer.

## [1.2.8] - 2026-01-09

### Refactored
- **Hook Architecture**:
    - Decomposed the monolithic `useMarkdownEditor` into specialized hooks for better maintainability and separation of concerns.
    - Added `hooks/useEditorState.ts`: Manages core content and parsing state.
    - Added `hooks/useDocxExport.ts`: Handles document generation and file IO.
    - Added `hooks/useSyncScroll.ts`: Encapsulates scroll synchronization logic.
    - Added `hooks/useWordCount.ts`: Optimized word counting with `useMemo`.

## [1.2.7] - 2026-01-09

### Added
- **Comprehensive Documentation**:
    - Added `docs/PROJECT_OVERVIEW.md`: Detailed explanation of project goals, features, and target audience.
    - Added `docs/ARCHITECTURE.md`: In-depth guide to system architecture, directory structure, and core parsing/generation workflows.
    - Added `docs/DEVELOPMENT_GUIDE.md`: Developer handbook for setup, debugging, and testing.
    - Updated READMEs with links to these new resources.

## [1.2.6] - 2026-01-08

### Added
- **Export Markdown**:
    - Added ability to export the raw Markdown content as a `.md` file.
    - This ensures users can back up their source code alongside the generated Word document.

## [1.2.5] - 2026-01-08

### Added
- **Gemini Development Context**:
    - Added `GEMINI.md` to provide project-specific context and guidelines for Gemini-based development.
    - Added `.geminiignore` to optimize file indexing for Gemini.

## [1.2.4] - 2026-01-07

### Added
- **Precise Sync Scroll**:
    - Implemented line-based mapping between Markdown editor and Preview pane.
    - Provides a much smoother and accurate scrolling experience compared to simple percentage-based scrolling, especially for documents with large images or code blocks.

## [1.2.3] - 2026-01-07

### Fixed
- **Mermaid Export Stability**:
    - Implemented a concurrency-limited queue for Mermaid-to-Word conversion.
    - Prevents browser crashes and memory spikes when exporting documents with a large number of diagrams.

## [1.2.2] - 2026-01-07

### Refactored
- **AST-Based Parser**:
    - Replaced legacy Regex-based parser with **AST (Abstract Syntax Tree)** using `marked`.
    - Significantly improved support for nested structures (e.g., code blocks inside lists, callouts inside blockquotes).
    - Improved parsing stability and maintainability.

## [1.2.1] - 2026-01-07

### Changed
- **CI/CD Optimization**:
    - Streamlined CI workflow to focus on Node.js 20.x (LTS).
    - Optimized build cache and trigger rules.
- **Branch Rules**:
    - Relaxed `dev` branch rules to accept PRs from `dev_hotfix_*` and `dev_refactor_*` branches.

## [1.2.0] - 2026-01-07

### Added
- **Mermaid Chart Support**:
    - Write diagrams using standard Mermaid syntax (Flowcharts, Sequence diagrams, etc.).
    - Real-time SVG rendering in web preview.
    - Automatic SVG-to-PNG conversion for high-quality Word export.

## [1.1.1] - 2026-01-05

### Refactored
- **Async Builder Pipeline**:
    - Refactored core Word generation engine to be fully asynchronous.
    - Removed pre-generation logic for QR codes; images are now generated on-the-fly within builders.
    - Improved code cohesion and extensibility for future IO-bound features.

## [1.1.0] - 2026-01-05

### Added
- **Enhanced Code Blocks**:
    - Automatic line numbering (IDE style).
    - Language label display in top-right corner.
    - Support for `lang:ln` (force show) and `lang:no-ln` (force hide) syntax.
    - Improved padding and border alignment for professional look.
- **Smart Links (QR Code)**:
    - Automatically generates QR Codes for links (`[Text](URL)`) in Word documents.
    - Inline image placement for seamless reading experience in physical books.
- **YAML Frontmatter Support**:
    - Parse `title`, `author`, `header`, `footer` from file header.
    - Auto-fill Word document properties (Title/Author).
- **Dynamic Headers & Footers**:
    - Automatic page numbering in footer (centered).
    - Dynamic book title in header (right-aligned).
    - Configurable via Frontmatter (`header: false` / `footer: false`).
- **Documentation**:
    - Added English README (`README_EN.md`).
    - Added language switcher in READMEs.

### Changed
- Updated `README.md` with new features and syntax guide.
- Updated `CONTRIBUTING.md` with version control guidelines.
- Refactored `services/docxGenerator.ts` to support async pre-generation (for QR codes).

## [1.0.0] - 2025-12-31

### Added
- Initial release of **BookPublisher MD2Docx**.
- Core Markdown to Word (DOCX) conversion.
- Support for Chat Dialogues (`User:`, `AI:`).
- Support for Callouts (`[!TIP]`, `[!NOTE]`, `[!WARNING]`).
- WYSIWYG Editor with real-time preview.