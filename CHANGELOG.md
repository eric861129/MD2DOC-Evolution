# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-02

### Added
- **Unit Testing**: Introduced Vitest for core logic testing.
- **Snapshot Testing**: Added document structure regression testing for docx generation.
- **Atomic UI Components**: Reusable `Button`, `IconButton`, and `Select` components.
- **EditorContext**: Centralized state management using React Context API.
- **Support for manual TOC**: `[TOC]` syntax for generating Word Table of Contents.
- **Support for Chat Dialogues**: `User:` and `AI:` syntax for scenario simulations.
- **Support for Callouts**: `[!TIP]`, `[!WARNING]`, `[!NOTE]` syntax.

### Changed
- **Architecture Refactor**: Separated Markdown parsing, Docx generation, and UI logic.
- **Theme Management**: Split `WORD_THEME` and `UI_THEME` in `constants/theme.ts`.
- **Type Safety**: Centralized and refined TypeScript definitions across the project.
- **Performance**: Optimized sync scrolling and markdown parsing with debouncing.

### Fixed
- Fixed snapshot flakiness by freezing system time during tests.
- Improved dark mode transition consistency.
