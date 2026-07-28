import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readPackage = async (packagePath) =>
  JSON.parse(await readFile(packagePath, 'utf8'));

describe('Node runtime 公開契約', () => {
  it('不宣告 direct build/test dependencies 已拒絕的 Node 版本', async () => {
    const repositoryRoot = process.cwd();
    const [project, jsdom, viteReact] = await Promise.all([
      readPackage(path.join(repositoryRoot, 'package.json')),
      readPackage(path.join(
        repositoryRoot,
        'node_modules',
        'jsdom',
        'package.json',
      )),
      readPackage(path.join(
        repositoryRoot,
        'node_modules',
        '@vitejs',
        'plugin-react',
        'package.json',
      )),
    ]);

    expect(jsdom.engines.node)
      .toBe('^20.19.0 || ^22.12.0 || >=24.0.0');
    expect(viteReact.engines.node)
      .toBe('^20.19.0 || >=22.12.0');
    expect(project.engines?.node).toBe(jsdom.engines.node);
  });
});
