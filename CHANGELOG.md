# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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