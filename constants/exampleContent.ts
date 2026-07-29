import completeEn from '../content/examples/complete.en.md?raw';
import completeZh from '../content/examples/complete.zh.md?raw';
import quickEn from '../content/examples/quick.en.md?raw';
import quickZh from '../content/examples/quick.zh.md?raw';

export type ExampleLanguage = 'zh' | 'en';
export type ExampleKind = 'quick' | 'complete';
export type ExampleManuscriptId =
  | 'quick-zh'
  | 'complete-zh'
  | 'quick-en'
  | 'complete-en';

export interface ExampleManuscript {
  id: ExampleManuscriptId;
  language: ExampleLanguage;
  kind: ExampleKind;
  label: string;
  description: string;
  content: string;
}

export const EXAMPLE_MANUSCRIPTS: ExampleManuscript[] = [
  {
    id: 'quick-zh',
    language: 'zh',
    kind: 'quick',
    label: '中文快速範例',
    description: '以短篇出版稿快速體驗常用版型與語法。',
    content: quickZh,
  },
  {
    id: 'complete-zh',
    language: 'zh',
    kind: 'complete',
    label: '中文完整功能稿',
    description: '涵蓋 Parser、Preview 與 DOCX 的完整出版級範例。',
    content: completeZh,
  },
  {
    id: 'quick-en',
    language: 'en',
    kind: 'quick',
    label: 'English quick example',
    description: 'A concise publishing manuscript for the essential workflow.',
    content: quickEn,
  },
  {
    id: 'complete-en',
    language: 'en',
    kind: 'complete',
    label: 'English complete manuscript',
    description: 'A complete publishing example covering Parser, Preview, and DOCX.',
    content: completeEn,
  },
];

const EXAMPLES_BY_ID = new Map(
  EXAMPLE_MANUSCRIPTS.map((example) => [example.id, example]),
);

export const getExampleManuscript = (
  id: ExampleManuscriptId,
): ExampleManuscript => {
  const example = EXAMPLES_BY_ID.get(id);
  if (!example) {
    throw new Error(`找不到範例稿件：${id}`);
  }
  return example;
};

export const getDefaultExampleId = (
  language: string,
): ExampleManuscriptId => language.startsWith('zh') ? 'quick-zh' : 'quick-en';
