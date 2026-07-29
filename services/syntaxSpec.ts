import { GITHUB_REPO_URL } from '../constants/project';

export type SyntaxFeatureId =
  | 'frontmatter'
  | 'chapter'
  | 'toc'
  | 'heading'
  | 'list'
  | 'task-list'
  | 'quote'
  | 'divider'
  | 'code-block'
  | 'mermaid'
  | 'callout'
  | 'table'
  | 'chat'
  | 'image'
  | 'qr'
  | 'link'
  | 'inline-formatting';

export type SyntaxSupportStatus = 'supported' | 'experimental' | 'legacy';

export interface SyntaxFeatureCoverage {
  slashCommand: boolean;
  quickAction: boolean;
  aiPrompt: boolean;
  quickExample: boolean;
  completeExample: boolean;
  readme: boolean;
  userGuide: boolean;
}

export interface SyntaxFeature {
  id: SyntaxFeatureId;
  name: string;
  description: string;
  syntax: string;
  example: string;
  status: SyntaxSupportStatus;
  coverage: SyntaxFeatureCoverage;
}

export interface SyntaxCommandSpec {
  id: string;
  featureId: SyntaxFeatureId;
  label: string;
  description: string;
  insertText: string;
  group: string;
  cursorOffset?: number;
  quickAction?: boolean;
}

export const SYNTAX_FEATURES: SyntaxFeature[] = [
  {
    id: 'frontmatter',
    name: 'YAML Frontmatter',
    description: '文件最前方的 metadata，建議包含 title、author、header、footer。',
    syntax: '---\ntitle: 書稿標題\nauthor: 作者\nheader: true\nfooter: true\n---',
    example: '---\ntitle: 技術書稿\nauthor: Eric\nheader: true\nfooter: true\n---',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'toc',
    name: 'Table of contents',
    description: 'Publisher Profile 使用 Word 原生目錄欄位；legacy Profile 才保留 [TOC] 後的手動目錄列。',
    syntax: '[TOC]',
    example: '[TOC]\n- 第一章 1',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'chapter',
    name: 'Chapter opener',
    description: '使用 YAML 定義章號、標題、摘要、圖片與本章完成目標。',
    syntax: '[CHAPTER]\nnumber: "01"\ntitle: "章節標題"\ngoals:\n  - "本章目標"\n[/CHAPTER]',
    example: [
      '[CHAPTER]',
      'number: "01"',
      'part: "第一部：準備"',
      'title: "章節標題"',
      'englishTitle: "Chapter Title"',
      'summary: "本章摘要。"',
      'image: "chapter-cover"',
      'goals:',
      '  - "完成本章目標。"',
      '[/CHAPTER]',
    ].join('\n'),
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'heading',
    name: 'Headings',
    description: '只使用 H1、H2、H3，H1 作為文件主標題。',
    syntax: '# / ## / ###',
    example: '# 文件主標題\n## 章節\n### 小節',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'list',
    name: 'Lists',
    description: '支援項目清單與編號清單；只有真正的清單才會在 DOCX 產生項目符號或編號。',
    syntax: '- item / 1. item',
    example: '- 重點項目\n1. 第一個步驟',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: false,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'task-list',
    name: 'Task list',
    description: '語法目前屬於實驗功能；正式支援將保留未完成與已完成狀態，且不與一般項目清單混為一談。',
    syntax: '- [ ] task / - [x] done',
    example: '- [ ] 待確認項目\n- [x] 已完成項目',
    status: 'experimental',
    coverage: {
      slashCommand: true,
      quickAction: false,
      aiPrompt: false,
      quickExample: false,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'quote',
    name: 'Quote',
    description: '一般引用段落。',
    syntax: '> quote',
    example: '> 這是一段引用。',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: false,
      aiPrompt: true,
      quickExample: false,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'divider',
    name: 'Horizontal rule',
    description: '使用三個 dash 插入水平分隔線。',
    syntax: '---',
    example: '---',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: false,
      aiPrompt: true,
      quickExample: false,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'code-block',
    name: 'Code block',
    description: '技術書稿程式碼區塊，支援 :ln 與 :no-ln 控制行號。',
    syntax: '```typescript:ln / ```json:no-ln',
    example: '```typescript:ln\nconst version = "1.4.2";\n```',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'mermaid',
    name: 'Mermaid',
    description: '使用 mermaid code fence 建立圖表，Preview 與 DOCX 匯出會渲染為圖。',
    syntax: '```mermaid',
    example: '```mermaid\ngraph TD;\n  A-->B;\n```',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: false,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'callout',
    name: 'Callout',
    description: '支援 NOTE、TIP、WARNING、IMPORTANT、CAUTION 五種提示區塊。',
    syntax: '> [!NOTE] / > [!TIP] / > [!WARNING] / > [!IMPORTANT] / > [!CAUTION]',
    example: '> [!NOTE]\n> 這裡輸入提醒內容',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'table',
    name: 'Table',
    description: '使用 GitHub Flavored Markdown 表格語法。',
    syntax: '| Header | Header |\n| :--- | :--- |',
    example: '| 欄位 1 | 欄位 2 |\n| :--- | :--- |\n| 內容 1 | 內容 2 |',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: false,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'chat',
    name: 'Dialogue',
    description: '支援左側、右側與置中對話框，適合 AI/使用者對話稿。',
    syntax: 'User ":: / AI ::" / System :":',
    example: 'User ":: 這裡輸入對話內容\nAI ::" 這裡輸入回覆內容\nSystem :": 這裡輸入系統訊息',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: true,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'image',
    name: 'Image',
    description: '支援 Markdown 圖片語法，匯出時會優先使用已登錄的本機圖片。',
    syntax: '![alt](url-or-image-id)',
    example: '![圖片說明](image-id)',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: false,
      aiPrompt: true,
      quickExample: false,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'qr',
    name: 'QR Code',
    description: '獨占一行的 QR 連結會在 DOCX 中產生 QR Code 與可點擊標籤。',
    syntax: '[QR:標籤](url)',
    example: '[QR:GitHub 原始碼](https://github.com/example/repo)',
    status: 'supported',
    coverage: {
      slashCommand: true,
      quickAction: false,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'link',
    name: 'Link',
    description: '一般 Markdown 連結在 DOCX 中保持可點擊 hyperlink。',
    syntax: '[text](url)',
    example: '[MD2DOC-Evolution](https://github.com/eric861129/MD2DOC-Evolution)',
    status: 'supported',
    coverage: {
      slashCommand: false,
      quickAction: false,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
  {
    id: 'inline-formatting',
    name: 'Inline formatting',
    description: '支援粗體、斜體、底線、inline code、快捷鍵與 UI 標示。',
    syntax: '**bold** / *italic* / <u>underline</u> / `code` / [Ctrl]',
    example: '**重點**、*術語*、<u>底線</u>、`npm run build`、[Ctrl]',
    status: 'supported',
    coverage: {
      slashCommand: false,
      quickAction: false,
      aiPrompt: true,
      quickExample: true,
      completeExample: true,
      readme: true,
      userGuide: true,
    },
  },
];

export const SYNTAX_COMMANDS: SyntaxCommandSpec[] = [
  { id: 'h1', featureId: 'heading', label: 'Heading 1', description: '建立大型章節標題', insertText: '# ', group: 'Basic', quickAction: true },
  { id: 'h2', featureId: 'heading', label: 'Heading 2', description: '建立段落層級標題', insertText: '## ', group: 'Basic', quickAction: true },
  { id: 'h3', featureId: 'heading', label: 'Heading 3', description: '建立小節標題', insertText: '### ', group: 'Basic', quickAction: true },
  { id: 'bullet-list', featureId: 'list', label: 'Bullet list', description: '插入項目清單', insertText: '- ', group: 'List' },
  { id: 'numbered-list', featureId: 'list', label: 'Numbered list', description: '插入編號清單', insertText: '1. ', group: 'List' },
  { id: 'todo-list', featureId: 'task-list', label: 'Task list', description: '插入待辦清單', insertText: '- [ ] ', group: 'List' },
  { id: 'quote', featureId: 'quote', label: 'Quote', description: '插入引用段落', insertText: '> ', group: 'Basic' },
  { id: 'divider', featureId: 'divider', label: 'Divider', description: '插入水平分隔線', insertText: '---\n', group: 'Basic' },
  { id: 'toc', featureId: 'toc', label: 'Table of contents', description: '插入 Word 目錄標記', insertText: '[TOC]\n', group: 'Basic', quickAction: true },
  {
    id: 'chapter',
    featureId: 'chapter',
    label: 'Chapter opener',
    description: '插入章首頁 YAML',
    insertText: [
      '[CHAPTER]',
      'number: "01"',
      'part: "第一部：準備"',
      'title: "章節標題"',
      'englishTitle: "Chapter Title"',
      'summary: "本章摘要。"',
      'image: "chapter-cover"',
      'goals:',
      '  - "完成本章目標。"',
      '[/CHAPTER]',
    ].join('\n'),
    group: 'Basic',
    quickAction: true,
  },
  { id: 'callout-note', featureId: 'callout', label: 'Note', description: '插入 NOTE 提示區塊', insertText: '> [!NOTE]\n> 這裡輸入提醒內容', group: 'Callout', quickAction: true },
  { id: 'callout-tip', featureId: 'callout', label: 'Tip', description: '插入 TIP 提示區塊', insertText: '> [!TIP]\n> 這裡輸入提示內容', group: 'Callout', quickAction: true },
  { id: 'callout-warning', featureId: 'callout', label: 'Warning', description: '插入 WARNING 提示區塊', insertText: '> [!WARNING]\n> 這裡輸入警告內容', group: 'Callout', quickAction: true },
  { id: 'callout-important', featureId: 'callout', label: 'Important', description: '插入 IMPORTANT 重要資訊區塊', insertText: '> [!IMPORTANT]\n> 這裡輸入重要資訊', group: 'Callout', quickAction: true },
  { id: 'callout-caution', featureId: 'callout', label: 'Caution', description: '插入 CAUTION 風險提醒區塊', insertText: '> [!CAUTION]\n> 這裡輸入風險提醒', group: 'Callout', quickAction: true },
  { id: 'code-block', featureId: 'code-block', label: 'Code block', description: '插入程式碼區塊與行號設定', insertText: '```typescript:ln\n// 程式碼貼在這裡\n```', cursorOffset: -4, group: 'Technical', quickAction: true },
  { id: 'mermaid', featureId: 'mermaid', label: 'Mermaid chart', description: '插入 Mermaid 圖表', insertText: '```mermaid\ngraph TD;\n  A-->B;\n```', group: 'Technical', quickAction: true },
  { id: 'table', featureId: 'table', label: 'Table', description: '插入 Markdown 表格', insertText: '| 欄位 1 | 欄位 2 |\n| :--- | :--- |\n| 內容 1 | 內容 2 |', group: 'Technical', quickAction: true },
  { id: 'chat-left', featureId: 'chat', label: 'User dialogue', description: '插入左側對話泡泡', insertText: 'User ":: 這裡輸入對話內容', group: 'Chat', quickAction: true },
  { id: 'chat-right', featureId: 'chat', label: 'AI dialogue', description: '插入右側對話泡泡', insertText: 'AI ::" 這裡輸入對話內容', group: 'Chat', quickAction: true },
  { id: 'chat-center', featureId: 'chat', label: 'System dialogue', description: '插入置中對話泡泡', insertText: 'System :": 這裡輸入系統訊息', group: 'Chat' },
  { id: 'image', featureId: 'image', label: 'Image', description: '插入圖片語法', insertText: '![圖片說明](url)', group: 'Media' },
  { id: 'qr', featureId: 'qr', label: 'QR code', description: '插入獨立 QR 連結', insertText: '[QR:連結標籤](https://example.com)', group: 'Media' },
  { id: 'frontmatter', featureId: 'frontmatter', label: 'Frontmatter', description: '插入文件 metadata', insertText: '---\ntitle: 書稿標題\nauthor: 作者名稱\nheader: true\nfooter: true\n---\n', group: 'Metadata', quickAction: true },
  { id: 'quick-mermaid', featureId: 'mermaid', label: 'Quick mermaid', description: '插入流程圖範例', insertText: '```mermaid\ngraph TD;\n  開始-->撰寫\n  撰寫-->匯出\n```', group: 'Technical' },
];

export const QUICK_ACTION_IDS = SYNTAX_COMMANDS
  .filter(({ quickAction }) => quickAction)
  .map(({ id }) => id);

export const AI_PROMPT_FEATURE_IDS: SyntaxFeatureId[] = SYNTAX_FEATURES
  .filter(({ coverage }) => coverage.aiPrompt)
  .map(({ id }) => id);

/**
 * @deprecated 改用由語法覆蓋矩陣衍生的 AI_PROMPT_FEATURE_IDS。
 */
export const CORE_SYNTAX_FEATURE_IDS = AI_PROMPT_FEATURE_IDS;

export const getSyntaxFeature = (id: SyntaxFeatureId) =>
  SYNTAX_FEATURES.find((feature) => feature.id === id);

export { GITHUB_REPO_URL };
