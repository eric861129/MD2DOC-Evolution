import { createRequire } from 'node:module';
import {
  mkdtemp,
  mkdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseCliArgs,
  runRenderComparison,
} from '../../scripts/qa/compare-render.mjs';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const createWorkspace = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'md2doc-render-qa-'));
  const baselineDirectory = path.join(root, 'baseline');
  const renderDirectory = path.join(root, 'render');
  await mkdir(baselineDirectory);
  await mkdir(renderDirectory);
  return {
    baselineDirectory,
    renderDirectory,
    resultsPath: path.join(renderDirectory, 'comparison.json'),
  };
};

const writePng = async (
  filePath,
  width,
  height,
  rgba = [255, 255, 255, 255],
) => {
  const png = new PNG({ width, height });
  for (let offset = 0; offset < png.data.length; offset += 4) {
    png.data[offset] = rgba[0];
    png.data[offset + 1] = rgba[1];
    png.data[offset + 2] = rgba[2];
    png.data[offset + 3] = rgba[3];
  }
  await writeFile(filePath, PNG.sync.write(png));
};

describe('DOCX render comparison', () => {
  it('只接受明確支援的 CLI 參數', () => {
    expect(parseCliArgs([])).toEqual({ updateBaseline: false });
    expect(parseCliArgs(['--update-baseline'])).toEqual({
      updateBaseline: true,
    });
    expect(() => parseCliArgs(['--unknown'])).toThrow(/不支援的參數/);
    expect(() => parseCliArgs([
      '--update-baseline',
      '--update-baseline',
    ])).toThrow(/不得重複/);
  });

  it('更新 baseline 時逐檔新增或覆寫，且不刪除舊頁', async () => {
    const workspace = await createWorkspace();
    const currentPage = path.join(workspace.renderDirectory, 'page-1.png');
    const stalePage = path.join(workspace.baselineDirectory, 'page-old.png');
    await writePng(currentPage, 2, 2, [20, 40, 60, 255]);
    await writePng(stalePage, 1, 1, [255, 0, 0, 255]);

    const result = await runRenderComparison({
      ...workspace,
      updateBaseline: true,
    });

    expect(result.mode).toBe('update-baseline');
    expect(result.updatedFiles).toEqual(['page-1.png']);
    expect(await readFile(
      path.join(workspace.baselineDirectory, 'page-1.png'),
    )).toEqual(await readFile(currentPage));
    expect((await stat(stalePage)).isFile()).toBe(true);
  });

  it('一般比較對相同頁輸出 mismatch ratio，且 baseline 保持唯讀', async () => {
    const workspace = await createWorkspace();
    const baselinePage = path.join(
      workspace.baselineDirectory,
      'page-1.png',
    );
    const renderPage = path.join(workspace.renderDirectory, 'page-1.png');
    await writePng(baselinePage, 4, 4, [20, 40, 60, 255]);
    await writePng(renderPage, 4, 4, [20, 40, 60, 255]);
    const baselineBefore = await readFile(baselinePage);
    const baselineModifiedBefore = (await stat(baselinePage)).mtimeMs;

    const result = await runRenderComparison({
      ...workspace,
      updateBaseline: false,
    });

    expect(result.passed).toBe(true);
    expect(result.pages).toEqual([
      expect.objectContaining({
        fileName: 'page-1.png',
        mismatchPixels: 0,
        mismatchRatio: 0,
        width: 4,
        height: 4,
      }),
    ]);
    expect(JSON.parse(
      await readFile(workspace.resultsPath, 'utf8'),
    )).toMatchObject({
      passed: true,
      threshold: 0.015,
    });
    expect(await readFile(baselinePage)).toEqual(baselineBefore);
    expect((await stat(baselinePage)).mtimeMs).toBe(baselineModifiedBefore);
  });

  it('頁面超過 1.5% mismatch 時寫入 ratio JSON 並回報失敗', async () => {
    const workspace = await createWorkspace();
    await writePng(
      path.join(workspace.baselineDirectory, 'page-1.png'),
      10,
      10,
      [255, 255, 255, 255],
    );
    await writePng(
      path.join(workspace.renderDirectory, 'page-1.png'),
      10,
      10,
      [0, 0, 0, 255],
    );

    await expect(runRenderComparison({
      ...workspace,
      updateBaseline: false,
    })).rejects.toThrow(/mismatch ratio/);

    const result = JSON.parse(
      await readFile(workspace.resultsPath, 'utf8'),
    );
    expect(result.passed).toBe(false);
    expect(result.pages[0].mismatchRatio).toBe(1);
  });

  it('拒絕缺少 baseline、頁名集合不同與圖片尺寸不同', async () => {
    const missingBaseline = await createWorkspace();
    await writePng(
      path.join(missingBaseline.renderDirectory, 'page-1.png'),
      2,
      2,
    );
    await expect(runRenderComparison({
      ...missingBaseline,
      updateBaseline: false,
    })).rejects.toThrow(/baseline 不存在/);

    const pageSetMismatch = await createWorkspace();
    await writePng(
      path.join(pageSetMismatch.baselineDirectory, 'page-1.png'),
      2,
      2,
    );
    await writePng(
      path.join(pageSetMismatch.renderDirectory, 'page-2.png'),
      2,
      2,
    );
    await expect(runRenderComparison({
      ...pageSetMismatch,
      updateBaseline: false,
    })).rejects.toThrow(/檔名集合不一致/);

    const dimensionsMismatch = await createWorkspace();
    await writePng(
      path.join(dimensionsMismatch.baselineDirectory, 'page-1.png'),
      2,
      2,
    );
    await writePng(
      path.join(dimensionsMismatch.renderDirectory, 'page-1.png'),
      3,
      2,
    );
    await expect(runRenderComparison({
      ...dimensionsMismatch,
      updateBaseline: false,
    })).rejects.toThrow(/尺寸不一致/);
  });
});
