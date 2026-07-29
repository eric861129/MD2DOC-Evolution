import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Word 365 出版驗收自動化契約', () => {
  it('主程序以隔離 worker、明確逾時與程序清理執行每份文件', async () => {
    const script = await readFile(path.resolve(
      process.cwd(),
      'scripts',
      'qa',
      'export-word-pdf.ps1',
    ), 'utf8');

    expect(script).toContain('word-worker.ps1');
    expect(script).toContain('WaitForExit');
    expect(script).toContain('Stop-Process');
    expect(script).toContain('WordProcessIdPath');
  });

  it('worker 先更新欄位與匯出 PDF，再讀取段落格式', async () => {
    const script = await readFile(path.resolve(
      process.cwd(),
      'scripts',
      'qa',
      'word-worker.ps1',
    ), 'utf8');

    const updateIndex = script.indexOf('Update-DocumentFields');
    const exportIndex = script.indexOf('ExportAsFixedFormat');
    const inspectIndex = script.indexOf('WORD_STAGE inspect');

    expect(updateIndex).toBeGreaterThanOrEqual(0);
    expect(exportIndex).toBeGreaterThan(updateIndex);
    expect(inspectIndex).toBeGreaterThan(exportIndex);
  });
});
