#!/usr/bin/env bun

import { Command } from 'commander';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import env from 'dotenv';
import { md5, NLogger, color } from '@lzwme/fe-utils';

env.config();

const program = new Command();
const logger = new NLogger('[translate]');
// 用于记录已翻译的文件，避免重复翻译
const translateCacheFile = join(process.cwd(), './cache/translate-cache.json');

const translateCache: { [filepath: string]: { srcMd5: string; } & { [targetpath: string]: string } } = existsSync(translateCacheFile) ? JSON.parse(readFileSync(translateCacheFile, 'utf-8')) : {};

program
  .name('translate-docs')
  .description('Translate documentation files using LLM')
  .version('1.0.0')
  .requiredOption('-p, --path <path>', 'Path to file or directory to translate')
  .option('-s, --source-lang <lang>', 'Source language', 'en')
  .option('-t, --target-lang <lang>', 'Target language', 'zh-CN')
  .option('-u, --base-url <url>', 'LLM base URL', process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1')
  .option('-m, --model <model>', 'LLM model', process.env.OPENAI_MODEL || 'qwen3.5:latest')
  .option('-k, --api-key <key>', 'API key', process.env.OPENAI_API_KEY || '');

program.parse();

const options = program.opts();

const openai = new OpenAI({
  baseURL: options.baseUrl,
  apiKey: options.apiKey,
  timeout: 300_000,
});

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const prompt = `Translate the following ${sourceLang} text to ${targetLang}. Maintain the markdown formatting and structure. Only return the translated text without any additional comments or explanations:\n\n${text}`;

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

async function translateFile(filePath: string, sourceLang: string, targetLang: string, idx: number, total: number) {
  // Calculate relative path from docs/
  const relativePath = relative('docs', filePath);
  const targetPath = join('i18n', targetLang, 'docusaurus-plugin-content-docs', 'current', relativePath);
  const startTime = Date.now();
  const content = readFileSync(filePath, 'utf-8');

  const srcMd5 = md5(content);
  if (!translateCache[filePath]) translateCache[filePath] = { srcMd5 };


  // 目标文件已存在，则需判断是否需要更新
  if (existsSync(targetPath)) {
    // 默认 1 小时内修改过，则跳过
    const expireTime = (Number(process.env.TRANSLATE_EXPIRE_TIME) || 3600) * 1000;
    if (statSync(targetPath).ctimeMs > Date.now() - expireTime) {
      logger.log(`${color.gray(targetPath)} already exists, skipping...`);
      // 补充记录 md5 值
      if (!translateCache[filePath][targetPath]) translateCache[filePath][targetPath] = md5(readFileSync(targetPath, 'utf-8'));
      return;
    }

    // 根据 translateCache 判断是否需要更新
    if (translateCache[filePath] && translateCache[filePath].srcMd5 === srcMd5 && translateCache[filePath][targetPath]) {
      logger.log(`${targetPath} already exists, skipping...`);

      return;
    }
  }


  console.log(`- [${idx}/${total}] Translating ${color.cyan(filePath)}, [content length: ${color.yellow(content.length)}] ...`);
  let translatedContent = await translateText(content, sourceLang, targetLang);

  if (!translatedContent) return;

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
  translateCache[filePath][targetPath] = md5(translatedContent);
  writeFileSync(translateCacheFile, JSON.stringify(translateCache, null, 2), 'utf-8');
  console.log(`  -> Translated ${color.gray(filePath)} to ${color.green(targetPath)}. Time Cost: ${color.yellow(Date.now() - startTime)}ms`);
}

async function main() {
  const { path: inputPath, sourceLang, targetLang } = options;

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

  for (const file of filesToTranslate) {
    try {
      await translateFile(file, sourceLang, targetLang, ++current, total);
    } catch (error) {
      logger.error(`Error translating ${file}:`, error);
    }
  }

  logger.log(color.greenBright('Translation completed!'));
}

main().catch(logger.error);