#!/usr/bin/env bun

import { Command } from 'commander';
// import OpenAI from 'openai';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, cpSync, rmSync } from 'node:fs';
import fg from 'fast-glob';
import { join, dirname, relative, extname } from 'node:path';
import { execSync } from 'node:child_process';
import env from 'dotenv';
import { md5, NLogger, color, concurrency } from '@lzwme/fe-utils';
import build from './build';

env.config();

const program = new Command();
const logger = new NLogger('T');
// 用于记录已翻译的文件，避免重复翻译
const RECORD_FILE = join(process.cwd(), './translate-records.json');

const translateRecords: { [filepath: string]: { srcMd5: string; } & { [targetpath: string]: string } } = existsSync(RECORD_FILE) ? JSON.parse(readFileSync(RECORD_FILE, 'utf-8')) : {};
const FileExtWhiteList = ['.md', '.mdx', '.json']

program
  .name('translate-docs')
  .description('Translate documentation files using LLM')
  .version('1.0.0')
  .requiredOption('-p, --path <path>', 'Path to file or directory to translate', 'docs')
  .option('--debug', 'Debug mode')
  .option('-s, --source-lang <lang>', 'Source language', 'en')
  .option('-t, --target-lang <lang>', 'Target language', 'zh-CN')
  .option('--timeout <ms>', 'Timeout in milliseconds. default: 300_000')
  .option('-c, --concurrency <thread>', 'Concurrency. default: 1', process.env.TRANSLATE_CONCURRENCY || '1')
  .option('-u, --base-url <url>', 'LLM base URL', process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1')
  .option('-m, --model <model>', 'LLM model', process.env.TRANSLATE_OPENAI_MODEL || 'qwen3.5:latest')
  .option('-k, --api-key <key>', 'API key', process.env.OPENAI_API_KEY || '')
  .option('-B, --build', 'Build docs after translation', false)
  .option('-S, --sync', 'Sync docs from hermes-agent repository before translating', false);

program.parse();

const options = program.opts();

// const openai = new OpenAI({
//   baseURL: options.baseUrl,
//   apiKey: options.apiKey,
//   timeout: Number(options.timeout || process.env.TRANSLATE_TIMEOUT_MS || 0) || 300_000,
// });

// 文本分段最大长度阈值，默认 8000 字符
const MAX_CHUNK_SIZE = Number(process.env.TRANSLATE_MAX_CHUNK_SIZE || 8000);

if (options.debug) logger.updateOptions({ levelType: 'debug' });

/**
 * 按二级标题 ## 分割文本，返回分段数组
 * 优先向前查找最近的 ## 作为分割点
 */
function splitBySection(text: string): string[] {
  const lines = text.split('\n')
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentLength = 0
  let insideFence = false

  for (const line of lines) {
    const lineLength = line.length + 1
    const isSectionHeader = /^##\s/.test(line)

    // Track fenced code block state (```, ~~~, etc.)
    if (/^```/.test(line.trim())) {
      insideFence = !insideFence
    }

    // 仅在不在 code block 内部时才按 ## 切分
    if (isSectionHeader && !insideFence && currentLength > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'))
      currentChunk = [line]
      currentLength = lineLength
    } else {
      currentChunk.push(line)
      currentLength += lineLength
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'))
  }

  return chunks
}

/**
 * 进一步按段落分割（当按 ## 分割后仍有块超过阈值时使用）
 * 尝试按空行或普通标题 # 分隔
 */
function splitByParagraph(text: string): string[] {
  if (text.length <= MAX_CHUNK_SIZE) {
    return [text]
  }

  // Try splitting by ## first
  const sidx = text.indexOf('\n## ')
  if (sidx > 0) {
    const nextIdx = text.indexOf('\n## ', sidx + 5)
    if (sidx <= MAX_CHUNK_SIZE / 3 && nextIdx > -1) {
      return [text.slice(0, nextIdx), text.slice(nextIdx)]
    }
    return [text.slice(0, sidx), text.slice(sidx)]
  }

  // 将原始 text 按段落拆分，但合并 fenced code block 内部的段落
  const rawParagraphs = text.split(/\n\n+/)
  const paragraphs: string[] = []
  let insideFence = false
  let pending: string[] = []

  for (const para of rawParagraphs) {
    const lines = para.split('\n')
    for (const line of lines) {
      if (/^```/.test(line.trim())) {
        insideFence = !insideFence
      }
    }
    pending.push(para)
    // 只有在非 fence 内部时才确认一个真正的段落边界
    if (!insideFence) {
      paragraphs.push(pending.join('\n\n'))
      pending = []
    }
  }
  // 收尾：如果 fence 未闭合，将剩余部分合并到一起
  if (pending.length > 0) {
    paragraphs.push(pending.join('\n\n'))
  }

  const chunks: string[] = []
  let currentChunk = ''

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= MAX_CHUNK_SIZE) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para
    } else {
      if (currentChunk) chunks.push(currentChunk)
      if (para.length > MAX_CHUNK_SIZE) {
        // Split by sentence for very long paragraphs
        const sentences = para.split(/(?<=[。！？.!?])\s*/)
        currentChunk = ''
        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length <= MAX_CHUNK_SIZE) {
            currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence
          } else {
            if (currentChunk) chunks.push(currentChunk)
            currentChunk = sentence
          }
        }
      } else {
        currentChunk = para
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}


async function translateText(text: string, sourceLang: string, targetLang: string, id = ''): Promise<string> {
  // 如果文本长度超过阈值，先分段
  if (text.length > MAX_CHUNK_SIZE) {
    logger.log(`  Content length (${text.length}) exceeds threshold (${MAX_CHUNK_SIZE}), splitting...`);

    // 第一步：按二级标题 ## 分割
    let chunks = splitBySection(text);

    // 第二步：对仍超过阈值的块，按段落进一步分割
    const finalChunks: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length > MAX_CHUNK_SIZE) {
        finalChunks.push(...splitByParagraph(chunk));
      } else {
        finalChunks.push(chunk);
      }
    }

    const total = finalChunks.length
    if (total >= 3 && finalChunks[total - 1].length + finalChunks[total - 2].length  < MAX_CHUNK_SIZE) {
      finalChunks[total - 2] += finalChunks[total - 1]
      finalChunks.pop()
    }

    logger.log(`  Split into ${finalChunks.length} chunks`, finalChunks.map(c => c.length));

    // 逐个翻译各块
    const translatedChunks: string[] = [];
    for (let i = 0; i < finalChunks.length; i++) {
      const chunk = finalChunks[i];
      logger.log(`  [${color.cyan(sourceLang)}->${color.green(targetLang)}]Translating chunk ${i + 1}/${finalChunks.length} (${color.green(chunk.length)} chars)... ${color.gray(id)}`);

      const translated = await translateSingleChunk(chunk, sourceLang, targetLang);
      translatedChunks.push(translated);
    }

    // 拼接翻译结果
    return translatedChunks.join('\n\n');
  }

  return translateSingleChunk(text, sourceLang, targetLang);
}

/**
 * 单次翻译单个文本块
 */
async function translateSingleChunk(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const terminology = targetLang === 'zh-CN' ? `
IMPORTANT TERMINOLOGY MAPPING (must follow these exact translations):
- "agent" or "Agent" -> "智能体" (NOT "代理")
- "agents" -> "智能体们" or "多个智能体" (context-dependent, NOT "代理")
- "agents" in software context -> "智能体" or "代理智能体"

` : '';

  const prompt = `Translate the following ${sourceLang} text to ${targetLang}. Maintain the markdown formatting and structure.${terminology}Only return the translated text without any additional comments or explanations.

CRITICAL: Do NOT translate YAML frontmatter keys (keys inside the "---" block at the top of the file). Only translate the values. For example, keep "title:", "description:", "slug:", etc. as they are in English.

CRITICAL: Preserve ALL HTML entities exactly as they appear. Do NOT convert \`&lt;\` to \`<\`, \`&gt;\` to \`>\`, \`&amp;\` to \`&\`, \`&#123;\` to \`{\`,, \`&#125;\` to \`}\`, etc. For example, \`&lt;100ms\` must remain \`&lt;100ms\`, not \`<100ms\`.\n\n${text}`;

  const MAX_RETRIES = 10
  const BASE_DELAY_MS = 1000

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${options.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages: [
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      })

      if (response.ok) {
        const json = await response.json()
        return json.choices[0].message.content.trim()
      }

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 60_000)
        const jitter = Math.random() * 1000
        const totalDelay = delay + jitter
        logger.log(`  Rate limited (429), retrying in ${Math.round(totalDelay)}ms (attempt ${attempt}/${MAX_RETRIES})...`)
        await new Promise(resolve => setTimeout(resolve, totalDelay))
        continue
      }

      const text = await response.text()
      throw new Error(`API error ${response.status}: ${text}`)
    } catch (err) {
      // 网络连接错误（如 socket 关闭）也视为临时故障进行重试
      if (attempt < MAX_RETRIES && err instanceof Error && (
        err.message.includes('socket connection was closed') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('fetch failed')
      )) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 60_000)
        const jitter = Math.random() * 1000
        const totalDelay = delay + jitter
        logger.log(`  Connection error (${err.message}), retrying in ${Math.round(totalDelay)}ms (attempt ${attempt}/${MAX_RETRIES})...`)
        await new Promise(resolve => setTimeout(resolve, totalDelay))
        continue
      }
      throw err
    }
  }
  throw new Error('Exceeded maximum retry attempts due to rate limiting')

  // const response = await openai.chat.completions.create({
  //   model: options.model,
  //   messages: [{ role: 'user', content: prompt }],
  //   temperature: 0.5,
  // });
  // return response.choices[0].message.content || '';
}

function getAllMdFiles(dirPath: string): string[] {
  const files: string[] = [];

  function scanDir(currentPath: string) {
    const items = readdirSync(currentPath);
    for (const item of items) {
      const fullPath = join(currentPath, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (FileExtWhiteList.includes(extname(fullPath))) {
        files.push(fullPath);
      }
    }
  }

  scanDir(dirPath);
  return files;
}

async function syncHermesAgentDocs(): Promise<void> {
  const cacheDir = join(process.cwd(), 'cache');
  const repoDir = join(cacheDir, 'hermes-agent');
  const sourceDocsDir = join(repoDir, 'website');
  const targetDocsDir = process.cwd();

  logger.log('Starting Hermes Agent docs sync...');

  if (existsSync(repoDir)) {
    logger.log('Repository exists, pulling latest changes...');
    try {
      execSync('git pull -r -n', { cwd: repoDir, stdio: 'inherit' });
    } catch {
      logger.log(color.yellow('git pull failed, trying git stash then pull...'));
      execSync('git stash && git pull -r', { cwd: repoDir, stdio: 'inherit' });
    }
  } else {
    logger.log('Cloning repository...');
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    execSync('git clone https://github.com/NousResearch/hermes-agent.git', { cwd: cacheDir, stdio: 'inherit' });
  }

  if (!existsSync(sourceDocsDir)) {
    logger.error(`Source docs directory not found: ${sourceDocsDir}`);
    process.exit(1);
  }

  ['docs', 'src', 'scripts', 'static', 'sidebars.ts'].forEach(dir => {
    const sourceDir = join(sourceDocsDir, dir);
    const targetDir = join(targetDocsDir, dir);
    if (existsSync(sourceDir)) {
      if (dir !== 'scripts') rmSync(targetDir, { force: true, recursive: true });
      logger.log(`Copying ${sourceDir} to ${targetDir}...`);
      cpSync(sourceDir, targetDir, { force: true, recursive: true });
    }
  });

  // 替换 src/pages/skills/index.tsx 中的 `"/docs/api/` 为 `https://hermes-agent.nousresearch.com/docs/api/`
  const indexFile = join(targetDocsDir, 'src', 'pages', 'skills', 'index.tsx');
  if (existsSync(indexFile)) {
    logger.log(`Replacing ${indexFile}...`);
    let content = readFileSync(indexFile, 'utf8');
    content = content.replace(/"\/docs\/api\//g, '"https://hermes-agent.nousresearch.com/docs/api/');
    writeFileSync(indexFile, content);
  }

  logger.log(color.green('Docs sync completed!'));

  // 同步完成后，清理已废弃的源文档对应的翻译文件
  await cleanupStaleTranslations();
}

async function cleanupStaleTranslations(): Promise<void> {
  const docsDir = join(process.cwd(), 'docs');
  const i18nDir = join(process.cwd(), 'i18n');

  if (!existsSync(docsDir) || !existsSync(i18nDir)) return;

  logger.log('Cleaning up stale translations...');

  // 使用 fast-glob 获取 docs 目录下的所有文件（相对路径，使用正斜杠）
  const extPattern = `**/*.{${FileExtWhiteList.map(e => e.slice(1)).join(',')}}`;
  const sourceFiles = await fg(extPattern, { cwd: docsDir, onlyFiles: true }) as string[];
  const sourceFilesSet = new Set(sourceFiles.map(f => `docs/${f.replace(/\\/g, '/')}`));

  const keysToDelete: string[] = [];

  for (const [recordKey, record] of Object.entries(translateRecords)) {
    // 源文件仍存在则跳过
    if (sourceFilesSet.has(recordKey)) continue;

    console.log(`  Source file "${color.yellow(recordKey)}" no longer exists, cleaning up translations...`);

    // 计算相对路径（去除 docs/ 前缀）
    const relativePath = recordKey.startsWith('docs/') ? recordKey.slice(5) : recordKey;

    // 删除所有语言翻译文件（保留 srcMd5 对应的 key）
    for (const [lang] of Object.entries(record)) {
      if (lang === 'srcMd5') continue;

      const translatedFile = join(i18nDir, lang, 'docusaurus-plugin-content-docs', 'current', relativePath);
      if (existsSync(translatedFile)) {
        rmSync(translatedFile, { force: true });
        console.log(`   - Deleted: ${color.red(translatedFile)}`);
      }
    }

    keysToDelete.push(recordKey);
  }

  // 删除 translateRecords 中对应的记录
  for (const key of keysToDelete) {
    delete translateRecords[key];
  }

  if (keysToDelete.length > 0) {
    writeFileSync(RECORD_FILE, JSON.stringify(translateRecords, null, 2), 'utf-8');
    logger.log(`  Removed ${keysToDelete.length} stale translation records`);
  }

  logger.log('Stale translations cleanup completed!');
}

async function translateFile(srcFile: string, sourceLang: string, targetLang: string, idx: number, total: number) {
  // Calculate relative path from docs/
  const srcFileRelative = relative('docs', srcFile);
  const destFile = join('i18n', targetLang, 'docusaurus-plugin-content-docs', 'current', srcFileRelative);
  const startTime = Date.now();
  const content = readFileSync(srcFile, 'utf-8');

  const srcMd5 = md5(content);
  const fileCacheKey = srcFile.replace(process.cwd(), '').replace(/\\/g, '/');

  // 源文件发生变更则更新 srcMd5，并删除已翻译的记录
  if (translateRecords[fileCacheKey]?.srcMd5 !== srcMd5) translateRecords[fileCacheKey] = { srcMd5 };

  // 目标文件已存在，根据 translateRecord 判断是否需要更新
  if (existsSync(destFile) && translateRecords[fileCacheKey]?.srcMd5 === srcMd5 && translateRecords[fileCacheKey][targetLang]) {
    if (options.debug) console.log(`- [${idx}/${total}][${color.gray(srcFile)} -> ${color.cyan(targetLang)}] already exists, skipping...`);
    return;
  }


  console.log(`- [${idx}/${total}] Translating ${color.cyan(srcFile)} (content length: ${color.yellow(content.length)} chars) ...`);
  let translatedContent = await translateText(content, sourceLang, targetLang, srcFileRelative);

  if (!translatedContent) {
    console.log(color.red(`- [${idx}/${total}] Translating ${color.cyan(srcFile)} failed!`));
    return;
  }

  // Ensure directory exists
  const targetDir = dirname(destFile);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

  // 如果是 json 文件，则解析为对象，然后再序列化为 json 字符串
  if (extname(srcFile) === '.json') {
    const json = JSON.parse(translatedContent.trim().replace(/^```json/, '').replace(/```$/, '').trim());
    translatedContent = JSON.stringify(json, null, 2);
  } else {
    // 删除 markdown 内容修正
    translatedContent = translatedContent.trim()
    .replace('localhost:3000**。', 'localhost:3000** 。')
    .trim();
  }

  writeFileSync(destFile, translatedContent, 'utf-8');
  translateRecords[fileCacheKey][targetLang] = md5(translatedContent);
  writeFileSync(RECORD_FILE, JSON.stringify(translateRecords, null, 2), 'utf-8');
  console.log(`  -> Translated to ${color.green(destFile)}. length: ${color.yellow(content.length)}->${color.yellow(translatedContent.length)} chars. Time Cost: ${color.yellow(Date.now() - startTime)}ms`);
}

async function main() {
  const { path: inputPath, sourceLang, targetLang, concurrency: threads = 1, sync } = options;

  // 前置：同步文档
  if (sync) {
    await syncHermesAgentDocs();
  }

  if (!existsSync(inputPath)) {
    logger.error(`Path does not exist: ${color.red(inputPath)}`);
    process.exit(1);
  }

  const stat = statSync(inputPath);
  let filesToTranslate: string[];

  if (stat.isFile()) {
    if (!FileExtWhiteList.includes(extname(inputPath))) {
      logger.error('Input file must be a .md file');
      process.exit(1);
    }
    filesToTranslate = [inputPath];
  } else {
    filesToTranslate = getAllMdFiles(inputPath);
  }

  logger.log(`Found ${color.yellow(filesToTranslate.length)} files to translate`);
  logger.log(`Use Model: ${color.green(options.model)}`);

  let current = 0;
  const total = filesToTranslate.length;

  const tasks = filesToTranslate.map(file => () => translateFile(file, sourceLang, targetLang, ++current, total).catch(error => logger.error(`Error translating ${file}:`, error)));
  await concurrency(tasks, Number(threads));

  logger.log(color.greenBright('Translation completed!'));

  if (options.build) await build();
}

main().catch(logger.error);
