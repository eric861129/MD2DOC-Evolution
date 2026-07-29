---
title: "Star Map Workshop Quick Publishing Example"
author: "MD2DOC-Evolution Team"
header: true
footer: true
---

[TOC]

[CHAPTER]
number: "01"
part: "Part One: Build the Observatory"
title: "Light the First Star Map"
englishTitle: "Light the First Star Map"
summary: "Use a fictional Star Map Workshop manuscript to try publisher layouts and common MD2DOC syntax."
goals:
  - "Understand the four document profiles."
  - "Export a DOCX that is ready for final editing in Word."
[/CHAPTER]

# Star Map Workshop Publishing Guide

## Choose a publisher profile

MD2DOC-Evolution defaults to `publisher-exact`, using the publisher geometry (2.10 cm vertical, 2.30 cm horizontal). `publisher-narrow` uses narrow margins, and `publisher-binding` adds mirrored margins and a gutter. A normal [MD2DOC-Evolution link](https://github.com/eric861129/MD2DOC-Evolution) remains a hyperlink.

- Verify the layout with a short manuscript.
- Then import the complete book.

> [!NOTE]
> Exact and narrow use different content widths, so their page numbers are not guaranteed to match.

> [!TIP]
> Update the table of contents and all fields in Word before delivery.

## Dialogue and code

Observer ":: I will verify the calibration on the left.
Editor ::" I will record the layout decision on the right.

```typescript:ln
const profile = "publisher-narrow";
const paper = "17.6 × 23.6 cm";
```

[QR:MD2DOC-Evolution project](https://github.com/eric861129/MD2DOC-Evolution)
