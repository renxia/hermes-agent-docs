---
title: "页面智能体"
sidebar_label: "页面智能体"
description: "将 alibaba/page-agent 嵌入您自己的 Web 应用——一个纯 JavaScript 的页面内 GUI 智能体，以单个 &lt;script> 标签或 npm 包形式分发，让您的网站终端用户可以通过自然语言驱动 UI（“点击登录，用户名填写为 John”）。无需 Python、无头浏览器或浏览器扩展。当用户是 Web 开发者，并希望为其 SaaS / 管理面板 / B2B 工具添加 AI 副驾驶，通过自然语言让传统 Web 应用更易用，或针对本地（Ollama）或云端（Qwen / OpenAI / OpenRouter）LLM 评估 page-agent 时使用此技能。不适用于服务器端浏览器自动化——请指导那些用户使用 Hermes 内置的浏览器工具。"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非本页面。 */}

# 页面智能体

将 alibaba/page-agent 嵌入您自己的 Web 应用——一个纯 JavaScript 的页面内 GUI 智能体，以单个 &lt;script> 标签或 npm 包形式分发，让您的网站终端用户可以通过自然语言驱动 UI（“点击登录，用户名填写为 John”）。无需 Python、无头浏览器或浏览器扩展。当用户是 Web 开发者，并希望为其 SaaS / 管理面板 / B2B 工具添加 AI 副驾驶，通过自然语言让传统 Web 应用更易用，或针对本地（Ollama）或云端（Qwen / OpenAI / OpenRouter）LLM 评估 page-agent 时使用此技能。不适用于服务器端浏览器自动化——请指导那些用户使用 Hermes 内置的浏览器工具。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/web-development/page-agent` 安装 |
| 路径 | `optional-skills/web-development/page-agent` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `web`, `javascript`, `agent`, `browser`, `gui`, `alibaba`, `embed`, `copilot`, `saas` |

## 参考：完整 SKILL.md

:::info
以下是触发此技能时 Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# page-agent

alibaba/page-agent (https://github.com/alibaba/page-agent, 17k+ stars, MIT) 是一个用 TypeScript 编写的页面内 GUI 智能体。它存在于网页内部，将 DOM 作为文本读取（无截图，非多模态 LLM），并针对当前页面执行自然语言指令，如“点击登录按钮，然后将用户名填写为 John”。纯客户端——宿主网站只需包含一个脚本并传入一个兼容 OpenAI 的 LLM 端点。

## 何时使用此技能

当用户希望做到以下几点时加载此技能：

- **在其自身的 Web 应用内交付 AI 副驾驶**（SaaS、管理面板、B2B 工具、ERP、CRM）——“我仪表板的用户应该能输入‘为 Acme Corp 创建发票并发送邮件’，而不是点击五个屏幕”
- **无需重写前端即可现代化传统 Web 应用**——page-agent 可直接部署在现有 DOM 之上
- **通过自然语言增强可访问性**——语音/屏幕阅读器用户可通过描述所需操作来驱动 UI
- **演示或评估 page-agent**，针对本地（Ollama）或托管（Qwen、OpenAI、OpenRouter）LLM
- **构建交互式培训/产品演示**——让 AI 在真实 UI 中实时指导用户“如何提交费用报告”

## 何时不应使用此技能

- 用户希望 **Hermes 自身驱动浏览器** → 请使用 Hermes 内置的浏览器工具（Browserbase / Camofox）。page-agent 是*相反*方向。
- 用户希望 **无需嵌入即可实现跨标签页自动化** → 请使用 Playwright、browser-use 或 page-agent Chrome 扩展
- 用户需要 **视觉定位/截图** → page-agent 仅支持文本 DOM；请改用多模态浏览器智能体

## 前提条件

- Node 22.13+ 或 24+，npm 10+（文档声称 11+，但 10.9 可正常工作）
- 兼容 OpenAI 的 LLM 端点：Qwen (DashScope)、OpenAI、Ollama、OpenRouter 或任何支持 `/v1/chat/completions` 的服务
- 带有开发工具的浏览器（用于调试）

## 路径 1 — 通过 CDN 的 30 秒演示（无需安装）

查看其效果的最快方式。使用 alibaba 的免费测试 LLM 代理——**仅用于评估**，需遵守其条款。

添加到任何 HTML 页面（或粘贴到开发工具控制台作为书签）：

```html
<script src="https://cdn.jsdelivr.net/npm/page-agent@1.8.0/dist/iife/page-agent.demo.js" crossorigin="true"></script>
```

一个面板会出现。输入指令。完成。

书签形式（拖入书签栏，在任何页面点击）：

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/page-agent@1.8.0/dist/iife/page-agent.demo.js';document.head.appendChild(s);})();
```

## 路径 2 — npm 安装到您自己的 Web 应用（生产用途）

在现有 Web 项目内（React / Vue / Svelte / 原生）：

```bash
npm install page-agent
```

使用您自己的 LLM 端点进行配置——**切勿向真实用户发布演示 CDN**：

```javascript
import { PageAgent } from 'page-agent'

const agent = new PageAgent({
    model: 'qwen3.5-plus',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.LLM_API_KEY,   // 切勿硬编码
    language: 'en-US',
})

// 为终端用户显示面板：
agent.panel.show()

// 或通过编程方式驱动：
await agent.execute('点击提交按钮，然后将用户名填写为 John')
```

供应商示例（任何兼容 OpenAI 的端点均可）：

| 供应商 | `baseURL` | `model` |
|----------|-----------|---------|
| Qwen / DashScope | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3.5-plus` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Ollama（本地） | `http://localhost:11434/v1` | `qwen3:14b` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4.6` |

**关键配置字段**（传递给 `new PageAgent({...})`）：

- `model`、`baseURL`、`apiKey` — LLM 连接
- `language` — UI 语言（`en-US`、`zh-CN` 等）
- 存在白名单和数据脱敏钩子，用于限制智能体可操作的范围——完整选项列表请参阅 https://alibaba.github.io/page-agent/

**安全性。** 对于实际部署，请勿将 `apiKey` 置于客户端代码中——通过您的后端代理 LLM 调用，并将 `baseURL` 指向您的代理。演示 CDN 存在是因为 alibaba 运行该代理用于评估。

## 路径 3 — 克隆源码仓库（用于贡献或修改）

当用户希望修改 page-agent 本身、通过本地 IIFE 包针对任意网站进行测试，或开发浏览器扩展时使用此方式。

```bash
git clone https://github.com/alibaba/page-agent.git
cd page-agent
npm ci              # 精确锁文件安装（或使用 `npm i` 允许更新）
```

在仓库根目录创建 `.env` 文件，其中包含 LLM 端点。示例：

```
LLM_MODEL_NAME=gpt-4o-mini
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
```

Ollama 风格：

```
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=NA
LLM_MODEL_NAME=qwen3:14b
```

常用命令：

```bash
npm start           # 文档/网站开发服务器
npm run build       # 构建所有包
npm run dev:demo    # 在 http://localhost:5174/page-agent.demo.js 提供 IIFE 包
npm run dev:ext     # 开发浏览器扩展（WXT + React）
npm run build:ext   # 构建扩展
```

**使用本地 IIFE 包在任何网站上进行测试**。添加以下书签：

```javascript
javascript:(function(){var s=document.createElement('script');s.src=`http://localhost:5174/page-agent.demo.js?t=${Math.random()}`;s.onload=()=>console.log('PageAgent ready!');document.head.appendChild(s);})();
```

然后：运行 `npm run dev:demo`，在任何页面点击书签，本地构建会注入。保存时自动重新构建。

**警告：** 在开发构建期间，您的 `.env` 文件中的 `LLM_API_KEY` 会被内联到 IIFE 包中。请勿分享该包。请勿提交它。请勿将 URL 粘贴到 Slack。（已验证：搜索公共开发包会返回来自 `.env` 的字面值。）

## 仓库布局（路径 3）

使用 npm 工作区的 monorepo。关键包：

| 包 | 路径 | 用途 |
|---------|------|---------|
| `page-agent` | `packages/page-agent/` | 主入口，包含 UI 面板 |
| `@page-agent/core` | `packages/core/` | 核心智能体逻辑，无 UI |
| `@page-agent/mcp` | `packages/mcp/` | MCP 服务器（测试版） |
| — | `packages/llms/` | LLM 客户端 |
| — | `packages/page-controller/` | DOM 操作 + 视觉反馈 |
| — | `packages/ui/` | 面板 + 国际化 |
| — | `packages/extension/` | Chrome/Firefox 扩展 |
| — | `packages/website/` | 文档 + 着陆页 |

## 验证其是否正常工作

完成路径 1 或路径 2 后：
1. 在带有开发工具的浏览器中打开该页面
2. 您应看到一个浮动面板。如果没有，请检查控制台是否有错误（最常见原因：LLM 端点的 CORS 问题、错误的 `baseURL` 或错误的 API 密钥）
3. 输入与页面上可见内容匹配的简单指令（“点击登录链接”）
4. 查看网络选项卡——您应看到对您 `baseURL` 的请求

完成路径 3 后：
1. `npm run dev:demo` 会打印 `Accepting connections at http://localhost:5174`
2. `curl -I http://localhost:5174/page-agent.demo.js` 返回 `HTTP/1.1 200 OK` 及 `Content-Type: application/javascript`
3. 在任何网站上点击书签；面板出现

## 常见问题

- **在生产环境中使用演示 CDN** — 不要这样做。它有速率限制，使用 alibaba 的免费代理，其条款禁止生产用途。
- **API 密钥泄露** — 任何传递给 `new PageAgent({apiKey: ...})` 的密钥都会出现在您的 JS 包中。对于实际部署，始终通过您自己的后端进行代理。
- **非兼容 OpenAI 的端点** 会静默失败或返回晦涩错误。如果您的提供商需要原生 Anthropic/Gemini 格式，请在其前面使用 OpenAI 兼容性代理（LiteLLM、OpenRouter）。
- **CSP 阻止** — 具有严格内容安全策略的网站可能拒绝加载 CDN 脚本或禁止内联 eval。在这种情况下，请从您的源自行托管。
- **在路径 3 中编辑 `.env` 后重启开发服务器** — Vite 仅在启动时读取环境变量。
- **Node 版本** — 仓库声明 `^22.13.0 || >=24`。Node 20 会在 `npm ci` 时因引擎错误而失败。
- **npm 10 vs 11** — 文档说 npm 11+；npm 10.9 实际上可正常工作。

## 参考

- 仓库：https://github.com/alibaba/page-agent
- 文档：https://alibaba.github.io/page-agent/
- 许可证：MIT（基于 browser-use 的 DOM 处理内部实现，版权所有 2024 Gregor Zunic）