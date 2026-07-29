import { Blob as NodeBlob } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inspectPublisherDocx,
  PUBLISHER_ACCEPTANCE_PROFILES,
  type PublisherAcceptanceResult,
} from '../../services/docx/acceptance';
import { generatePublisherFixture } from './generate-publisher-fixture';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..');
const DEFAULT_FIXTURE_PATH = path.join(
  REPOSITORY_ROOT,
  'content',
  'examples',
  'complete.zh.md',
);
const DEFAULT_ARTIFACT_ROOT = path.join(
  REPOSITORY_ROOT,
  'artifacts',
  'docx-qa',
  'acceptance',
);
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const argumentValue = (name: string): string | undefined => {
  const argumentIndex = process.argv.indexOf(name);
  if (argumentIndex < 0) {
    return undefined;
  }
  const value = process.argv[argumentIndex + 1]?.trim();
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} 必須指定值。`);
  }
  return value;
};

interface AcceptanceProfileOutput {
  documentPath: string;
  result: PublisherAcceptanceResult;
}

interface PublishingAcceptanceReport {
  generatedAt: string;
  sourceMarkdown: string;
  status: 'passed' | 'failed';
  profiles: AcceptanceProfileOutput[];
}

const toMarkdownReport = (report: PublishingAcceptanceReport): string => {
  const lines = [
    '# MD2DOC 出版級驗收報告',
    '',
    `- 產生時間：${report.generatedAt}`,
    `- 完整範例：${report.sourceMarkdown}`,
    `- 總結果：${report.status === 'passed' ? '通過' : '失敗'}`,
    '',
    '| 版型 | DOCX | 結果 | 媒體 | TOC | 書籤 | 真正清單 | 待辦清單 |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...report.profiles.map(({ documentPath, result }) => [
      `| ${result.profileId}`,
      path.basename(documentPath),
      result.status === 'passed' ? '通過' : '失敗',
      result.metrics.mediaCount,
      result.metrics.tocFieldCount,
      result.metrics.bookmarkPairCount,
      result.metrics.bulletParagraphCount,
      `${result.metrics.taskParagraphCount} |`,
    ].join(' | ')),
    '',
  ];

  for (const { documentPath, result } of report.profiles) {
    lines.push(
      `## ${result.profileId}`,
      '',
      `文件：${documentPath}`,
      '',
      ...result.checks.map((check) =>
        `- ${check.passed ? '通過' : '失敗'}｜${check.label}：${check.detail}`
      ),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
};

export const runPublishingAcceptance = async (
  fixturePath = DEFAULT_FIXTURE_PATH,
  artifactRoot = DEFAULT_ARTIFACT_ROOT,
): Promise<PublishingAcceptanceReport> => {
  const resolvedFixturePath = path.resolve(fixturePath);
  const resolvedArtifactRoot = path.resolve(artifactRoot);
  await mkdir(resolvedArtifactRoot, { recursive: true });

  const profiles: AcceptanceProfileOutput[] = [];
  for (const profile of PUBLISHER_ACCEPTANCE_PROFILES) {
    const documentPath = path.join(
      resolvedArtifactRoot,
      `md2doc-${profile.fileStem}.docx`,
    );
    await generatePublisherFixture({
      fixturePath: resolvedFixturePath,
      artifactRoot: resolvedArtifactRoot,
      outputPath: documentPath,
      exportSettings: profile.exportSettings,
    });
    const bytes = await readFile(documentPath);
    const result = await inspectPublisherDocx(
      new NodeBlob([bytes], { type: DOCX_MIME_TYPE }) as Blob,
      profile,
      {
        expectedBulletTexts: [
          '檢查北方定位刻度',
          '記錄觀測時間',
          '確認星圖紙張編號',
        ],
        expectedTaskTexts: [
          '待確認出版社換頁',
          '已完成紙張與邊界設定',
        ],
        minimumMediaCount: 3,
      },
    );
    profiles.push({ documentPath, result });
  }

  const report: PublishingAcceptanceReport = {
    generatedAt: new Date().toISOString(),
    sourceMarkdown: resolvedFixturePath,
    status: profiles.every(({ result }) => result.status === 'passed')
      ? 'passed'
      : 'failed',
    profiles,
  };
  const jsonPath = path.join(resolvedArtifactRoot, 'acceptance-report.json');
  const markdownPath = path.join(
    resolvedArtifactRoot,
    'acceptance-report.md',
  );
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    writeFile(markdownPath, toMarkdownReport(report), 'utf8'),
  ]);

  console.log(`出版級驗收：${report.status}`);
  console.log(`JSON 報告：${jsonPath}`);
  console.log(`Markdown 報告：${markdownPath}`);
  if (report.status === 'failed') {
    process.exitCode = 1;
  }
  return report;
};

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runPublishingAcceptance(
    argumentValue('--fixture'),
    argumentValue('--artifact-root'),
  ).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
