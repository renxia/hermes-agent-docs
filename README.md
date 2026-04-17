# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
yarn
```

## Local Development

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Diagram Linting

CI runs `ascii-guard` to lint docs for ASCII box diagrams. Use Mermaid (````mermaid`) or plain lists/tables instead of ASCII boxes to avoid CI failures.

## Translations

```bash
# 翻译整个 docs 目录（默认英文到中文）
npm run translate -- -p docs/

# 翻译单个文件
npm run translate -- -p docs/getting-started/quickstart.md

# 指定源语言和目标语言
npm run translate -- -p docs/ -s en -t zh-CN

# 指定 LLM 参数
npm run translate -- -p docs/ -u http://localhost:11434/v1 -m qwen3.5:27b -k your-api-key
```
