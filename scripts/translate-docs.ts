#!/usr/bin/env bun

import { Command } from 'commander';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, cpSync, rmSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { execSync } from 'node:child_process';
import env from 'dotenv';
import { md5, NLogger, color, concurrency } from '@lzwme/fe-utils';
import build from './build';

env.config();

const program = new Command();
const logger = new NLogger('T');
// 用于记录已翻译的文件，避免重复翻译
const translateRecordFile = join(process.cwd(), './translate-records.json');

const translateRecord: { [filepath: string]: { srcMd5: string; } & { [targetpath: string]: string } } = existsSync(translateRecordFile) ? JSON.parse(readFileSync(translateRecordFile, 'utf-8')) : {};

program
  .name('translate-docs')
  .description('Translate documentation files using LLM')
  .version('1.0.0')
  .requiredOption('-p, --path <path>', 'Path to file or directory to translate', 'docs')
  .option('-s, --source-lang <lang>', 'Source language', 'en')
  .option('-t, --target-lang <lang>', 'Target language', 'zh-CN')
  .option('--timeout <ms>', 'Timeout in milliseconds. default: 300_000')
  .option('-c, --concurrency <thread>', 'Concurrency. default: 1', '1')
  .option('-u, --base-url <url>', 'LLM base URL', process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1')
  .option('-m, --model <model>', 'LLM model', process.env.OPENAI_MODEL || 'qwen3.5:latest')
  .option('-k, --api-key <key>', 'API key', process.env.OPENAI_API_KEY || '')
  .option('-B, --build', 'Build docs after translation', false)
  .option('-S, --sync', 'Sync docs from hermes-agent repository before translating', false);

program.parse();

const options = program.opts();

const openai = new OpenAI({
  baseURL: options.baseUrl,
  apiKey: options.apiKey,
  timeout: Number(options.timeout || process.env.TRANSLATE_TIMEOUT_MS || 0) || 300_000,
});

// 文本分段最大长度阈值，默认 8000 字符
const MAX_CHUNK_SIZE = Number(process.env.TRANSLATE_MAX_CHUNK_SIZE || 8000);

/**
 * 按二级标题 ## 分割文本，返回分段数组
 * 优先向前查找最近的 ## 作为分割点
 */
function splitBySection(text: string): string[] {
  // 按行分割，保留行结构
  const lines = text.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const line of lines) {
    const lineLength = line.length + 1; // +1 for newline
    const isSectionHeader = /^##\s/.test(line);

    // 如果当前行是二级标题，且累积内容已超过阈值
    if (isSectionHeader && currentLength > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      // 将当前块推入结果，并重新开始新块
      chunks.push(currentChunk.join('\n'));
      currentChunk = [line];
      currentLength = lineLength;
    } else {
      currentChunk.push(line);
      currentLength += lineLength;
    }
  }

  // 推入最后一块
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

/**
 * 进一步按段落分割（当按 ## 分割后仍有块超过阈值时使用）
 * 尝试按空行或普通标题 # 分隔
 */
function splitByParagraph(text: string): string[] {
  if (process.env.TRANSLATE_MAX_CHUNK_SIZE_STRICT == 'false' || text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  // 优先按 ## 分割
  const sidx = text.indexOf('\n## ');
  if (sidx > 0) {
    const nextIdx = text.indexOf('\n## ', sidx + 5);
    // 第一段长度小于 1/3 阈值，且第二段存在，则合并第一段和第二段
    if (sidx <= MAX_CHUNK_SIZE / 3 && nextIdx > -1) {
      return [text.slice(0, nextIdx), text.slice(nextIdx)];
    }

    return [text.slice(0, sidx), text.slice(sidx)];
  }

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= MAX_CHUNK_SIZE) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      // 如果单个段落本身就超过阈值，按句子分割
      if (para.length > MAX_CHUNK_SIZE) {
        const sentences = para.split(/(?<=[。！？.!?])\s*/);
        currentChunk = '';
        for (const sentence of sentences) {
          if ((currentChunk + ' ' + sentence).length <= MAX_CHUNK_SIZE) {
            currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
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
      logger.log(`  Translating chunk ${i + 1}/${finalChunks.length} (${chunk.length} chars)...`);

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

  const prompt = `Translate the following ${sourceLang} text to ${targetLang}. Maintain the markdown formatting and structure.${terminology}Only return the translated text without any additional comments or explanations:\n\n${text}`;

  const response = await openai.chat.completions.create({
    model: options.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  return response.choices[0].message.content || '';
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
      } else if (['.md', '.json'].includes(extname(fullPath))) {
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

  ['docs', 'src', 'scripts'].forEach(dir => {
    const sourceDir = join(sourceDocsDir, dir);
    const targetDir = join(targetDocsDir, dir);
    if (existsSync(sourceDir)) {
      if (dir === 'docs') rmSync(targetDir, { force: true, recursive: true });
      logger.log(`Copying ${sourceDir} to ${targetDir}...`);
      cpSync(sourceDir, targetDir, { force: true, recursive: true });
    }
  });
  logger.log(color.green('Docs sync completed!'));
}

async function translateFile(filePath: string, sourceLang: string, targetLang: string, idx: number, total: number) {
  // Calculate relative path from docs/
  const relativePath = relative('docs', filePath);
  const targetPath = join('i18n', targetLang, 'docusaurus-plugin-content-docs', 'current', relativePath);
  const startTime = Date.now();
  const content = readFileSync(filePath, 'utf-8');

  const srcMd5 = md5(content);
  const fileCacheKey = filePath.replace(process.cwd(), '').replace(/\\/g, '/');

  // 源文件发生变更则更新 srcMd5，并删除已翻译的记录
  if (translateRecord[fileCacheKey]?.srcMd5 !== srcMd5) translateRecord[fileCacheKey] = { srcMd5 };

  // 目标文件已存在，根据 translateRecord 判断是否需要更新
  if (existsSync(targetPath) && translateRecord[fileCacheKey]?.srcMd5 === srcMd5 && translateRecord[fileCacheKey][targetLang]) {
    // console.log(`- [${idx}/${total}]${color.gray(targetPath)} already exists, skipping...`);
    console.log(`- [${idx}/${total}][${color.gray(filePath)} -> ${color.cyan(targetLang)}] already exists, skipping...`);
    return;
  }


  console.log(`- [${idx}/${total}] Translating ${color.cyan(filePath)}, [content length: ${color.yellow(content.length)}] ...`);
  let translatedContent = await translateText(content, sourceLang, targetLang);

  if (!translatedContent) {
    console.log(color.red(`- [${idx}/${total}] Translating ${color.cyan(filePath)} failed!`));
    return;
  }

  // Ensure directory exists
  const targetDir = dirname(targetPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // 如果是 json 文件，则解析为对象，然后再序列化为 json 字符串
  if (extname(filePath) === '.json') {
    const json = JSON.parse(translatedContent.trim().replace(/^```json/, '').replace(/```$/, '').trim());
    translatedContent = JSON.stringify(json, null, 2);
  }

  writeFileSync(targetPath, translatedContent, 'utf-8');
  translateRecord[fileCacheKey][targetLang] = md5(translatedContent);
  writeFileSync(translateRecordFile, JSON.stringify(translateRecord, null, 2), 'utf-8');
  console.log(`  -> Translated to ${color.green(targetPath)}. Time Cost: ${color.yellow(Date.now() - startTime)}ms`);
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
    if (!['.md', '.json'].includes(extname(inputPath))) {
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
  await concurrency(tasks, Number(process.env.TRANSLATE_CONCURRENCY || threads));

  logger.log(color.greenBright('Translation completed!'));

  if (options.build) await build();
}

main().catch(logger.error);
