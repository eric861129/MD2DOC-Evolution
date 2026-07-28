import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const MISMATCH_THRESHOLD = 0.015;
const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..');
const ARTIFACT_ROOT = path.join(REPOSITORY_ROOT, 'artifacts', 'docx-qa');
const DEFAULT_BASELINE_DIRECTORY = path.join(
  REPOSITORY_ROOT,
  'tests',
  'visual',
  'baseline',
);
const LATEST_RENDER_MANIFEST = path.join(
  ARTIFACT_ROOT,
  'latest-render.json',
);

const naturalFileNameOrder = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});

const listPngFiles = async (directory) => {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) =>
        entry.isFile() && entry.name.toLowerCase().endsWith('.png')
      )
      .map((entry) => entry.name)
      .sort(naturalFileNameOrder.compare);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const writeJson = async (filePath, value) => {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const createFailure = (message, result) => {
  const error = new Error(message);
  error.result = result;
  return error;
};

const ensureInsideArtifactRoot = (candidatePath) => {
  const relativePath = path.relative(ARTIFACT_ROOT, candidatePath);
  if (
    relativePath === ''
    || relativePath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativePath)
  ) {
    throw new Error('latest-render.json 的 pagesDirectory 必須位於 artifacts/docx-qa 內。');
  }
};

const resolveLatestRenderDirectory = async () => {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(LATEST_RENDER_MANIFEST, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(
        '找不到 latest-render.json；請先執行 npm run qa:render。',
      );
    }
    throw new Error(`latest-render.json 無法讀取：${error.message}`);
  }

  if (
    manifest?.schemaVersion !== 1
    || typeof manifest.pagesDirectory !== 'string'
    || !manifest.pagesDirectory.trim()
    || path.isAbsolute(manifest.pagesDirectory)
  ) {
    throw new Error('latest-render.json 格式無效。');
  }
  const pagesDirectory = path.resolve(
    ARTIFACT_ROOT,
    manifest.pagesDirectory,
  );
  ensureInsideArtifactRoot(pagesDirectory);
  return { manifest, pagesDirectory };
};

/**
 * 解析 compare CLI；刻意只允許 baseline 更新旗標，避免一般比較意外寫入。
 */
export const parseCliArgs = (args) => {
  let updateBaseline = false;
  for (const argument of args) {
    if (argument !== '--update-baseline') {
      throw new Error(`不支援的參數：${argument}`);
    }
    if (updateBaseline) {
      throw new Error('--update-baseline 不得重複。');
    }
    updateBaseline = true;
  }
  return { updateBaseline };
};

/**
 * 逐頁比較 render 與 baseline；baseline 只有更新模式可寫入，且永不刪檔。
 */
export const runRenderComparison = async ({
  baselineDirectory,
  renderDirectory,
  resultsPath,
  updateBaseline,
  renderMetadata,
}) => {
  const renderFiles = await listPngFiles(renderDirectory);
  if (renderFiles.length === 0) {
    throw new Error(`render 目錄沒有 PNG：${renderDirectory}`);
  }

  if (updateBaseline) {
    await mkdir(baselineDirectory, { recursive: true });
    for (const fileName of renderFiles) {
      await copyFile(
        path.join(renderDirectory, fileName),
        path.join(baselineDirectory, fileName),
      );
    }
    const baselineFiles = await listPngFiles(baselineDirectory);
    const retainedFiles = baselineFiles.filter(
      (fileName) => !renderFiles.includes(fileName),
    );
    return {
      schemaVersion: 1,
      mode: 'update-baseline',
      updatedFiles: renderFiles,
      retainedFiles,
      renderMetadata,
    };
  }

  const baselineFiles = await listPngFiles(baselineDirectory);
  if (baselineFiles.length === 0) {
    throw new Error(
      `baseline 不存在或沒有 PNG：${baselineDirectory}；`
      + '請先人工審查 render，再執行 npm run qa:baseline。',
    );
  }

  const missingPages = baselineFiles.filter(
    (fileName) => !renderFiles.includes(fileName),
  );
  const extraPages = renderFiles.filter(
    (fileName) => !baselineFiles.includes(fileName),
  );
  const result = {
    schemaVersion: 1,
    mode: 'compare',
    threshold: MISMATCH_THRESHOLD,
    passed: false,
    missingPages,
    extraPages,
    pages: [],
    renderMetadata,
  };

  if (missingPages.length > 0 || extraPages.length > 0) {
    await writeJson(resultsPath, result);
    throw createFailure(
      `baseline 與 render 的 PNG 檔名集合不一致；`
      + `missing=${missingPages.join(',') || '無'}，`
      + `extra=${extraPages.join(',') || '無'}。`,
      result,
    );
  }

  for (const fileName of renderFiles) {
    const baseline = PNG.sync.read(
      await readFile(path.join(baselineDirectory, fileName)),
    );
    const rendered = PNG.sync.read(
      await readFile(path.join(renderDirectory, fileName)),
    );
    if (
      baseline.width !== rendered.width
      || baseline.height !== rendered.height
    ) {
      result.pages.push({
        fileName,
        passed: false,
        failure: 'dimensions-mismatch',
        baselineDimensions: {
          width: baseline.width,
          height: baseline.height,
        },
        renderDimensions: {
          width: rendered.width,
          height: rendered.height,
        },
      });
      await writeJson(resultsPath, result);
      throw createFailure(
        `${fileName} 尺寸不一致：`
        + `baseline=${baseline.width}x${baseline.height}，`
        + `render=${rendered.width}x${rendered.height}。`,
        result,
      );
    }

    const mismatchPixels = pixelmatch(
      baseline.data,
      rendered.data,
      null,
      rendered.width,
      rendered.height,
    );
    const mismatchRatio = mismatchPixels / (
      rendered.width * rendered.height
    );
    result.pages.push({
      fileName,
      width: rendered.width,
      height: rendered.height,
      mismatchPixels,
      mismatchRatio,
      passed: mismatchRatio <= MISMATCH_THRESHOLD,
    });
  }

  result.passed = result.pages.every((page) => page.passed);
  await writeJson(resultsPath, result);
  if (!result.passed) {
    const failedPages = result.pages
      .filter((page) => !page.passed)
      .map((page) => `${page.fileName}=${page.mismatchRatio.toFixed(6)}`)
      .join(', ');
    throw createFailure(
      `PNG mismatch ratio 超過 ${MISMATCH_THRESHOLD}：${failedPages}`,
      result,
    );
  }
  return result;
};

const runCli = async () => {
  const options = parseCliArgs(process.argv.slice(2));
  const { manifest, pagesDirectory } = await resolveLatestRenderDirectory();
  const resultsPath = path.join(path.dirname(pagesDirectory), 'comparison.json');
  const result = await runRenderComparison({
    baselineDirectory: DEFAULT_BASELINE_DIRECTORY,
    renderDirectory: pagesDirectory,
    resultsPath,
    ...options,
    renderMetadata: manifest,
  });

  if (options.updateBaseline) {
    console.log(
      `已更新 ${result.updatedFiles.length} 張 baseline；未刪除任何既有檔案。`,
    );
    if (result.retainedFiles.length > 0) {
      console.warn(
        `baseline 仍有 render 不包含的舊頁：${result.retainedFiles.join(', ')}`,
      );
    }
    return;
  }

  for (const page of result.pages) {
    console.log(
      `${page.fileName}: mismatch ratio=${page.mismatchRatio.toFixed(6)}`,
    );
  }
  console.log(`比較結果：${resultsPath}`);
};

const isMainModule = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
