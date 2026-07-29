/**
 * MD2DOC-Evolution MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

// Use a variable for backticks to avoid escaping hell in template literals
const BT = "`";

export const INITIAL_CONTENT_ZH = `---
title: "星圖工坊出版排版範例"
author: "MD2DOC-Evolution Team"
header: true
footer: true
---
[TOC]

[CHAPTER]
number: "01"
part: "第一部：建立觀測站"
title: "點亮第一張星圖"
englishTitle: "Lighting the First Star Map"
summary: "星圖工坊使用完全虛構的觀測資料，示範出版社版型與 MD2DOC 語法。"
goals:
  - "理解四種文件 Profile 的用途。"
  - "完成可重複驗證的公開範例。"
[/CHAPTER]

# 星圖工坊出版排版指南

## 選擇出版社版型

MD2DOC-Evolution 預設維持 ${BT}technical-legacy${BT}，以相容既有技術書稿。${BT}publisher-exact${BT} 固定使用出版社幾何；${BT}publisher-narrow${BT} 提供較寬內容區，但頁碼會重新排列；${BT}publisher-binding${BT} 使用鏡像邊界與裝訂預留。一般文件連結如 [MD2DOC-Evolution](https://github.com/eric861129/MD2DOC-Evolution) 會保持為 hyperlink。

> [!NOTE]
> 筆記：exact 與 narrow 的內容寬度不同，因此不保證頁碼相同。

> [!TIP]
> 提示：先用公開短稿確認 Profile，再匯出完整書稿。

> [!WARNING]
> 警告：缺少 Noto Sans TC 時，Word 或 LibreOffice 可能替代字型。

> [!IMPORTANT]
> 重要：交付前要在 Word 更新目錄並檢查欄位。

> [!CAUTION]
> 注意：鏡像邊界必須以雙面頁面檢查內外側是否交換。

## 對話方向

觀測員 ":: 我會先確認左側的校準結果。
編輯者 ::" 我會在右側記錄版型決策。
中控台 :": 公開驗收流程已就緒。

## 固定表格

| Profile | 紙張 | 邊界策略 | 頁碼相容性 |
| :--- | :--- | :--- | :--- |
| technical-legacy | 17.6 × 23.6 cm | 相容既有樣式 | 紙張採新版 preset |
| publisher-exact | 17.6 × 23.6 cm | 四邊 2.54 cm | 參考契約 |
| publisher-narrow | 17.6 × 23.6 cm | 四邊 1.27 cm | 允許重排 |
| publisher-binding | 17.6 × 23.6 cm | 鏡像＋gutter | 允許重排 |

## 程式碼與重要連結

${BT}${BT}${BT}typescript:ln
const profile = "publisher-exact";
const output = "public-fixture.docx";
${BT}${BT}${BT}

[QR:星圖工坊公開說明](https://example.com/starmap-workshop)
`;

export const INITIAL_CONTENT_EN = `---
title: "Star Map Workshop Publishing Example"
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
summary: "The Star Map Workshop uses entirely fictional observations to demonstrate publisher layouts and MD2DOC syntax."
goals:
  - "Understand when to use each document profile."
  - "Complete a repeatable public verification."
[/CHAPTER]

# Star Map Workshop Publishing Guide

## Choose a publisher profile

MD2DOC-Evolution keeps ${BT}technical-legacy${BT} as the default for existing technical manuscripts. ${BT}publisher-exact${BT} locks the publisher geometry; ${BT}publisher-narrow${BT} gives the content more width but repaginates it; ${BT}publisher-binding${BT} adds mirrored margins and a gutter. A normal link such as [MD2DOC-Evolution](https://github.com/eric861129/MD2DOC-Evolution) remains a hyperlink.

> [!NOTE]
> Note: exact and narrow use different content widths, so their page numbers cannot be guaranteed to match.

> [!TIP]
> Tip: verify the selected profile with a short public manuscript before exporting a full book.

> [!WARNING]
> Warning: Word or LibreOffice may substitute fonts when Noto Sans TC is unavailable.

> [!IMPORTANT]
> Important: update the table of contents and fields in Word before delivery.

> [!CAUTION]
> Caution: inspect facing pages to confirm that binding inside and outside margins swap correctly.

## Dialogue alignment

Observer ":: I will verify the calibration on the left.
Editor ::" I will record the layout decision on the right.
Console :": The public acceptance workflow is ready.

## Fixed table

| Profile | Paper | Margin strategy | Pagination |
| :--- | :--- | :--- | :--- |
| technical-legacy | 17.6 × 23.6 cm | Legacy-compatible styles | Uses the revised paper preset |
| publisher-exact | 17.6 × 23.6 cm | 2.54 cm on every side | Reference contract |
| publisher-narrow | 17.6 × 23.6 cm | 1.27 cm on every side | Reflow expected |
| publisher-binding | 17.6 × 23.6 cm | Mirrored plus gutter | Reflow expected |

## Code and an important link

${BT}${BT}${BT}typescript:ln
const profile = "publisher-exact";
const output = "public-fixture.docx";
${BT}${BT}${BT}

[QR:Star Map Workshop public guide](https://example.com/starmap-workshop)
`;
