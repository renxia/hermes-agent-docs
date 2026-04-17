#!/usr/bin/env bun

import { Command } from 'commander';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, extname } from 'path';

const program = new Command();

program
  .name('translate-docs')
  .description('Translate documentation files using LLM')
  .version('1.0.0')
  .requiredOption('-p, --path <path>', 'Path to file or directory to translate')
  .option('-s, --source-lang <lang>', 'Source language', 'en')
  .option('-t, --target-lang <lang>', 'Target language', 'zh-CN')
  .option('-u, --base-url <url>', 'LLM base URL', process.env.LLM_BASE_URL || 'http://localhost:11434/v1')
  .option('-m, --model <model>', 'LLM model', process.env.LLM_MODEL || 'qwen2.5:3b')
  .option('-k, --api-key <key>', 'API key', process.env.LLM_API_KEY || '');

program.parse();

const options = program.opts();

const openai = new OpenAI({
  baseURL: options.baseUrl,
  apiKey: options.apiKey,
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
      } else if (extname(fullPath) === '.md') {
        files.push(fullPath);
      }
    }
  }

  scanDir(dirPath);
  return files;
}

async function translateFile(filePath: string, sourceLang: string, targetLang: string) {
  const content = readFileSync(filePath, 'utf-8');
  const translatedContent = await translateText(content, sourceLang, targetLang);

  // Calculate relative path from docs/
  const relativePath = relative('docs', filePath);
  const targetPath = join('i18n', targetLang, 'docusaurus-plugin-content-docs', 'current', relativePath);

  // Ensure directory exists
  const targetDir = dirname(targetPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  writeFileSync(targetPath, translatedContent, 'utf-8');
  console.log(`Translated ${filePath} to ${targetPath}`);
}

async function main() {
  const { path: inputPath, sourceLang, targetLang } = options;

  if (!existsSync(inputPath)) {
    console.error(`Path does not exist: ${inputPath}`);
    process.exit(1);
  }

  const stat = statSync(inputPath);
  let filesToTranslate: string[];

  if (stat.isFile()) {
    if (extname(inputPath) !== '.md') {
      console.error('Input file must be a .md file');
      process.exit(1);
    }
    filesToTranslate = [inputPath];
  } else {
    filesToTranslate = getAllMdFiles(inputPath);
  }

  console.log(`Found ${filesToTranslate.length} files to translate`);

  for (const file of filesToTranslate) {
    try {
      await translateFile(file, sourceLang, targetLang);
    } catch (error) {
      console.error(`Error translating ${file}:`, error);
    }
  }

  console.log('Translation completed');
}

main().catch(console.error);