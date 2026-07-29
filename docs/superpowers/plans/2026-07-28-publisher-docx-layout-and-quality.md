# MD2DOC 出版社級 Word 版型與頁面設定 Implementation Plan

> **歷史文件（已執行計畫）：** 本文件保留 2026-07-28 當時的設計、估算與待辦，
> 不代表 v1.5.0 現行功能或操作方式。現行產品契約請依
> `services/syntaxSpec.ts`、`docs/USER_GUIDE.md` 與
> `docs/PUBLISHER_PROFILE.md`；請勿把下方未勾選項目當成目前缺陷清單。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **2026-07-29 後續需求：**共用技術書紙張 preset 已由本計畫原始的
> 17 × 23 cm 調整為 17.6 × 23.6 cm。下方 17 × 23 cm 數值保留為計畫執行時
> 的歷史規格；現行產品契約以 `services/docx/layout/presets.ts` 與
> `docs/PUBLISHER_PROFILE.md` 為準。

**Goal:** 讓 MD2DOC-Evolution 能選擇紙張、邊界與裝訂設定，並產出在字體、段落、表格、程式碼、Callout、對話框、圖片、QR、目錄與章首頁等方面符合出版社參考稿的 DOCX。

**Architecture:** 保留既有 Markdown Parser、Block Registry、React 編輯器與下載流程，在 DOCX 匯出層加入「版面設定解析器」與「文件樣式 Profile」。所有 Builder 只消費已解析的 `DocxConfig`，網站預覽也消費相同的版面與樣式 Token；DOCX 打包後再經 OOXML 後處理與品質檢查，最後用固定環境做渲染回歸。

**Tech Stack:** React 19、TypeScript 5.8、Vite 6、Vitest 4、docx 9.5.1、JSZip、LibreOffice 26.2.4.2、Poppler、PowerShell。

## Global Constraints

- 所有資料、文件、測試案例與必要註解使用繁體中文，檔案一律 UTF-8。
- 禁止批次或遞迴刪除；不得使用 `rm -rf`、`Remove-Item -Recurse`、`del /s`、`rd /s` 或 `rmdir /s`。
- 實作時使用獨立 worktree 與 `codex/` 前綴分支；未經使用者明確要求不得 push。
- 出版社完整 337 頁書稿只作為本機私有驗收資料，不得提交到開源倉庫。
- 公開 Golden Fixture 必須使用虛構文字、公開連結及測試產生的圖片。
- `publisher-exact` 固定為 17×23 cm、四邊 2.54 cm、頁首頁尾距離 0.492 inch。
- `publisher-narrow` 固定為 17×23 cm、四邊 1.27 cm；允許換行、頁碼及總頁數與參考稿不同。
- `publisher-binding` 使用鏡像邊界：上 2.00 cm、下 2.20 cm、內側 2.20 cm、外側 1.80 cm、裝訂預留 0.50 cm。
- 一般預設邊界為：窄 1.27 cm、緊湊 1.50 cm、平衡 2.00 cm、標準 2.54 cm。
- 自訂邊界硬限制為 0.50–5.00 cm；裝訂預留硬限制為 0.00–5.00 cm（0 表示不保留裝訂空間）；任一邊小於 1.00 cm 時顯示列印風險提醒。
- 解析後的有效內容寬度不得小於 8.00 cm，有效內容高度不得小於 10.00 cm。
- Word 正文字型為 Calibri／Noto Sans TC，程式碼為 Consolas／Noto Sans TC。
- 公開版本先以選配 Profile 方式加入；在完整實稿驗收前不得默默更改既有使用者的預設輸出。
- 每個 Task 都必須先有失敗測試，再做最小實作，最後執行指定驗證並建立單一聚焦 commit。

---

## 產品決策與完成定義

### 版型

| Profile ID | 顯示名稱 | 預設頁面 | 預設邊界 | 相容性 |
|---|---|---|---|---|
| `technical-legacy` | 經典技術文件 | 17×23 cm | 2.54 cm | 保留目前輸出行為 |
| `publisher-exact` | 出版社一致版 | 17×23 cm | 2.54 cm | 與參考稿逐項比對 |
| `publisher-narrow` | 出版社窄邊界版 | 17×23 cm | 1.27 cm | 樣式一致、接受重排 |
| `publisher-binding` | 出版裝訂版 | 17×23 cm | 鏡像＋0.50 cm gutter | 實體雙面裝訂 |

使用者選擇 Profile 後仍可改紙張或邊界。只要覆寫 `publisher-exact` 的預設幾何，介面就必須顯示「已自訂；不保證與出版社參考稿頁碼一致」。

### 驗收層級

1. **型別與單元層：** 版面換算、預設值、欄寬、圖片尺寸、警告條件全部有 Vitest。
2. **OOXML 層：** 實際打包 DOCX，檢查 `styles.xml`、`document.xml`、`settings.xml`、媒體項目及 Relationships。
3. **渲染層：** 公開 Fixture 在固定 LibreOffice 環境轉成 PDF／PNG，指定頁 mismatch ratio 不高於 1.5%。
4. **Word 層：** Word 365 開啟不出現修復提示，目錄可更新，頁首頁尾、表格重複表頭及鏡像邊界有效。
5. **實稿層：** 同一份私有完整書稿由 Codex 參考產生器與 MD2DOC 產生，逐頁檢查差異；窄邊界版只驗證樣式，不驗證頁碼一致。

## 檔案結構

### 新增

| 檔案 | 責任 |
|---|---|
| `services/docx/layout/types.ts` | 頁面、邊界、Profile 選擇與解析結果型別 |
| `services/docx/layout/presets.ts` | 紙張、邊界、Profile 預設資料 |
| `services/docx/layout/resolve.ts` | cm／twips 換算、內容區域與錯誤驗證 |
| `services/docx/profiles/types.ts` | Word 樣式 Token 型別 |
| `services/docx/profiles/publisher.ts` | 出版社字體、色彩、段距、圖片與元件 Token |
| `services/docx/profiles/legacy.ts` | 既有輸出 Token |
| `services/docx/profiles/index.ts` | Profile 查詢與預設選擇 |
| `services/docx/styles.ts` | 產生 Word 命名樣式 |
| `services/docx/builders/tableGeometry.ts` | 根據內容寬度計算固定表格欄寬 |
| `services/docx/builders/chapter.ts` | 章首頁 |
| `services/docx/builders/qr.ts` | 獨立 QR 區塊 |
| `services/docx/postprocess.ts` | `mirrorMargins` 等 OOXML 後處理 |
| `services/docx/quality.ts` | DOCX 封裝與必要結構檢查 |
| `components/editor/ExportSettingsModal.tsx` | Profile、紙張、邊界與裝訂 UI |
| `tests/helpers/readDocx.ts` | 用 JSZip 讀取實際 DOCX XML |
| `tests/docx/layout.test.ts` | 版面預設與換算測試 |
| `tests/docx/styles.test.ts` | Word 命名樣式測試 |
| `tests/docx/typography.test.ts` | 正文、標題、行內樣式與清單測試 |
| `tests/docx/components.test.ts` | 程式碼、Callout、對話框、圖片、QR 測試 |
| `tests/docx/table.test.ts` | 固定表格幾何測試 |
| `tests/docx/package.test.ts` | OOXML、媒體、欄位與鏡像邊界測試 |
| `tests/ExportSettingsModal.test.tsx` | 匯出版面設定 UI 測試 |
| `tests/markdownParser.publisher.test.ts` | 章首頁、QR、IMPORTANT／CAUTION 語法測試 |
| `tests/fixtures/publisher-manuscript.md` | 公開虛構 Golden Fixture |
| `scripts/qa/generate-publisher-fixture.ts` | 從 Fixture 產生 DOCX |
| `scripts/qa/render-docx.ps1` | LibreOffice／Poppler 渲染 |
| `scripts/qa/compare-render.mjs` | PNG 差異比較 |
| `docs/PUBLISHER_PROFILE.md` | 出版社版型與語法使用手冊 |

### 修改

| 檔案 | 修改目的 |
|---|---|
| `constants/meta.ts` | 改由新版面 Preset 提供紙張清單 |
| `constants/theme.ts` | 降為 legacy Token，相容舊 Profile |
| `services/types.ts` | 新增 `CHAPTER_OPENER`、`QR`、`IMPORTANT`、`CAUTION` |
| `services/parser/ast.ts` | 解析新出版語法 |
| `services/syntaxSpec.ts` | 公開新語法與快速插入命令 |
| `services/docx/types.ts` | `DocxConfig` 改為已解析版面與 Profile |
| `services/docxGenerator.ts` | 套用 Section、樣式、頁首頁尾與後處理 |
| `services/docx/builders/*.ts` | 移除硬編碼，套用 Profile |
| `services/docx/builders/index.ts` | 移除假空白段落，註冊新 Builder |
| `services/exportValidation.ts` | 加入版面與出版品質預檢 |
| `hooks/useDocxExport.ts` | 以 `ExportSettings` 取代單一頁面 index |
| `hooks/useMarkdownEditor.ts` | 對 Editor Context 公開新版面狀態 |
| `components/editor/EditorHeader.tsx` | 開啟版面設定並顯示選擇摘要 |
| `components/editor/PreviewPane.tsx` | 顯示正確頁面比例與邊界 |
| `components/editor/PreviewRenderers.tsx` | 使用出版 Profile 的元件 Token |
| `services/i18n.ts` | 中英文版面與警告文字 |
| `tests/docxGenerator.test.ts` | 移除只 Mock Packer 的低價值測試 |
| `package.json`、`package-lock.json` | JSZip、tsx、pixelmatch、pngjs 與 QA scripts |
| `README.md` | 出版社級能力、畫面與快速開始 |
| `docs/ARCHITECTURE.md` | 新匯出管線 |
| `docs/DEVELOPMENT_GUIDE.md` | OOXML 與渲染測試流程 |
| `docs/AI_GENERATION_GUIDE.md` | 新章首頁與 QR 語法 |
| `samples/範例Word.docx` | 以有效 OOXML 的新公開範例取代舊檔 |

## 里程碑與預估

| 里程碑 | Tasks | 可驗收成果 | 預估 |
|---|---|---|---:|
| M1 版面基礎 | 1–4 | 紙張、一般邊界、Profile、實際 DOCX 幾何 | 4–6 人日 |
| M2 元件一致 | 5–8 | 字體、標題、程式碼、Callout、表格、圖片、QR | 6–9 人日 |
| M3 書籍能力 | 9–10 | 章首頁、目錄、書籤、預覽同步 | 4–6 人日 |
| M4 品質門檻 | 11–12 | OOXML 檢查、渲染回歸、Word 驗收流程 | 4–6 人日 |
| M5 公開發佈 | 13 | 文件、範例、版本與品牌頁面 | 2–3 人日 |
| 穩定化 | 全部 | 完整私有書稿回歸與差異修正 | 3–5 人日 |

總量約 23–35 人日。若只先交付「可選紙張與邊界＋publisher-exact 核心元件」，可在 M1＋M2 後形成第一個可用版本。

---

### Task 1: 建立版面設定領域模型

**Files:**
- Create: `services/docx/layout/types.ts`
- Create: `services/docx/layout/presets.ts`
- Create: `services/docx/layout/resolve.ts`
- Create: `tests/docx/layout.test.ts`

**Interfaces:**
- Produces: `ExportSettings`、`ResolvedPageLayout`、`resolvePageLayout(settings)`、`DEFAULT_EXPORT_SETTINGS`。
- Consumes: 無。

- [ ] **Step 1: 撰寫版面解析失敗測試**

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPORT_SETTINGS } from '../../services/docx/layout/presets';
import { resolvePageLayout } from '../../services/docx/layout/resolve';

describe('resolvePageLayout', () => {
  it('解析出版社一致版為 17x23 公分與 2.54 公分邊界', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      profileId: 'publisher-exact',
      marginPresetId: 'publisher-exact',
    });
    expect(layout.page.widthCm).toBe(17);
    expect(layout.page.heightCm).toBe(23);
    expect(layout.margins.leftCm).toBe(2.54);
    expect(layout.margins.leftTwips).toBe(1440);
    expect(layout.content.widthCm).toBeCloseTo(11.92, 2);
  });

  it('解析窄邊界內容寬度為 14.46 公分', () => {
    const layout = resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      profileId: 'publisher-narrow',
      marginPresetId: 'narrow',
    });
    expect(layout.content.widthCm).toBeCloseTo(14.46, 2);
  });

  it('拒絕有效內容寬度小於 8 公分', () => {
    expect(() => resolvePageLayout({
      ...DEFAULT_EXPORT_SETTINGS,
      pageSizeId: 'custom',
      customPageSizeCm: { width: 10, height: 20 },
      marginPresetId: 'custom',
      customMargins: {
        mode: 'standard',
        topCm: 2,
        bottomCm: 2,
        leftCm: 2,
        rightCm: 2,
        gutterCm: 1,
        gutterPosition: 'left',
      },
    })).toThrow('有效內容寬度不得小於 8 公分');
  });
});
```

- [ ] **Step 2: 執行測試並確認缺少模組**

Run: `npm run test:run -- tests/docx/layout.test.ts`

Expected: FAIL，指出 `services/docx/layout/*` 尚不存在。

- [ ] **Step 3: 建立精確型別**

```ts
export type DocumentProfileId =
  | 'technical-legacy'
  | 'publisher-exact'
  | 'publisher-narrow'
  | 'publisher-binding';

export type PageSizePresetId = 'tech' | 'a4' | 'a5' | 'b5' | 'custom';
export type MarginPresetId =
  | 'narrow'
  | 'compact'
  | 'balanced'
  | 'standard'
  | 'publisher-exact'
  | 'publisher-binding'
  | 'custom';

export type MarginConfigCm =
  | {
      mode: 'standard';
      topCm: number;
      bottomCm: number;
      leftCm: number;
      rightCm: number;
      gutterCm: number;
      gutterPosition: 'left' | 'top';
    }
  | {
      mode: 'mirrored';
      topCm: number;
      bottomCm: number;
      insideCm: number;
      outsideCm: number;
      gutterCm: number;
      gutterPosition: 'left' | 'top';
    };

export interface ExportSettings {
  profileId: DocumentProfileId;
  pageSizeId: PageSizePresetId;
  marginPresetId: MarginPresetId;
  customPageSizeCm?: { width: number; height: number };
  customMargins?: MarginConfigCm;
}

export interface ResolvedMargins {
  mode: 'standard' | 'mirrored';
  topCm: number;
  rightCm: number;
  bottomCm: number;
  leftCm: number;
  insideCm?: number;
  outsideCm?: number;
  gutterCm: number;
  gutterPosition: 'left' | 'top';
  topTwips: number;
  rightTwips: number;
  bottomTwips: number;
  leftTwips: number;
  gutterTwips: number;
}
```

鏡像模式下 `leftCm/leftTwips` 寫入內側值、`rightCm/rightTwips` 寫入外側值，並同時保留 `insideCm`／`outsideCm` 供 UI 顯示。`ResolvedPageLayout` 必須包含 `ResolvedMargins`、頁面 cm 與 twips、`content.widthCm`、`content.heightCm`、`isCustomizedFromProfile`、`warnings: string[]`。

- [ ] **Step 4: 建立固定 Preset**

`PAGE_SIZE_PRESETS` 必須包含：

```ts
[
  { id: 'tech', widthCm: 17, heightCm: 23 },
  { id: 'a4', widthCm: 21, heightCm: 29.7 },
  { id: 'a5', widthCm: 14.8, heightCm: 21 },
  { id: 'b5', widthCm: 17.6, heightCm: 25 },
]
```

`MARGIN_PRESETS` 必須包含 1.27、1.50、2.00、2.54 cm 及鏡像裝訂設定。`DEFAULT_EXPORT_SETTINGS` 保持 `technical-legacy`＋17×23＋2.54 cm，避免升級後默默改變既有輸出。

- [ ] **Step 5: 實作解析與驗證**

`resolvePageLayout` 依序執行：

1. 解析預設或自訂頁面。
2. 解析標準或鏡像邊界。
3. 將 cm 轉成 twips，使用 `Math.round(cm / 2.54 * 1440)`。
4. 計算內容寬高並扣除 gutter。
5. 驗證頁面與自訂邊界範圍。
6. 對小於 1 cm 的邊界加入警告。
7. 比較 Profile 預設，計算 `isCustomizedFromProfile`。

- [ ] **Step 6: 執行單元測試與型別檢查**

Run: `npm run test:run -- tests/docx/layout.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 7: 建立 commit**

```powershell
git add -- services/docx/layout tests/docx/layout.test.ts
git commit -m "feat(docx): add page layout and margin presets"
```

---

### Task 2: 將版面設定接入匯出狀態與操作介面

**Files:**
- Create: `components/editor/ExportSettingsModal.tsx`
- Create: `tests/ExportSettingsModal.test.tsx`
- Modify: `hooks/useDocxExport.ts`
- Modify: `hooks/useMarkdownEditor.ts`
- Modify: `components/editor/EditorHeader.tsx`
- Modify: `constants/meta.ts`
- Modify: `services/i18n.ts`

**Interfaces:**
- Consumes: `ExportSettings`、`resolvePageLayout`、Preset 常數。
- Produces: `exportSettings`、`setExportSettings`、`resolvedPageLayout`、`ExportSettingsModal`。

- [ ] **Step 1: 撰寫 Modal 行為測試**

測試必須驗證：

```ts
it('選擇窄邊界後回傳 publisher-narrow 設定', async () => {
  render(<ExportSettingsModal
    isOpen
    value={DEFAULT_EXPORT_SETTINGS}
    onClose={vi.fn()}
    onApply={onApply}
  />);

  fireEvent.change(screen.getByLabelText('文件版型'), {
    target: { value: 'publisher-narrow' },
  });
  fireEvent.click(screen.getByRole('button', { name: '套用版面設定' }));

  expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
    profileId: 'publisher-narrow',
    marginPresetId: 'narrow',
  }));
});
```

另測試：

- 自訂邊界輸入 0.8 cm 顯示列印風險。
- 無效內容寬度時「套用」按鈕停用。
- 覆寫 `publisher-exact` 時顯示頁碼不保證一致。
- 鏡像邊界顯示內側、外側及裝訂預留欄位。

- [ ] **Step 2: 確認測試失敗**

Run: `npm run test:run -- tests/ExportSettingsModal.test.tsx`

Expected: FAIL，因元件尚不存在。

- [ ] **Step 3: 改造 `useDocxExport` 狀態**

移除：

```ts
const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
```

改為：

```ts
const [exportSettings, setExportSettings] =
  useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
const resolvedPageLayout = useMemo(
  () => resolvePageLayout(exportSettings),
  [exportSettings],
);
```

`handleDownload` 必須把 `exportSettings` 傳給 `generateDocx`，不可再自行讀取 `PAGE_SIZES[selectedSizeIndex]`。

- [ ] **Step 4: 實作版面設定 Modal**

Modal 必須包含：

- Profile Select
- 紙張 Select
- 邊界 Preset Select
- 自訂寬、高
- 標準邊界或鏡像邊界欄位
- Gutter 與方向
- 有效內容區域摘要
- 警告區
- 取消與套用按鈕

邊界輸入欄位使用 `type="number"`、`step="0.01"`、`min="0.5"`、`max="5"`；裝訂預留使用 `min="0"`、`max="5"`；紙張寬高使用 `min="10"`、`max="100"`。

- [ ] **Step 5: 修改 Editor Header**

將原本單一紙張 Select 改為：

```tsx
<Button variant="secondary" onClick={() => setIsExportSettingsOpen(true)}>
  <Settings2 className="h-4 w-4" />
  {t('layout.openSettings')}
</Button>
```

按鈕旁顯示摘要，例如：

```text
17×23 cm · 平衡 2.00 cm
```

桌面與行動版都使用同一個 Modal，不複製設定狀態。

- [ ] **Step 6: 補齊中英文 i18n**

至少加入：

```ts
layout: {
  openSettings: '版面設定',
  profile: '文件版型',
  pageSize: '紙張尺寸',
  marginPreset: '頁面邊界',
  standardMargins: '一般邊界',
  mirroredMargins: '鏡像邊界',
  gutter: '裝訂預留',
  contentArea: '有效內容區域',
  apply: '套用版面設定',
  customizedWarning: '已自訂出版社版型，頁碼可能與參考稿不同。',
  printRiskWarning: '邊界小於 1 公分，部分印表機可能無法完整列印。',
}
```

英文必須提供對應文字，不得以中文作為 fallback。

- [ ] **Step 7: 執行 UI、Hook 與完整測試**

Run: `npm run test:run -- tests/ExportSettingsModal.test.tsx`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

Run: `npm run test:run`

Expected: 現有測試全部 PASS。

- [ ] **Step 8: 建立 commit**

```powershell
git add -- components/editor/ExportSettingsModal.tsx components/editor/EditorHeader.tsx hooks/useDocxExport.ts hooks/useMarkdownEditor.ts constants/meta.ts services/i18n.ts tests/ExportSettingsModal.test.tsx
git commit -m "feat(ui): add Word page and margin settings"
```

---

### Task 3: 建立出版社與 Legacy 樣式 Profile

**Files:**
- Create: `services/docx/profiles/types.ts`
- Create: `services/docx/profiles/publisher.ts`
- Create: `services/docx/profiles/legacy.ts`
- Create: `services/docx/profiles/index.ts`
- Create: `services/docx/styles.ts`
- Create: `tests/docx/styles.test.ts`
- Modify: `constants/theme.ts`

**Interfaces:**
- Consumes: `DocumentProfileId`。
- Produces: `DocumentStyleProfile`、`getDocumentProfile(id)`、`createDocumentStyles(profile)`。

- [ ] **Step 1: 撰寫 Profile Token 測試**

```ts
it('publisher-exact 使用出版社字體與段落節奏', () => {
  const profile = getDocumentProfile('publisher-exact');
  expect(profile.fonts.body).toEqual({
    ascii: 'Calibri',
    hAnsi: 'Calibri',
    eastAsia: 'Noto Sans TC',
    cs: 'Noto Sans TC',
  });
  expect(profile.paragraph.normal).toMatchObject({
    sizeHalfPoints: 22,
    beforeTwips: 0,
    afterTwips: 120,
    lineTwips: 300,
  });
  expect(profile.heading.h2.sizeHalfPoints).toBe(26);
  expect(profile.heading.h2.color).toBe('2E74B5');
});
```

另驗證：

- H1 16pt、H2 13pt、H3 12pt。
- `Code Block` 為 Consolas 9pt。
- `Callout` 為 10.5pt、`0B2545`。
- `Book Caption` 為 9pt italic、`555555`。
- exact、narrow、binding 共用同一組出版社樣式 Token。
- legacy 保留現有 `WORD_THEME`。

- [ ] **Step 2: 確認測試失敗**

Run: `npm run test:run -- tests/docx/styles.test.ts`

Expected: FAIL，因 Profile 模組尚不存在。

- [ ] **Step 3: 定義 `DocumentStyleProfile`**

型別至少包含：

```ts
export interface DocumentStyleProfile {
  id: DocumentProfileId;
  fonts: {
    body: FontFamilySet;
    code: FontFamilySet;
  };
  colors: {
    body: string;
    heading1: string;
    heading2: string;
    heading3: string;
    inlineCode: string;
    caption: string;
    calloutText: string;
  };
  paragraph: {
    normal: ParagraphStyleToken;
    code: ParagraphStyleToken;
    callout: ParagraphStyleToken;
    caption: ParagraphStyleToken;
  };
  heading: Record<'h1' | 'h2' | 'h3', HeadingStyleToken>;
  callouts: Record<CalloutKind, CalloutStyleToken>;
  table: TableStyleToken;
  image: {
    maxWidthCm: number;
    chapterOpenerWidthCm: number;
    allowedMarginIntrusionCm: number;
  };
  headerFooter: {
    distanceCm: number;
    showTitle: boolean;
    showBookAndPage: boolean;
  };
}
```

- [ ] **Step 4: 移植權威樣式數值**

數值來源：

- `D:\MySelf\LR\LeftBlueprintRightMagic-Book\scripts\publishing\build_docx.py:312-368`
- `D:\MySelf\LR\LeftBlueprintRightMagic-Book\scripts\publishing\build_docx.py:910-1098`

不得以目前網站輸出反推數值。`publisher-exact`、`publisher-narrow`、`publisher-binding` 必須只在預設幾何上不同，樣式 Token 完全相同。

- [ ] **Step 5: 產生命名樣式**

`createDocumentStyles(profile)` 必須建立：

- Normal
- Heading 1
- Heading 2
- Heading 3
- Code Block
- Callout
- Book Caption

標題樣式必須包含 `keepNext: true`、`keepLines: true` 與正確 `outlineLevel`。Builder 後續只能指定 style ID，不得重複套用相同的字型與段距。

- [ ] **Step 6: 驗證**

Run: `npm run test:run -- tests/docx/styles.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 7: 建立 commit**

```powershell
git add -- services/docx/profiles services/docx/styles.ts constants/theme.ts tests/docx/styles.test.ts
git commit -m "feat(docx): add publisher document style profiles"
```

---

### Task 4: 將新版面與命名樣式接入 DOCX Generator

**Files:**
- Create: `tests/helpers/readDocx.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `services/docx/types.ts`
- Modify: `services/docxGenerator.ts`
- Modify: `tests/docxGenerator.test.ts`

**Interfaces:**
- Consumes: `ExportSettings`、`ResolvedPageLayout`、`DocumentStyleProfile`。
- Produces: 新 `GenerateDocxOptions` 與實際可解包的 DOCX。

- [ ] **Step 1: 安裝 OOXML 測試依賴**

Run: `npm install --save-dev jszip`

Expected: `package.json` 與 `package-lock.json` 只新增 JSZip 相關差異。

- [ ] **Step 2: 建立實際 DOCX 讀取 Helper**

```ts
import JSZip from 'jszip';

export const readDocxXml = async (blob: Blob, path: string): Promise<string> => {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const entry = zip.file(path);
  if (!entry) {
    throw new Error(`DOCX 缺少必要項目：${path}`);
  }
  return entry.async('string');
};
```

另提供 `listDocxEntries(blob): Promise<string[]>`。

- [ ] **Step 3: 用實際 Packer 重寫 Generator 測試**

移除 `vi.mock('docx')`。測試必須實際執行：

```ts
const blob = await generateDocx(blocks, {
  exportSettings: {
    profileId: 'publisher-exact',
    pageSizeId: 'tech',
    marginPresetId: 'publisher-exact',
  },
  meta: { title: '技術書稿', author: '黃祈豫', header: true, footer: true },
  imageRegistry: {},
  showLineNumbers: false,
});

expect(new Uint8Array(await blob.slice(0, 2).arrayBuffer()))
  .toEqual(new Uint8Array([0x50, 0x4b]));
```

並檢查：

- `word/document.xml` 頁面為 17×23 cm。
- 四邊邊界均為 1440 twips。
- `word/styles.xml` 具有 `CodeBlock`、`Callout`、`BookCaption`。
- `word/settings.xml` 有 `w:updateFields`。
- core properties 含標題與作者。

- [ ] **Step 4: 確認舊 Generator 無法通過**

Run: `npm run test:run -- tests/docxGenerator.test.ts`

Expected: FAIL，因目前未輸出必要命名樣式與 updateFields。

- [ ] **Step 5: 改造輸入型別**

```ts
export interface GenerateDocxOptions {
  exportSettings: ExportSettings;
  showLineNumbers: boolean;
  meta?: DocumentMeta;
  imageRegistry?: Record<string, string>;
}

export interface DocxConfig {
  layout: ResolvedPageLayout;
  profile: DocumentStyleProfile;
  showLineNumbers: boolean;
  meta: DocumentMeta;
  imageRegistry: Record<string, string>;
  counters: {
    figure: number;
    qr: number;
    bookmark: number;
    listInstance: number;
  };
}
```

- [ ] **Step 6: 重構 Generator**

`generateDocx` 必須：

1. 呼叫 `resolvePageLayout(options.exportSettings)`。
2. 呼叫 `getDocumentProfile(options.exportSettings.profileId)`。
3. 建立完整 `DocxConfig`。
4. 使用 `createDocumentStyles(profile)`。
5. 在 Section 寫入 width、height、top、right、bottom、left、header、footer、gutter。
6. 設定 `features: { updateFields: true }`。
7. 頁首顯示書名；頁尾顯示 `書名 | PAGE`。
8. 保持 `technical-legacy` 原本的頁首頁尾行為。

- [ ] **Step 7: 驗證**

Run: `npm run test:run -- tests/docxGenerator.test.ts`

Expected: PASS，且測試產出的 Blob 是真實 ZIP。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 8: 建立 commit**

```powershell
git add -- package.json package-lock.json services/docx/types.ts services/docxGenerator.ts tests/helpers/readDocx.ts tests/docxGenerator.test.ts
git commit -m "refactor(docx): apply resolved layout and named styles"
```

---

### Task 5: 對齊正文、標題、行內格式與清單

**Files:**
- Create: `tests/docx/typography.test.ts`
- Modify: `services/docx/builders/common.ts`
- Modify: `services/docx/builders/heading.ts`
- Modify: `services/docx/builders/paragraph.ts`
- Modify: `services/docx/builders/index.ts`

**Interfaces:**
- Consumes: `DocxConfig.profile`、命名樣式。
- Produces: 出版社一致的 Normal、Heading、inline code、hyperlink 與 list paragraph。

- [ ] **Step 1: 撰寫真實 DOCX Typography 測試**

Fixture 內容：

```md
# 第一章
## 1.1 小節
這是**粗體**、`inlineCode()` 與[官方文件](https://example.com)。

1. 第一項
2. 第二項

- 項目甲
- 項目乙
```

測試 `document.xml` 與 `styles.xml`：

- 一般文字不直接指定 Consolas。
- inline code 為 Consolas 9.5pt、`9B1C1C`。
- H1／H2／H3 使用命名樣式。
- H1 沒有目前的黑色粗底線。
- 超連結保留 URL，不自動在文字行塞入 QR。
- 每段有明確 style ID 或合法 numbering。

- [ ] **Step 2: 確認測試失敗**

Run: `npm run test:run -- tests/docx/typography.test.ts`

Expected: FAIL，因目前一般文字直接套用 Consolas 且 H1 有底線。

- [ ] **Step 3: 重構行內 Parser**

`parseInlineStyles` 改為：

- 一般文字繼承段落樣式，不寫直接字型。
- 粗體只寫 `bold: true`。
- inline code 明確寫 profile code font、19 half-points、`9B1C1C`。
- link 使用 `ExternalHyperlink`。
- 一般 link 不產生 QR。
- legacy Profile 保留原本自動 QR 行為，直到 v2.0 決定是否移除。

- [ ] **Step 4: 重構標題與正文**

```ts
new Paragraph({
  style: level === 1 ? 'Heading1' : level === 2 ? 'Heading2' : 'Heading3',
  children: await parseInlineStyles(content, config),
});
```

正文指定 `style: 'Normal'`。不得在 Builder 重複寫 profile 已定義的段距、字型與色彩。

- [ ] **Step 5: 修正清單**

- list paragraph 使用 Normal 字型與 profile list spacing。
- 巢狀 level 0–2 保持現有縮排能力。

- [ ] **Step 6: 驗證**

Run: `npm run test:run -- tests/docx/typography.test.ts tests/markdownParser.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 7: 建立 commit**

```powershell
git add -- services/docx/builders/common.ts services/docx/builders/heading.ts services/docx/builders/paragraph.ts services/docx/builders/index.ts tests/docx/typography.test.ts
git commit -m "feat(docx): align publisher typography and lists"
```

---

### Task 6: 重建程式碼、Callout 與角色對話

**Files:**
- Create: `tests/docx/components.test.ts`
- Modify: `services/types.ts`
- Modify: `services/parser/ast.ts`
- Modify: `services/syntaxSpec.ts`
- Modify: `services/docx/builders/codeBlock.ts`
- Modify: `services/docx/builders/callout.ts`
- Modify: `services/docx/builders/chat.ts`
- Modify: `services/docx/builders/index.ts`
- Modify: `tests/markdownParser.test.ts`

**Interfaces:**
- Consumes: Profile component Token。
- Produces: `IMPORTANT`、`CAUTION` BlockType 及無假空白段落的出版元件。

- [ ] **Step 1: 擴充 Parser 測試**

```md
> [!IMPORTANT]
> 這是重要資訊。

> [!CAUTION]
> 這是風險提醒。
```

預期分別解析為 `CALLOUT_IMPORTANT`、`CALLOUT_CAUTION`。

- [ ] **Step 2: 建立 DOCX 元件測試**

必須檢查：

- Code Block 是段落而不是 Table。
- Code Block 使用 `CodeBlock` style 與 `F4F6F9` shading。
- publisher Profile 不顯示程式碼行號及語言標頭。
- TIP `EEF7F0`、NOTE `F4F6F9`、WARNING `FFF4CC`、IMPORTANT `EEF4FB`、CAUTION `FDECEC`。
- Callout 沒有四邊粗框。
- 對話框依 left／right／center 使用 dotted／dashed／double border。
- 元件後沒有純空白 spacer paragraph。

- [ ] **Step 3: 確認測試失敗**

Run: `npm run test:run -- tests/docx/components.test.ts tests/markdownParser.test.ts`

Expected: FAIL，因現有 Code Block 為 Table、Callout 為厚框且缺少兩種語法。

- [ ] **Step 4: 重建 Code Block**

每一行程式碼產生一個 `CodeBlock` paragraph：

```ts
new Paragraph({
  style: 'CodeBlock',
  children: [new TextRun({ text: line || ' ', font: config.profile.fonts.code })],
  shading: { fill: 'F4F6F9' },
  indent: { left: 230, right: 230 },
});
```

publisher Profile 忽略 `showLineNumbers`；legacy Profile 繼續使用既有 table-based renderer，以維持相容。

- [ ] **Step 5: 重建 Callout**

Callout 第一行為 label，後續內容為同一個 `Callout` style 或連續 Callout paragraphs。只使用 shading 與 0.16 inch 左右縮排；不得加入目前的 24–48 eighth-point 四邊框。

- [ ] **Step 6: 對齊對話框**

依參考規格：

- left：背景 `F2F2F2`、右縮排 1 inch、dotted。
- right：背景 `FFFFFF`、左縮排 1 inch、dashed。
- center：背景 `F8FAFC`、左右各 0.5 inch、double。
- border 色 `A6A6A6`、size 8。
- before／after 均為 20pt。

- [ ] **Step 7: 移除 Registry 假空白段落**

Code、Mermaid、Chat、Callout、Table handler 只回傳實際內容。需要留白時由命名樣式的 `spaceAfter` 控制。

- [ ] **Step 8: 驗證**

Run: `npm run test:run -- tests/docx/components.test.ts tests/markdownParser.test.ts tests/syntaxSpec.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 9: 建立 commit**

```powershell
git add -- services/types.ts services/parser/ast.ts services/syntaxSpec.ts services/docx/builders/codeBlock.ts services/docx/builders/callout.ts services/docx/builders/chat.ts services/docx/builders/index.ts tests/docx/components.test.ts tests/markdownParser.test.ts
git commit -m "feat(docx): rebuild publisher code callouts and dialogue"
```

---

### Task 7: 建立可隨邊界縮放的固定表格幾何

**Files:**
- Create: `services/docx/builders/tableGeometry.ts`
- Create: `tests/docx/table.test.ts`
- Modify: `services/docx/builders/table.ts`
- Modify: `services/docx/builders/index.ts`

**Interfaces:**
- Consumes: `ResolvedPageLayout.content.widthTwips`。
- Produces: `columnWidthsFor(rows, contentWidthTwips)` 與固定 Table。

- [ ] **Step 1: 撰寫欄寬演算法測試**

```ts
it('兩欄短標籤使用出版社比例並填滿內容寬度', () => {
  const widths = columnWidthsFor(
    [['方法', '說明'], ['GET', '取得資料']],
    6638,
  );
  expect(widths).toEqual([1700, 4938]);
  expect(widths.reduce((sum, width) => sum + width, 0)).toBe(6638);
});

it('窄邊界按相同比例放大欄寬', () => {
  const widths = columnWidthsFor(
    [['方法', '說明'], ['GET', '取得資料']],
    8078,
  );
  expect(widths.reduce((sum, width) => sum + width, 0)).toBe(8078);
  expect(widths[0] / 8078).toBeCloseTo(1700 / 6638, 4);
});
```

另測試 2、3、4、6 欄及最後一欄吸收 rounding 差值。

- [ ] **Step 2: 撰寫 OOXML Table 測試**

檢查：

- `w:tblW` 為 `dxa`。
- `w:tblInd` 為 120。
- `w:tblLayout` 為 `fixed`。
- `w:tblGrid` 與各 `w:tcW` 一致。
- 第一列有 `w:tblHeader`。
- 第一列填色 `E8EEF5`。
- 儲存格 margin：上／下 80、start／end 120。
- Table 後沒有額外空段落。

- [ ] **Step 3: 確認測試失敗**

Run: `npm run test:run -- tests/docx/table.test.ts`

Expected: FAIL，因現有表格使用百分比與平均欄寬。

- [ ] **Step 4: 移植欄寬規則**

來源：`build_docx.py:1174-1197`。

- 1 欄：100%。
- 2 欄且第一欄最大文字長度 ≤ 8：以 1700／6638 比例縮放。
- 2 欄其他情況：以 2700／6638 比例縮放。
- 3 欄：權重 2160／3600／3600。
- 4 欄：權重 1600／2500／2500／2760。
- 5 欄以上：平均，最後一欄吸收誤差。

- [ ] **Step 5: 使用 docx 固定表格 API**

`Table` 必須設定：

```ts
{
  width: { size: contentWidthTwips, type: WidthType.DXA },
  columnWidths,
  layout: TableLayoutType.FIXED,
  indent: { size: 120, type: WidthType.DXA },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
}
```

第一個 `TableRow` 設 `tableHeader: true`，所有 cell 設明確 DXA width。

- [ ] **Step 6: 驗證**

Run: `npm run test:run -- tests/docx/table.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 7: 建立 commit**

```powershell
git add -- services/docx/builders/table.ts services/docx/builders/tableGeometry.ts services/docx/builders/index.ts tests/docx/table.test.ts
git commit -m "feat(docx): add responsive fixed table geometry"
```

---

### Task 8: 對齊圖片、QR 與 Mermaid 媒體封裝

**Files:**
- Create: `services/docx/builders/qr.ts`
- Modify: `services/types.ts`
- Modify: `services/parser/ast.ts`
- Modify: `services/syntaxSpec.ts`
- Modify: `services/docx/builders/common.ts`
- Modify: `services/docx/builders/image.ts`
- Modify: `services/docx/builders/mermaid.ts`
- Modify: `services/docx/builders/index.ts`
- Modify: `tests/docx/components.test.ts`
- Modify: `tests/markdownParser.publisher.test.ts`

**Interfaces:**
- Produces: 獨立 QR 語法 `[QR:標籤](URL)` 與 `BlockType.QR`。
- Consumes: Profile 圖片寬度與 `imageRegistry`。

- [ ] **Step 1: 撰寫 QR Parser 測試**

```ts
const blocks = parseMarkdown('[QR:GitHub 原始碼](https://github.com/example/repo)');
expect(blocks).toEqual([
  expect.objectContaining({
    type: BlockType.QR,
    content: 'GitHub 原始碼',
    metadata: {
      url: 'https://github.com/example/repo',
      label: 'GitHub 原始碼',
    },
  }),
]);
```

只有獨占一行且 label 以 `QR:` 開頭的連結才轉成 QR；普通 Markdown link 保持 hyperlink。

- [ ] **Step 2: 撰寫媒體封裝測試**

檢查實際 ZIP：

- `word/media/` 只有 `.png`、`.jpeg`、`.jpg` 或 `.gif`。
- `[Content_Types].xml` 為所有媒體副檔名宣告 MIME。
- 不存在 `.undefined`。
- `document.xml` 的圖片具有 `descr` 與 `title`。
- QR 寬高為 2.6 cm、置中，後面有紅色 label hyperlink。
- Mermaid 走同一個圖片尺寸與 alt/title 流程。

- [ ] **Step 3: 確認測試失敗**

Run: `npm run test:run -- tests/markdownParser.publisher.test.ts tests/docx/components.test.ts`

Expected: FAIL，因目前所有 hyperlink 都可能產生 inline QR，且圖片缺少完整替代資訊。

- [ ] **Step 4: 實作獨立 QR Builder**

輸出順序：

1. 2.6 cm 置中 PNG。
2. 9pt、`9B1C1C`、置中 label。
3. label 本身是 ExternalHyperlink。
4. QR 失敗時保留可點擊連結並產生 export warning，不讓整份 Word 失敗。

- [ ] **Step 5: 修正圖片尺寸與替代文字**

一般圖片寬度：

```ts
Math.min(
  config.profile.image.maxWidthCm,
  config.layout.content.widthCm
    + config.profile.image.allowedMarginIntrusionCm * 2,
)
```

`publisher-exact` 的 `maxWidthCm` 為 13、`allowedMarginIntrusionCm` 為 0.55；章首頁固定 9.8 cm。Caption 使用 `BookCaption` style。

- [ ] **Step 6: 統一媒體型別判斷**

依 data URL MIME 或 magic bytes 決定 `png`／`jpeg`／`gif`，不能從可能缺失的檔名 extension 推導。未知格式必須在匯出前報錯，不得建立 `.undefined` 項目。

- [ ] **Step 7: 驗證**

Run: `npm run test:run -- tests/markdownParser.publisher.test.ts tests/docx/components.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 8: 建立 commit**

```powershell
git add -- services/types.ts services/parser/ast.ts services/syntaxSpec.ts services/docx/builders/qr.ts services/docx/builders/common.ts services/docx/builders/image.ts services/docx/builders/mermaid.ts services/docx/builders/index.ts tests/markdownParser.publisher.test.ts tests/docx/components.test.ts
git commit -m "feat(docx): add publisher images QR and media validation"
```

---

### Task 9: 加入章首頁、動態目錄、書籤與清單重啟

**Files:**
- Create: `services/docx/builders/chapter.ts`
- Modify: `services/types.ts`
- Modify: `services/parser/ast.ts`
- Modify: `services/syntaxSpec.ts`
- Modify: `components/editor/editorCommands.ts`
- Modify: `services/docx/builders/toc.ts`
- Modify: `services/docx/builders/heading.ts`
- Modify: `services/docx/builders/index.ts`
- Modify: `services/docxGenerator.ts`
- Modify: `tests/markdownParser.publisher.test.ts`
- Modify: `tests/docx/components.test.ts`
- Modify: `tests/docxGenerator.test.ts`

**Interfaces:**
- Produces: `ChapterMetadata`、`BlockType.CHAPTER_OPENER`、Word TOC field 與穩定 bookmark ID。
- Consumes: `imageRegistry`、Profile、numbering instance counter。

- [ ] **Step 1: 定義並測試章首頁語法**

公開語法固定為：

```md
[CHAPTER]
number: "02"
part: "第一部：心法與準備"
title: "工具箱"
englishTitle: "Developer Toolbox"
summary: "建立能開發、能復原，也能保護機密的工作環境。"
image: "toolbox-cover"
goals:
  - "完成基礎開發環境與 AI 工具設定。"
  - "使用 Git、GitHub 與知識庫保存專案脈絡。"
[/CHAPTER]
```

區塊內容使用既有 `js-yaml` 解析。缺少 `number` 或 `title` 時輸出明確 ValidationIssue。

- [ ] **Step 2: 撰寫 DOCX 結構測試**

檢查：

- 章首頁前只有一個 page break，不產生空白頁。
- part 9pt teal。
- number 34pt dark navy。
- title 22pt navy。
- englishTitle 9.5pt italic blue。
- summary 10.5pt。
- 圖片 9.8 cm。
- goals 有固定標題與 bullet list。
- `[TOC]` 產生 Word TOC field，不再依賴手填頁碼。
- `settings.xml` 要求開啟時更新欄位。
- Heading bookmark ID 只含英數、底線，且整份文件唯一。
- 分離的 ordered list 都從 1 開始。

- [ ] **Step 3: 確認測試失敗**

Run: `npm run test:run -- tests/markdownParser.publisher.test.ts tests/docx/components.test.ts tests/docxGenerator.test.ts`

Expected: FAIL，因現有 Parser 與 Builder 沒有章首頁及動態 TOC。

- [ ] **Step 4: 實作章首頁 Parser 與 Builder**

Parser 將 YAML 轉成：

```ts
interface ChapterMetadata {
  number: string;
  part?: string;
  title: string;
  englishTitle?: string;
  summary?: string;
  image?: string;
  goals: string[];
}
```

Builder 依 `build_docx.py:770-862` 的順序與樣式輸出。

- [ ] **Step 5: 改造 TOC**

- publisher Profile：使用 `TableOfContents`，heading range 1–3，開啟 hyperlink。
- legacy Profile：保留目前手動目錄行為。
- `[TOC]` 後的手填目錄列在 publisher Profile 顯示 warning，避免重複內容。

- [ ] **Step 6: 建立 Heading Bookmark**

Bookmark ID 格式：

```text
h{level}_{normalized_slug}_{sequence}
```

中文標題 slug 無英數時使用 `heading_{sequence}`。禁止用 Python hash 或執行期隨機值。

- [ ] **Step 7: 修正 Numbering Instance**

Parser post-processing 為每一組相鄰 ordered list 指派 `listInstance`；Builder 使用：

```ts
numbering: {
  reference: 'default-numbering',
  level,
  instance: block.metadata.listInstance,
}
```

- [ ] **Step 8: 驗證**

Run: `npm run test:run -- tests/markdownParser.publisher.test.ts tests/docx/components.test.ts tests/docxGenerator.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 9: 建立 commit**

```powershell
git add -- services/types.ts services/parser/ast.ts services/syntaxSpec.ts components/editor/editorCommands.ts services/docx/builders/chapter.ts services/docx/builders/toc.ts services/docx/builders/heading.ts services/docx/builders/index.ts services/docxGenerator.ts tests/markdownParser.publisher.test.ts tests/docx/components.test.ts tests/docxGenerator.test.ts
git commit -m "feat(docx): add chapter openers bookmarks and dynamic TOC"
```

---

### Task 10: 讓網站預覽共用版面與 Profile

**Files:**
- Create: `tests/PreviewPane.layout.test.tsx`
- Modify: `components/editor/PreviewPane.tsx`
- Modify: `components/editor/PreviewRenderers.tsx`
- Modify: `hooks/useMarkdownEditor.ts`

**Interfaces:**
- Consumes: `resolvedPageLayout`、`DocumentStyleProfile`。
- Produces: 與匯出設定同步的頁面比例、內距及元件色彩預覽。

- [ ] **Step 1: 撰寫 Preview 測試**

檢查：

```ts
expect(page).toHaveAttribute('data-page-size', '17x23');
expect(page).toHaveAttribute('data-margin-preset', 'narrow');
expect(page.style.aspectRatio).toBe('17 / 23');
expect(page.style.getPropertyValue('--page-margin-left')).toBe('1.27cm');
expect(page.style.getPropertyValue('--publisher-heading-1')).toBe('#2E74B5');
```

另驗證切換 `publisher-exact` 與 `publisher-narrow` 時，內容相同但頁面 padding 改變。

- [ ] **Step 2: 確認測試失敗**

Run: `npm run test:run -- tests/PreviewPane.layout.test.tsx`

Expected: FAIL，因 Preview 尚未接收版面設定。

- [ ] **Step 3: 傳遞 resolved layout**

`useMarkdownEditor` 對 Context 公開：

```ts
exportSettings,
setExportSettings,
resolvedPageLayout,
documentProfile,
```

Preview 不自行解析 Preset，避免 Word 與畫面使用不同規則。

- [ ] **Step 4: 套用 CSS Variables**

至少輸出：

- page width／height ratio
- top／right／bottom／left margin
- body、heading、caption、callout colors
- body、code font family
- table header background

Preview 只追求相同比例與設計語言；頁碼與 Word 精確換行仍以實際 DOCX 渲染驗收。

- [ ] **Step 5: 對齊元件外觀**

移除 Preview 中與 publisher Profile 衝突的粗 Callout border、H1 黑底線及過大 spacing。legacy Profile 繼續顯示既有外觀。

- [ ] **Step 6: 驗證**

Run: `npm run test:run -- tests/PreviewPane.layout.test.tsx`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 7: 建立 commit**

```powershell
git add -- components/editor/PreviewPane.tsx components/editor/PreviewRenderers.tsx hooks/useMarkdownEditor.ts tests/PreviewPane.layout.test.tsx
git commit -m "feat(preview): synchronize publisher layout and styles"
```

---

### Task 11: 建立 OOXML 後處理與匯出品質預檢

**Files:**
- Create: `services/docx/postprocess.ts`
- Create: `services/docx/quality.ts`
- Create: `tests/docx/package.test.ts`
- Modify: `services/docxGenerator.ts`
- Modify: `services/exportValidation.ts`
- Modify: `hooks/useDocxExport.ts`
- Modify: `tests/exportValidation.test.ts`

**Interfaces:**
- Produces: `postProcessDocx(blob, config)`、`inspectDocxPackage(blob)`。
- Consumes: JSZip、`ResolvedPageLayout`。

- [ ] **Step 1: 撰寫鏡像與封裝測試**

`publisher-binding` 產出的 `settings.xml` 必須包含：

```xml
<w:mirrorMargins/>
```

`document.xml` 的 `w:pgMar` 必須有 gutter 283 twips（0.50 cm 四捨五入）。

`inspectDocxPackage` 必須對以下情況回傳 fatal issue：

- 缺少 `[Content_Types].xml`
- 缺少 `word/document.xml`
- 媒體副檔名沒有 MIME
- Relationship 指向不存在的檔案
- 圖片副檔名為 `.undefined`

- [ ] **Step 2: 擴充匯出前版面驗證測試**

`validateExport` 新增：

- margin < 1 cm：warning
- content width < 8 cm：error
- content height < 10 cm：error
- publisher-exact 被覆寫：warning
- chapter image key 不存在：error
- QR URL 不是 http／https：error

- [ ] **Step 3: 確認測試失敗**

Run: `npm run test:run -- tests/docx/package.test.ts tests/exportValidation.test.ts`

Expected: FAIL，因缺少後處理與版面驗證。

- [ ] **Step 4: 實作 `postProcessDocx`**

用 JSZip 解包，使用 `DOMParser`／`XMLSerializer` 修改 `word/settings.xml`：

```ts
const mirrorMargins = xml.createElementNS(
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  'w:mirrorMargins',
);
settings.appendChild(mirrorMargins);
```

只有 `layout.margins.mode === 'mirrored'` 時加入；重複執行不得產生第二個節點。

- [ ] **Step 5: 實作封裝檢查**

`inspectDocxPackage` 回傳：

```ts
interface DocxQualityIssue {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  entry?: string;
}
```

`generateDocx` 在 Packer 後依序執行 `postProcessDocx`、`inspectDocxPackage`。有 error 時丟出 `DocxQualityError`，由 UI 顯示繁體中文訊息。

- [ ] **Step 6: 驗證**

Run: `npm run test:run -- tests/docx/package.test.ts tests/exportValidation.test.ts`

Expected: PASS。

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 7: 建立 commit**

```powershell
git add -- services/docx/postprocess.ts services/docx/quality.ts services/docxGenerator.ts services/exportValidation.ts hooks/useDocxExport.ts tests/docx/package.test.ts tests/exportValidation.test.ts
git commit -m "feat(docx): validate and post-process OOXML packages"
```

---

### Task 12: 建立公開 Golden Fixture 與實際渲染回歸

**Files:**
- Create: `tests/fixtures/publisher-manuscript.md`
- Create: `scripts/qa/generate-publisher-fixture.ts`
- Create: `scripts/qa/render-docx.ps1`
- Create: `scripts/qa/compare-render.mjs`
- Create: `tests/visual/baseline/README.md`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/DEVELOPMENT_GUIDE.md`

**Interfaces:**
- Produces: `npm run qa:fixture`、`npm run qa:render`、`npm run qa:compare`。
- Consumes: 公開 Fixture、LibreOffice、Poppler。

- [ ] **Step 1: 安裝 QA script 依賴**

Run:

```powershell
npm install --save-dev tsx pixelmatch pngjs
```

Expected: lockfile 只出現指定套件與其相依項目。

- [ ] **Step 2: 建立涵蓋所有元件的公開 Fixture**

Fixture 必須包含：

- Frontmatter
- `[TOC]`
- 章首頁
- H1／H2／H3
- 一般文字、粗體、inline code、hyperlink
- ordered／unordered list
- 5 種 Callout
- left／right／center dialogue
- 1–6 欄表格
- code fence
- 測試產生 PNG
- 明確 QR
- Mermaid

內容使用「星圖工坊」虛構專案，不使用《左手藍圖，右手魔法》的正文或插圖。

- [ ] **Step 3: 建立 Fixture 產生器**

`generate-publisher-fixture.ts`：

1. 讀取 UTF-8 Markdown。
2. 用現有 Parser 產生 blocks。
3. 產生小型測試 PNG 並註冊 image key。
4. 使用 `publisher-exact` 匯出。
5. 寫入 `artifacts/docx-qa/publisher-fixture.docx`。

輸出路徑不存在時建立；不得清空或遞迴刪除既有資料夾。

- [ ] **Step 4: 建立安全 PowerShell 渲染腳本**

腳本必須：

- 從 `SOFFICE_PATH` 讀取 LibreOffice 路徑。
- 從 `PDFTOPPM_PATH` 讀取 Poppler 路徑。
- 驗證兩個明確檔案存在。
- 為每次執行建立新的 timestamp 子目錄。
- 使用獨立 LibreOffice UserInstallation URI。
- 轉成 PDF，再以 110 DPI 轉成 PNG。
- 不執行任何刪除命令。

- [ ] **Step 5: 建立 PNG 比較**

`compare-render.mjs` 逐張比較相同檔名，將 mismatch ratio 寫入 JSON。任何指定頁超過 `0.015` 時 exit code 1；尺寸不同直接失敗。

初始 baseline 必須在以下固定環境產生：

- Windows 11
- LibreOffice 26.2.4.2
- Noto Sans TC 已安裝
- 110 DPI

腳本只有收到 `--update-baseline` 時才能覆寫 `tests/visual/baseline/*.png`；正常比較模式不得修改 baseline。

- [ ] **Step 6: 加入 npm scripts**

```json
{
  "qa:fixture": "tsx scripts/qa/generate-publisher-fixture.ts",
  "qa:render": "powershell -ExecutionPolicy Bypass -File scripts/qa/render-docx.ps1",
  "qa:baseline": "node scripts/qa/compare-render.mjs --update-baseline",
  "qa:compare": "node scripts/qa/compare-render.mjs"
}
```

`npm run verify` 維持 typecheck、tests、build；渲染依賴桌面軟體，不加入每次一般 CI。

- [ ] **Step 7: 建立 baseline 與驗證**

Run:

```powershell
npm run qa:fixture
npm run qa:render
npm run qa:baseline
npm run qa:compare
```

Expected:

- DOCX、PDF 與 PNG 都產生。
- 執行者人工檢查初始 PNG，確認所有元件符合出版社設計後才執行 `qa:baseline`。
- Word／LibreOffice 沒有修復提示。
- 所有指定頁 mismatch ratio ≤ 1.5%。

- [ ] **Step 8: 執行完整驗證**

Run: `npm run verify`

Expected: typecheck、30 個既有測試加新增測試、production build 全部 PASS。

- [ ] **Step 9: 建立 commit**

```powershell
git add -- tests/fixtures tests/visual scripts/qa .gitignore package.json package-lock.json docs/DEVELOPMENT_GUIDE.md
git commit -m "test(docx): add publisher render regression workflow"
```

---

### Task 13: 完成文件、公開範例、私有實稿驗收與版本發佈準備

**Files:**
- Create: `docs/PUBLISHER_PROFILE.md`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DEVELOPMENT_GUIDE.md`
- Modify: `docs/AI_GENERATION_GUIDE.md`
- Modify: `constants/defaultContent.ts`
- Modify: `services/aiPrompt.ts`
- Replace: `samples/範例Word.docx`
- Modify: `package.json`

**Interfaces:**
- Consumes: 所有前置 Task。
- Produces: 可公開說明、可重現範例、完整實稿驗收紀錄與發佈候選版本。

- [ ] **Step 1: 撰寫出版社版型文件**

`docs/PUBLISHER_PROFILE.md` 必須明確說明：

- 四種 Profile 差異。
- 紙張與邊界 Preset。
- 自訂邊界限制。
- 鏡像邊界與 gutter。
- exact 與 narrow 不可能同時保持相同頁碼。
- `[CHAPTER]`、`[TOC]`、`[QR:標籤](URL)`、5 種 Callout 語法。
- Noto Sans TC 安裝與字型替代風險。
- Word 更新目錄方式。
- Word 365／LibreOffice 渲染差異。

- [ ] **Step 2: 更新架構與 AI 指南**

`ARCHITECTURE.md` 加入：

```text
Markdown → ParsedBlock → Layout/Profile → DOCX Builders
→ Packer → OOXML Post-process → Package Inspection → Download
```

AI 指南必須要求 AI 只對重要連結使用明確 QR 語法，不能把所有 hyperlink 都轉 QR。

- [ ] **Step 3: 更新預設內容**

繁中與英文範例都必須展示：

- 出版版型說明
- 章首頁
- 5 種 Callout
- 三方向對話
- 固定表格
- 明確 QR

範例不能引用私有書稿內容。

- [ ] **Step 4: 取代失效 Sample**

用 `npm run qa:fixture` 產生新 DOCX，確認：

- 不存在 `.undefined` media。
- Word 365 與 LibreOffice 都不要求修復。
- 封裝檢查零 error。

只取代明確檔案 `samples/範例Word.docx`；不得批次刪除 samples 目錄。

- [ ] **Step 5: 私有完整書稿驗收**

在不提交檔案的本機 QA 目錄執行：

1. 以出版社參考產生器輸出完整書稿。
2. 以 MD2DOC `publisher-exact` 對同一份內容輸出。
3. 比較 page size、margins、styles、tables、media、fields。
4. 兩份都渲染成 PNG。
5. 檢查封面、目錄、每個章首頁、第一個 code、第一個 callout、第一個 dialogue、每種欄數表格及最後一頁。
6. 將差異分類為：內容差異、Word renderer 差異、MD2DOC defect。
7. 所有 MD2DOC defect 修正後重新跑完整流程。

完成標準：

- `publisher-exact` 幾何與樣式結構一致。
- Word 365 零修復提示。
- 無未知媒體、斷裂 relationship 或缺失圖片。
- 目錄可更新。
- 表格跨頁時表頭重複。
- 章首頁不產生多餘空白頁。

- [ ] **Step 6: 驗證窄版與裝訂版**

對同一份公開 Fixture 分別產生：

- `publisher-narrow`
- `publisher-binding`

確認 narrow 的內容寬度 14.46 cm；binding 在奇偶頁正確交換內外側邊界，且 gutter 生效。這兩種版本不要求與 exact 頁碼一致。

- [ ] **Step 7: 執行 Release Gate**

Run:

```powershell
npm run verify
npm run qa:fixture
npm run qa:render
npm run qa:compare
git status --short
```

Expected:

- 所有命令 PASS。
- Git 只包含本計畫範圍內變更。
- 不包含完整私人書稿、出版社圖片或暫存渲染檔。

- [ ] **Step 8: 制定版本策略**

- 若保持 `technical-legacy` 為預設：發佈 `v1.5.0`。
- 若要把出版社版型改成預設：另外準備 `v2.0.0` migration note，不在本次直接切換。
- Release note 明確列出紙張、邊界、裝訂、出版社版型、OOXML QA 與新語法。

本計畫採第一種策略，因此在 release candidate commit 將 `package.json` 版本更新為 `1.5.0`。

- [ ] **Step 9: 建立 commit**

```powershell
git add -- README.md docs/PUBLISHER_PROFILE.md docs/ARCHITECTURE.md docs/DEVELOPMENT_GUIDE.md docs/AI_GENERATION_GUIDE.md constants/defaultContent.ts services/aiPrompt.ts samples/範例Word.docx package.json
git commit -m "docs: publish the MD2DOC publisher workflow"
```

不得 push；等待使用者要求發佈。

---

## 最終自我檢查

執行者在宣告完成前逐項確認：

- [ ] 紙張與邊界可獨立選擇。
- [ ] 常見邊界、出版社 exact、narrow、binding 都有 Preset。
- [ ] 自訂邊界有範圍、內容區域與列印風險驗證。
- [ ] 所有 Builder 使用 `DocxConfig.layout` 與 `DocxConfig.profile`，沒有新的版面魔術數字。
- [ ] exact／narrow／binding 共用出版社樣式 Token。
- [ ] Normal、Heading、Code Block、Callout、Book Caption 是真正 Word 命名樣式。
- [ ] Table 使用固定 DXA 幾何並隨內容寬度縮放。
- [ ] Normal link 不再自動產生 QR；只有明確 QR 語法產生獨立區塊。
- [ ] 圖片具有 alt/title，沒有 `.undefined` media。
- [ ] TOC、bookmark、updateFields 與 list restart 有真實 OOXML 測試。
- [ ] registry 不再加入假空白段落。
- [ ] Preview 與 DOCX 共用同一份版面與 Profile。
- [ ] Word 365 與 LibreOffice 不要求修復文件。
- [ ] 公開 Fixture 不含私人書稿內容。
- [ ] `npm run verify` 通過。
- [ ] QA 渲染比較通過。
- [ ] Git diff 沒有無關變更。
- [ ] 尚未 push。

## 建議執行方式

本計畫有 13 個依賴明確的 Task。建議使用 `superpowers:subagent-driven-development`，每個 Task 由新的執行者完成，主執行者在 commit 前做規格與程式品質兩階段審查。若不使用 subagent，則使用 `superpowers:executing-plans`，每完成 2–3 個 Task 停下來做一次整合驗證。
