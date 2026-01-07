# BookPublisher MD2Docx | v1.2.3

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.3-blue.svg)](https://github.com/eric861129/BookPublisher_MD2Doc)

[🇹🇼 中文](README.md) | [🇺🇸 English](README_EN.md)

## If you like this project, please give it a star 🌟🌟🌟

**BookPublisher MD2Docx** is an open-source Markdown editor and converter designed specifically for **technical book authors** and **content creators**. It bridges the gap between "engineers' preferred Markdown writing" and "publishers' required Word manuscripts," allowing you to focus on content creation while automating tedious formatting work.

🔗 **Live Demo:** [https://eric861129.github.io/BookPublisher_MD2Doc/](https://eric861129.github.io/BookPublisher_MD2Doc/)

## 📄 Sample Output

You can view the exported Word document effect here:
- [📥 Download Sample File (範例Word.docx)](samples/範例Word.docx)

<div align="center">
  <img src="docs/images/1.jpg" width="48%" alt="Cover & Header" />
  <img src="docs/images/2.jpg" width="48%" alt="Chat Dialogues" />
  <br/>
  <img src="docs/images/3.jpg" width="48%" alt="Callouts & Styles" />
  <img src="docs/images/4.jpg" width="48%" alt="Code Blocks" />
  <br/>
  <img src="docs/images/5.jpg" width="48%" alt="Tables & Lists" />
  <img src="docs/images/6.jpg" width="48%" alt="Tables & Lists" />
  <br/>
  <img src="docs/images/7.jpg" width="48%" alt="Tables & Lists" />
  <img src="docs/images/8.jpg" width="48%" alt="Tables & Lists" />
</div>
*(Screenshot of actual Word output)*

## ✨ Features

This project is not just a Markdown converter; it is deeply optimized for "publishing" needs:

- **📚 Professional Word (DOCX) Export**
    - Automatically configures headings, paragraphs, line spacing, and borders.
    - Built-in font settings: **Microsoft JhengHei** for Chinese, **Consolas** for English/Code.
    - Supports multiple page sizes: Technical Book (17x23cm), A4, A5, B5.
    - **Automatic TOC**: Supports generating clickable Table of Contents using `[TOC]` syntax (Standard TOC field in Word).

- **💻 Enhanced Code Blocks**
    - **Automatic Line Numbers**: Line numbers displayed by default, matching IDE style (single line spacing).
    - **Language Labels**: Automatically displays language name in the top-right corner.
    - **Flexible Control**: Supports `js:ln` (force show) or `js:no-ln` (hide line numbers) syntax.

- **📈 Mermaid Chart Support**
    - Supports standard `mermaid` syntax for flowcharts, sequence diagrams, etc.
    - **Auto-Image Conversion**: Real-time SVG preview on web, auto-converts to high-res PNG in exported Word docs.

- **🔗 Smart Links (QR Code)**
    - **Auto QR Code Generation**: Markdown links `[Text](URL)` automatically generate a QR Code next to the text in the exported file.
    - **Optimized for Physical Books**: Convenient for readers to scan and jump to resources while reading printed or e-books.

- **📑 YAML Frontmatter Support**
    - **Metadata Management**: Define book title, author, and layout preferences at the beginning of the file using YAML syntax.
    - **Auto Document Properties**: Defined `title` and `author` are automatically written to Word document properties.

- **📖 Dynamic Headers & Footers**
    - **Professional Page Numbers**: Automatically inserts page numbers centered in the footer.
    - **Header Navigation**: Displays the book title automatically in the header.
    - **Flexible Toggle**: Use Frontmatter to set `header: false` or `footer: false` to enable or disable them.

- **💬 Chat Dialogues**
    - Designed for "scenario simulation" or "AI conversations" common in technical books.
    - Simply type `User:` or `AI:` to generate left/right aligned, styled dialogue boxes.

- **⚠️ Rich Callouts**
    - Supports GitHub/Obsidian style callout syntax:
    - `[!TIP]` Tip: Solid border
    - `[!NOTE]` Note: Dashed border
    - `[!WARNING]` Warning: Thick border emphasis

- **⌨️ Special Inline Styles**
    - **UI Button**: Use `【Settings】` to generate button styles.
    - **Shortcut**: Use `[Ctrl]` to generate keyboard key styles.
    - **Book Title**: Use `『Clean Code』` for automatic bolding.

- **📊 Rich Block Support**
    - **Tables**: Supports standard Markdown table syntax, auto-generating bordered Word tables.
    - **Ordered Lists**: Supports `1.` `2.` with automatic numbering.

- **👁️ WYSIWYG**
    - Dual-column mode: Writing on the left, real-time preview on the right.
    - **Editor Optimization**: Supports `Tab` indentation (inserts spaces) without losing focus.

## 🚀 Getting Started

## ❓ Known Issues

### About Mermaid Chart Export
When you open a Word document containing Mermaid charts, Word might pop up the following security alert:

![Word Alert](docs/images/WordAlert.jpg)

> "Word found unreadable content in the document. Do you want to recover the contents of this document?"

This is due to compatibility encoding issues when converting Mermaid charts to Word image formats.
✅ **Please safely click "Yes"**. Word will automatically repair and correctly display all chart content. This does not affect the security or integrity of the document.

## 🎨 Customization

This project supports high customization. You can adjust fonts, colors, or add Markdown syntax based on your needs. For details, please refer to:
- [📘 Customization Guide (CUSTOMIZATION.md)](CUSTOMIZATION.md)

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) (Hooks-based Modular Architecture)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Design System**: Centralized Theming System (`theme.ts`)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Document Generation**: [docx](https://docx.js.org/)
- **UI Icons**: [Lucide React](https://lucide.dev/)

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature suggestion:

1. Fork this project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
