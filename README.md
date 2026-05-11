# Hermes Agent 中文文档翻译项目

基于 `hermes/website` 文档目录内容同步更新和构建，以支持多语言翻译。当前仅翻译了中文文档。

在线预览：[https://hermes-agent.lzw.me](https://hermes-agent.lzw.me)

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

一键同步文档、翻译并构建：

```bash
bun translate -c 10 -S -B
```

指定参数命令示例：

```bash
# 仅 build 构建
bun b

# 翻译整个 docs 目录（默认英文到中文）
bun translate -p docs/

# 翻译单个文件
bun translate -p docs/getting-started/quickstart.md

# 指定源语言和目标语言
bun translate -p docs/ -s en -t zh-CN

# 指定 LLM 参数
bun translate -p docs/ -u http://localhost:11434/v1 -m qwen3.5:27b -k your-api-key
```

### 翻译常见问题及解决

#### 将转义字符翻译为了转义后的符号，导致构建失败

**现象：**

- 将 html 标签 `&lt;` 的转义内容翻译为了 `<`
- 将 `&#123;` 翻译为了 `{`

**解决办法**:

- 优化提示词，增加相关说明约束
- 手动排查修改后，继续优化提示词

