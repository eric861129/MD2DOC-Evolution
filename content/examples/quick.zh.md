---
title: "星圖工坊出版快速範例"
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
summary: "以虛構的星圖工坊稿件，快速體驗出版社版型與常用 MD2DOC 語法。"
goals:
  - "了解四種文件 Profile。"
  - "匯出一份可在 Word 後製的 DOCX。"
[/CHAPTER]

# 星圖工坊出版排版指南

## 選擇出版社版型

MD2DOC-Evolution 預設維持 `technical-legacy`；`publisher-exact` 對齊出版社幾何（上下 2.10、左右 2.30 cm）；`publisher-narrow` 使用窄邊界；`publisher-binding` 提供鏡像邊界與裝訂預留。一般連結如 [MD2DOC-Evolution](https://github.com/eric861129/MD2DOC-Evolution) 會保持為 hyperlink。

- 先用短稿確認版面。
- 再匯入完整書稿。

> [!NOTE]
> exact 與 narrow 的內容寬度不同，因此不保證頁碼相同。

> [!TIP]
> 交付前請在 Word 更新目錄與所有欄位。

## 對話與程式碼

觀測員 ":: 我會先確認左側的校準結果。
編輯者 ::" 我會在右側記錄版型決策。

```typescript:ln
const profile = "publisher-narrow";
const paper = "17.6 × 23.6 cm";
```

[QR:MD2DOC-Evolution 專案](https://github.com/eric861129/MD2DOC-Evolution)
