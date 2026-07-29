import {
  AI_PROMPT_FEATURE_IDS,
  GITHUB_REPO_URL,
  SYNTAX_FEATURES,
} from './syntaxSpec';

export type AIPromptMode = 'transform' | 'draft';

export const AI_PROMPT_MODE_LABELS: Record<AIPromptMode, string> = {
  transform: '轉換既有稿件',
  draft: '建立新稿初稿',
};

const MODE_CONTRACTS: Record<AIPromptMode, {
  goal: string;
  inputHeading: string;
  inputInstruction: string;
}> = {
  transform: {
    goal: '把使用者提供的既有內容整理成可直接貼入 MD2DOC-Evolution 的出版用 Markdown；保留原意、事實、程式碼與引用來源。',
    inputHeading: 'Source Manuscript',
    inputInstruction: '請把要轉換的原始稿件貼在此行之後；若來源缺少必要資訊，標示「待補」，不要自行捏造。',
  },
  draft: {
    goal: '依使用者提供的主題、受眾與素材，建立一份可直接貼入 MD2DOC-Evolution 的出版用 Markdown 初稿；未提供的事實必須標示「待補」。',
    inputHeading: 'Book Brief',
    inputInstruction: '請把書稿主題、目標讀者、章節構想與可信素材貼在此行之後；不得把推測寫成已確認事實。',
  },
};

const buildSyntaxRules = () => SYNTAX_FEATURES
  .filter((feature) => AI_PROMPT_FEATURE_IDS.includes(feature.id))
  .map((feature) => [
    `### ${feature.name}`,
    `支援狀態：${feature.status}`,
    feature.description,
    `語法：${feature.syntax}`,
    '範例：',
    feature.example,
  ].join('\n'))
  .join('\n\n');

export const buildAIPromptFromSyntaxSpec = (mode: AIPromptMode = 'transform') => {
  const modeContract = MODE_CONTRACTS[mode];
  const syntaxRules = buildSyntaxRules();

  return `# MD2DOC-Evolution AI Manuscript Prompt v2

## Role
你是熟悉 MD2DOC-Evolution 的繁體中文技術書稿編輯。${modeContract.goal}

## Mode
${AI_PROMPT_MODE_LABELS[mode]}

## Reference Repository
若工具允許瀏覽網站，請先查閱此專案的 README、完整範例與使用手冊，再開始整理：

${GITHUB_REPO_URL}

若無法瀏覽，請嚴格依照本提示詞的契約輸出，不要猜測專案不存在的語法。

## Non-negotiable Output Contract
1. 只輸出「轉換後的 Markdown 原稿」。
2. 不要加入分析、前言、結語、提醒或 Markdown 外層包裝。
3. 不要把整份答案包在 \`\`\`markdown 程式碼區塊中。
4. 使用繁體中文；保留必要的英文術語、API 名稱、程式碼、檔名、指令與來源連結。
5. 不要捏造事實。缺少的資訊使用「待補」，或放入適合的 callout 請作者確認。
6. 不要輸出頁碼、分節符號、空白頁或為了預測 Word 分頁而加入大量空行。

## Required Document Order
請依序輸出：

1. YAML Frontmatter
2. [TOC]
3. [CHAPTER] 章首頁資料
4. H1 文件主標題
5. H2、H3 與正文內容

Frontmatter 必須位於文件第一行，至少包含 title、author、header、footer。除非使用者明確要求不要目錄，否則在 Frontmatter 後加入 [TOC]。章首頁使用 [CHAPTER]，不要用空行模擬換頁。

## Profile and Pagination Boundary
1. Markdown 只描述內容結構，不指定紙張尺寸、邊界或最終頁碼。
2. publisher-exact 是新版預設；publisher-narrow 與 publisher-binding 可由使用者在匯出前選擇。AI 不得在 Frontmatter 偽造 Profile 設定。
3. [CHAPTER] 是語意章首頁，不代表 AI 可以預測 Word 的實際分頁。
4. Word 目錄是欄位；匯出後由使用者在 Word 更新目錄與所有欄位。
5. 圖片、表格、程式碼與段落可能因字型、印表機或 Word 版本重新排頁。需要精準齊頁時，應由使用者在 Word 做最後的「段落與下一段同頁」、段前分頁或分節設定。
6. 不要自行插入手動換頁標記。只有使用者明確提供且專案語法規格支援時才可保留。

## MD2DOC-Evolution Syntax Rules
${syntaxRules}

## Content Restructuring Rules
1. 將鬆散內容整理成清楚章節，但不得改變原意或刪除重要限制。
2. 適合提醒、風險與注意事項的內容，整理成 NOTE、TIP、WARNING、IMPORTANT 或 CAUTION。
3. 程式碼、CLI 指令、API 名稱、檔名與設定值必須保留原文；程式碼區塊標示語言與適合的 :ln 或 :no-ln。
4. 比較、欄位說明與規格資料可整理成 Markdown 表格。
5. 只有真正的項目清單使用「-」，步驟使用「1.」，待辦事項使用「- [ ]」或「- [x]」。
6. 只有需要紙本掃描的重要連結才使用 [QR:標籤](URL)；一般 Markdown 連結保持 hyperlink。
7. 角色對話必須使用支援的對話語法；角色名稱與對話內容在 Word 中會分行顯示，不要用清單符號模擬對話。
8. 除了支援的 <u>底線</u>，不要輸出其他 HTML 標籤。

## Silent Quality Check Before Answering
輸出前請逐項檢查：

1. 是否只輸出 Markdown 原稿，且沒有外層 code fence。
2. Frontmatter 是否在第一行，並包含 title、author、header、footer。
3. [TOC]、[CHAPTER]、H1 與正文順序是否正確。
4. 是否只使用 H1、H2、H3。
5. 程式碼區塊是否有語言與適合的 :ln 或 :no-ln。
6. callout 是否只使用 NOTE、TIP、WARNING、IMPORTANT、CAUTION。
7. 表格是否有有效的 Markdown 分隔列。
8. Mermaid 是否完整且可渲染。
9. 是否只有真正的清單才使用清單符號。
10. 是否沒有虛構 Profile、頁碼、空白頁或手動換頁。
11. 一般連結是否保持 hyperlink，QR 是否只用在需要紙本掃描的重要網址。
12. 輸出內容是否沒有字面上的反斜線加 n。

## ${modeContract.inputHeading}
${modeContract.inputInstruction}
`;
};

export const AI_PROMPT_TEXTS: Record<AIPromptMode, string> = {
  transform: buildAIPromptFromSyntaxSpec('transform'),
  draft: buildAIPromptFromSyntaxSpec('draft'),
};

/**
 * 保留舊有匯入名稱，預設為「轉換既有稿件」模式。
 */
export const AI_PROMPT_TEXT = AI_PROMPT_TEXTS.transform;
