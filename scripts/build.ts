/**
 * 文档构建
 * 1. 执行 `npm run build`，产出 `build` 目录
 * 2. 重命名 build 目录为 dist/hermes-agent-docs/docs 目录
 * 3. 复制 static/_index.html 到 dist/hermes-agent-docs 目录
 * 4. 进入 dist 目录，使用 zip 命令压缩 hermes-agent-docs 为 hermes-agent-docs.zip
 */

import { mkdirSync, existsSync, rmSync, cpSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();

function build() {
  const buildDir = join(rootDir, 'build');
  const distDir = join(rootDir, 'dist');
  const targetDir = join(distDir, 'hermes-agent-docs');
  const docsDir = join(targetDir, 'docs');
  const staticIndexHtml = join(docsDir, '_index.html');
  const zipFileName = 'hermes-agent-docs.zip';

  // Step 1: 执行 docusaurus build，产出 build 目录
  console.log('[1/4] 执行 docusaurus build...');
  execSync('npx docusaurus build', { stdio: 'inherit', cwd: rootDir, windowsHide: true });

  // Step 2: 重命名 build 目录为 dist/hermes-agent-docs/docs 目录
  console.log('[2/4] 移动 build → dist/hermes-agent-docs/docs...');
  if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  cpSync(buildDir, docsDir, { recursive: true });

  // Step 3: 复制 static/_index.html 到 dist/hermes-agent-docs 目录
  console.log('[3/4] 复制 _index.html → dist/hermes-agent-docs/...');
  renameSync(staticIndexHtml, join(targetDir, 'index.html'));

  // Step 4: 进入 dist 目录，压缩 hermes-agent-docs 为 hermes-agent-docs.zip
  console.log('[4/4] 压缩为 hermes-agent-docs.zip...');
  const zipPath = join(distDir, zipFileName);
  if (existsSync(zipPath)) {
    rmSync(zipPath, { force: true });
  }
  execSync(`zip -r -q ${zipFileName} hermes-agent-docs`, { stdio: 'inherit', cwd: distDir, windowsHide: true });

  console.log(`\n构建完成！产出文件：${zipPath}`);
}

export default build;

if (import.meta.main) build();

