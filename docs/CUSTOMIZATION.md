# MD2DOC-Evolution 客製化指南

本指南說明如何在不破壞 Parser、Preview 與 DOCX 一致性的前提下，新增紙張、邊界、Profile、語法或 Word 樣式。

## 先選擇正確的擴充層

| 需求 | 修改位置 |
| :--- | :--- |
| 新紙張尺寸 | `services/docx/layout/presets.ts` |
| 新邊界方案 | `services/docx/layout/presets.ts` |
| 自訂輸入驗證 | `services/docx/layout/validation.ts` |
| 新文件 Profile | `services/docx/profiles/` 與 Profile registry |
| 標題、正文、表格、對話樣式 | `services/docx/profiles/` |
| 新 Markdown 語法 | `services/syntaxSpec.ts`、Parser、Preview renderer、DOCX builder |
| 新編輯器操作 | `services/syntaxSpec.ts` 與共用 command model |
| OOXML package 修正 | `services/docx/postprocess.ts` |
| DOCX 品質檢查 | `services/docx/quality.ts` |

不要在單一 Builder 內加入紙張、邊界或 Profile 魔術數字。

## 新增紙張尺寸

在 `PAGE_SIZE_PRESETS` 增加明確的公分尺寸：

```ts
{ id: 'custom-book', widthCm: 18, heightCm: 24 }
```

接著：

1. 擴充 `PageSizePresetId` 型別。
2. 加入中英文 UI label。
3. 驗證 `resolvePageLayout()` 產生正確 twips。
4. 新增 `tests/docx/layout.test.ts` 測試。
5. 在 README、Publisher Profile 與使用教學更新公開說明。

## 新增邊界方案

標準邊界使用 `mode: 'standard'`：

```ts
{
  id: 'editorial',
  margins: {
    mode: 'standard',
    topCm: 2,
    bottomCm: 2.2,
    leftCm: 2.4,
    rightCm: 2,
    gutterCm: 0,
    gutterPosition: 'left',
  },
}
```

雙面裝訂使用 `mode: 'mirrored'`，並明確指定 `insideCm`、`outsideCm` 與 `gutterCm`。鏡像邊界需要 `settings.xml` 的 `w:mirrorMargins`，不可只在 Preview 左右交換數值。

## 新增文件 Profile

Profile 同時管理：

- 字型與 fallback。
- 正文、H1～H3、程式碼、表格、Callout、對話、圖片與 QR token。
- 頁首頁尾行為。
- TOC 與章首頁風格。
- 是否使用出版社 OOXML 正規化。

建議步驟：

1. 在 `services/docx/profiles/` 建立 Profile。
2. 加入 Profile registry 與 `DocumentProfileId`。
3. 在 `DOCUMENT_PROFILE_PRESETS` 指定預設紙張與邊界。
4. Preview 必須消費同一個 Profile token，不另建 CSS 常數。
5. 新增 styles、typography、table、component 與 package 測試。
6. 以完整公開範例產生 DOCX。
7. 在 Word 365 檢查格式標記、目錄、章首頁、表格、圖片與末頁。

## 新增 Markdown 語法

一項正式支援的語法至少要完成：

1. `services/syntaxSpec.ts`：feature、狀態與覆蓋矩陣。
2. `services/types.ts`：必要的 `BlockType` 與 metadata。
3. `services/parser/ast.ts`：AST → `ParsedBlock`。
4. Preview renderer。
5. DOCX builder 與 registry。
6. Slash command 或插入工具。
7. 中文／英文完整功能稿。
8. AI prompt 是否可用的明確決策。
9. README 與 `docs/USER_GUIDE.md`。
10. Parser、Preview、DOCX 與 coverage tests。

不能只完成 Parser 就把狀態標示為 `supported`。

## 調整 Word 樣式

優先修改 Profile token，再由 Builder 消費。修改前先確認：

- 單位是 half-points、twips、EMU 或公分。
- 段前／段後與行距是否會改變總頁數。
- `keepNext`、`keepLines`、`pageBreakBefore` 是否會在格式標記中產生非預期黑方塊。
- 表格欄寬總和是否等於內容區寬度。
- 圖片與 QR 是否超過內容區。

出版社 Profile 的段落分頁屬性會由 OOXML post-process 正規化。任何改動都要解開 DOCX 驗證 `document.xml` 與 `styles.xml`，不能只看瀏覽器畫面。

## 版面一致性原則

- Preview 與 DOCX 共用解析後的 `ResolvedPageLayout`。
- Preview 是連續內容流，只對齊比例、內容寬度與設計語言。
- exact 與 narrow 的內容寬度不同，不應以「頁碼相同」作為測試。
- Publisher binding 的奇偶頁內外側交換只能由 Word 或 OOXML 驗證。
- 不用空白段落或固定高度硬湊 Word 頁面。

## 驗證清單

```bash
npm run verify
npm run qa:fixture
```

另行檢查：

- `git diff --check`
- 語法覆蓋矩陣
- DOCX package 與 relationship
- 只有真正無序清單包含 `<w:numPr>`
- 目錄、bookmark、media 與 content type
- 17.6 × 23.6 cm、exact、narrow、binding 幾何
- Word 365 開啟格式標記後沒有無效黑點

LibreOffice 視覺回歸需要固定且可用的安裝環境；本機 `bootstrap.ini` 損壞時應先修復 LibreOffice，不可把失敗的 renderer 當成產品缺陷，也不可取代 Word 365 最終驗收。
