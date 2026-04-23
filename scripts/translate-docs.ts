#!/usr/bin/env bun

import { Command } from 'commander';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, cpSync } from 'node:fs';
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

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
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
    temperature: 0.3,
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
  const sourceDocsDir = join(repoDir, 'website', 'docs');
  const targetDocsDir = join(process.cwd(), 'docs');

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

  logger.log(`Copying docs from ${sourceDocsDir} to ${targetDocsDir}...`);
  cpSync(sourceDocsDir, targetDocsDir, { force: true, recursive: true });
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
