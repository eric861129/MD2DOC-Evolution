import { GITHUB_REPO_URL } from '../constants/project';

export type SyntaxFeatureId =
  | 'frontmatter'
  | 'toc'
  | 'heading'
  | 'list'
  | 'quote'
  | 'divider'
  | 'code-block'
  | 'mermaid'
  | 'callout'
  | 'table'
  | 'chat'
  | 'image'
  | 'link'
  | 'inline-formatting';

export interface SyntaxFeature {
  id: SyntaxFeatureId;
  name: string;
  description: string;
  syntax: string;
  example: string;
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
    syntax: '---\\ntitle: 書稿標題\\nauthor: 作者\\nheader: true\\nfooter: true\\n---',
    example: '---\ntitle: 技術書稿\nauthor: Eric\nheader: true\nfooter: true\n---',
  },
  {
    id: 'toc',
    name: 'Table of contents',
    description: '使用 [TOC] 產生 Word 目錄標記，可接手動目錄列。',
    syntax: '[TOC]',
    example: '[TOC]\n- 第一章 1',
  },
  {
    id: 'heading',
    name: 'Headings',
    description: '只使用 H1、H2、H3，H1 作為文件主標題。',
    syntax: '# / ## / ###',
    example: '# 文件主標題\n## 章節\n### 小節',
  },
  {
    id: 'list',
    name: 'Lists',
    description: '支援項目清單、編號清單與待辦清單。',
    syntax: '- item / 1. item / - [ ] task',
    example: '- 重點項目\n1. 第一個步驟\n- [ ] 待辦事項',
  },
  {
    id: 'quote',
    name: 'Quote',
    description: '一般引用段落。',
    syntax: '> quote',
    example: '> 這是一段引用。',
  },
  {
    id: 'divider',
    name: 'Horizontal rule',
    description: '使用三個 dash 插入水平分隔線。',
    syntax: '---',
    example: '---',
  },
  {
    id: 'code-block',
    name: 'Code block',
    description: '技術書稿程式碼區塊，支援 :ln 與 :no-ln 控制行號。',
    syntax: '```typescript:ln / ```json:no-ln',
    example: '```typescript:ln\nconst version = "1.4.2";\n```',
  },
  {
    id: 'mermaid',
    name: 'Mermaid',
    description: '使用 mermaid code fence 建立圖表，Preview 與 DOCX 匯出會渲染為圖。',
    syntax: '```mermaid',
    example: '```mermaid\ngraph TD;\n  A-->B;\n```',
  },
  {
    id: 'callout',
    name: 'Callout',
    description: '支援 NOTE、TIP、WARNING 三種提示區塊。',
    syntax: '> [!NOTE] / > [!TIP] / > [!WARNING]',
    example: '> [!NOTE]\n> 這裡輸入提醒內容',
  },
  {
    id: 'table',
    name: 'Table',
    description: '使用 GitHub Flavored Markdown 表格語法。',
    syntax: '| Header | Header |\\n| :--- | :--- |',
    example: '| 欄位 1 | 欄位 2 |\n| :--- | :--- |\n| 內容 1 | 內容 2 |',
  },
  {
    id: 'chat',
    name: 'Dialogue',
    description: '支援左側、右側與置中對話框，適合 AI/使用者對話稿。',
    syntax: 'User ":: / AI ::" / System :":',
    example: 'User ":: 這裡輸入對話內容\nAI ::" 這裡輸入回覆內容\nSystem :": 這裡輸入系統訊息',
  },
  {
    id: 'image',
    name: 'Image',
    description: '支援 Markdown 圖片語法，匯出時會優先使用已登錄的本機圖片。',
    syntax: '![alt](url-or-image-id)',
    example: '![圖片說明](image-id)',
  },
  {
    id: 'link',
    name: 'Link',
    description: '支援 Markdown 連結，DOCX 匯出可搭配 QR code 視覺提示。',
    syntax: '[text](url)',
    example: '[MD2DOC-Evolution](https://github.com/eric861129/MD2DOC-Evolution)',
  },
  {
    id: 'inline-formatting',
    name: 'Inline formatting',
    description: '支援粗體、斜體、底線、inline code、快捷鍵與 UI 標示。',
    syntax: '**bold** / *italic* / <u>underline</u> / `code` / [Ctrl]',
    example: '**重點**、*術語*、<u>底線</u>、`npm run build`、[Ctrl]',
  },
];

export const SYNTAX_COMMANDS: SyntaxCommandSpec[] = [
  { id: 'h1', featureId: 'heading', label: 'Heading 1', description: '建立大型章節標題', insertText: '# ', group: 'Basic', quickAction: true },
  { id: 'h2', featureId: 'heading', label: 'Heading 2', description: '建立段落層級標題', insertText: '## ', group: 'Basic', quickAction: true },
  { id: 'h3', featureId: 'heading', label: 'Heading 3', description: '建立小節標題', insertText: '### ', group: 'Basic', quickAction: true },
  { id: 'bullet-list', featureId: 'list', label: 'Bullet list', description: '插入項目清單', insertText: '- ', group: 'List' },
  { id: 'numbered-list', featureId: 'list', label: 'Numbered list', description: '插入編號清單', insertText: '1. ', group: 'List' },
  { id: 'todo-list', featureId: 'list', label: 'Task list', description: '插入待辦清單', insertText: '- [ ] ', group: 'List' },
  { id: 'quote', featureId: 'quote', label: 'Quote', description: '插入引用段落', insertText: '> ', group: 'Basic' },
  { id: 'divider', featureId: 'divider', label: 'Divider', description: '插入水平分隔線', insertText: '---\n', group: 'Basic' },
  { id: 'toc', featureId: 'toc', label: 'Table of contents', description: '插入 Word 目錄標記', insertText: '[TOC]\n', group: 'Basic', quickAction: true },
  { id: 'callout-note', featureId: 'callout', label: 'Note', description: '插入 NOTE 提示區塊', insertText: '> [!NOTE]\n> 這裡輸入提醒內容', group: 'Callout', quickAction: true },
  { id: 'callout-tip', featureId: 'callout', label: 'Tip', description: '插入 TIP 提示區塊', insertText: '> [!TIP]\n> 這裡輸入提示內容', group: 'Callout', quickAction: true },
  { id: 'callout-warning', featureId: 'callout', label: 'Warning', description: '插入 WARNING 提示區塊', insertText: '> [!WARNING]\n> 這裡輸入警告內容', group: 'Callout', quickAction: true },
  { id: 'code-block', featureId: 'code-block', label: 'Code block', description: '插入程式碼區塊與行號設定', insertText: '```typescript:ln\n// 程式碼貼在這裡\n```', cursorOffset: -4, group: 'Technical', quickAction: true },
  { id: 'mermaid', featureId: 'mermaid', label: 'Mermaid chart', description: '插入 Mermaid 圖表', insertText: '```mermaid\ngraph TD;\n  A-->B;\n```', group: 'Technical', quickAction: true },
  { id: 'table', featureId: 'table', label: 'Table', description: '插入 Markdown 表格', insertText: '| 欄位 1 | 欄位 2 |\n| :--- | :--- |\n| 內容 1 | 內容 2 |', group: 'Technical', quickAction: true },
  { id: 'chat-left', featureId: 'chat', label: 'User dialogue', description: '插入左側對話泡泡', insertText: 'User ":: 這裡輸入對話內容', group: 'Chat', quickAction: true },
  { id: 'chat-right', featureId: 'chat', label: 'AI dialogue', description: '插入右側對話泡泡', insertText: 'AI ::" 這裡輸入對話內容', group: 'Chat', quickAction: true },
  { id: 'chat-center', featureId: 'chat', label: 'System dialogue', description: '插入置中對話泡泡', insertText: 'System :": 這裡輸入系統訊息', group: 'Chat' },
  { id: 'image', featureId: 'image', label: 'Image', description: '插入圖片語法', insertText: '![圖片說明](url)', group: 'Media' },
  { id: 'frontmatter', featureId: 'frontmatter', label: 'Frontmatter', description: '插入文件 metadata', insertText: '---\ntitle: 書稿標題\nauthor: 作者名稱\nheader: true\nfooter: true\n---\n', group: 'Metadata', quickAction: true },
  { id: 'quick-mermaid', featureId: 'mermaid', label: 'Quick mermaid', description: '插入流程圖範例', insertText: '```mermaid\ngraph TD;\n  開始-->撰寫\n  撰寫-->匯出\n```', group: 'Technical' },
];

export const QUICK_ACTION_IDS = [
  'h1',
  'h2',
  'h3',
  'frontmatter',
  'code-block',
  'mermaid',
  'callout-tip',
  'callout-note',
  'callout-warning',
  'chat-left',
  'chat-right',
  'table',
  'toc',
];

export const CORE_SYNTAX_FEATURE_IDS: SyntaxFeatureId[] = [
  'frontmatter',
  'toc',
  'heading',
  'code-block',
  'mermaid',
  'callout',
  'table',
  'chat',
  'image',
  'link',
];

export const getSyntaxFeature = (id: SyntaxFeatureId) =>
  SYNTAX_FEATURES.find((feature) => feature.id === id);

export { GITHUB_REPO_URL };
