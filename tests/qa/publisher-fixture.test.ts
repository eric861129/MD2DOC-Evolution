import { spawn } from 'node:child_process';
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../services/markdownParser';
import { BlockType } from '../../services/types';

const fixturePath = path.resolve(
  process.cwd(),
  'content',
  'examples',
  'complete.zh.md',
);

const runQaFixture = (
  fixture: string,
  artifactRoot: string,
): Promise<{ code: number | null; stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) {
      reject(new Error('測試程序缺少 npm_execpath，無法執行 qa:fixture。'));
      return;
    }
    const child = spawn(process.execPath, [
      npmCli,
      'run',
      'qa:fixture',
      '--',
      '--fixture',
      fixture,
      '--artifact-root',
      artifactRoot,
    ], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.once('error', reject);
    child.once('exit', (code) => resolve({ code, stdout, stderr }));
  });

const listFiles = async (directory: string): Promise<string[]> => {
  const files: string[] = [];
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }
  return files;
};

describe('出版社公開 Golden Fixture', () => {
  it('以星圖工坊虛構內容涵蓋所有出版社元件', async () => {
    const markdown = await readFile(fixturePath, 'utf8');
    const { blocks, meta } = parseMarkdown(markdown);
    const blockTypes = blocks.map((block) => block.type);

    expect(markdown).toContain('星圖工坊');
    expect(markdown).not.toContain('左手藍圖');
    expect(meta).toMatchObject({
      title: '星圖工坊：觀測站建置手冊',
      author: '星圖工坊編輯室',
      header: true,
      footer: true,
    });
    expect(blockTypes).toEqual(expect.arrayContaining([
      BlockType.TOC,
      BlockType.CHAPTER_OPENER,
      BlockType.HEADING_1,
      BlockType.HEADING_2,
      BlockType.HEADING_3,
      BlockType.PARAGRAPH,
      BlockType.BULLET_LIST,
      BlockType.NUMBERED_LIST,
      BlockType.CALLOUT_NOTE,
      BlockType.CALLOUT_TIP,
      BlockType.CALLOUT_WARNING,
      BlockType.CALLOUT_IMPORTANT,
      BlockType.CALLOUT_CAUTION,
      BlockType.CHAT_CUSTOM,
      BlockType.TABLE,
      BlockType.CODE_BLOCK,
      BlockType.QR,
      BlockType.MERMAID,
    ]));
    expect(
      blocks
        .filter(({ type }) => type === BlockType.CHAT_CUSTOM)
        .map(({ alignment }) => alignment),
    ).toEqual(['left', 'right', 'center']);
    expect(
      blocks
        .filter(({ type }) => type === BlockType.TABLE)
        .map(({ tableRows }) => tableRows?.[0]?.length),
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(blocks).toContainEqual(expect.objectContaining({
      type: BlockType.IMAGE,
      content: 'fixture-generated-image',
      metadata: {
        alt: '星圖工坊觀測面板',
        title: '星圖工坊測試圖片',
      },
    }));
    expect(
      blocks.find(({ type }) => type === BlockType.QR),
    ).toMatchObject({
      content: '星圖工坊公開頁面',
      metadata: {
        label: '星圖工坊公開頁面',
        url: 'https://example.com/starmap-workshop',
      },
    });
  });

  it('invalid Mermaid 讓 qa:fixture 非零結束且不產生 PNG 或 DOCX', async () => {
    const runId = `${Date.now()}-${process.pid}`;
    const artifactRoot = path.resolve(
      process.cwd(),
      'artifacts',
      'docx-qa',
      'negative-tests',
      runId,
    );
    const invalidFixturePath = path.join(
      artifactRoot,
      'invalid-mermaid.md',
    );
    await mkdir(artifactRoot, { recursive: true });
    await writeFile(
      invalidFixturePath,
      [
        '```mermaid',
        'graph TD',
        '  A[未關閉',
        '```',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = await runQaFixture(invalidFixturePath, artifactRoot);
    const generatedFiles = await listFiles(artifactRoot);
    const generatedMermaidPng = generatedFiles.filter(
      (file) => path.basename(file).toLowerCase() === 'mermaid.png',
    );
    const generatedDocx = path.join(
      artifactRoot,
      'publisher-fixture.docx',
    );

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('Mermaid 瀏覽器渲染失敗');
    expect(generatedMermaidPng).toEqual([]);
    expect(generatedFiles).not.toContain(generatedDocx);
  }, 30_000);
});
