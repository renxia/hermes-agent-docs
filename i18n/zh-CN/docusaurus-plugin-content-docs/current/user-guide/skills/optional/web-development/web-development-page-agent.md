---
title: "页面智能体"
sidebar_label: "页面智能体"
description: "将 alibaba/page-agent 嵌入到您自己的 Web 应用程序中 — 一个纯 JavaScript 的页面内 GUI 智能体，以单个 <script> 标签或 npm 包的形式提供，让终端用户……"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# 页面智能体

将 alibaba/page-agent 嵌入到您自己的 Web 应用程序中 — 一个纯 JavaScript 的页面内 GUI 智能体，以单个 &lt;script> 标签或 npm 包的形式提供，让网站的终端用户可以用自然语言驱动 UI（例如“点击登录，填写用户名为 John”）。无需 Python，无需无头浏览器，也无需扩展程序。当用户是 Web 开发者，并希望为其 SaaS / 管理面板 / B2B 工具添加 AI 副驾驶，使传统 Web 应用可通过自然语言访问，或评估 page-agent 与本地（Ollama）或云端（Qwen / OpenAI / OpenRouter）大语言模型（LLM）的集成时，请使用此技能。**不适用于服务端浏览器自动化** — 请将此类用户引导至 Hermes 内置的浏览器工具。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/web-development/page-agent` 安装 |
| 路径 | `optional-skills/web-development/page-agent` |
| 版本 | `1.0.0` |
| 作者 | Hermes Agent |
| 许可证 | MIT |
| 标签 | `web`, `javascript`, `agent`, `browser`, `gui`, `alibaba`, `embed`, `copilot`, `saas` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# page-agent

alibaba/page-agent（https://github.com/alibaba/page-agent，17k+ 星标，MIT 许可证）是一个用 TypeScript 编写的页面内 GUI 智能体。它存在于网页内部，将 DOM 作为文本读取（无需截图，无需多模态 LLM），并针对当前页面执行自然语言指令，例如“点击登录按钮，然后填写用户名为 John”。纯客户端实现 — 宿主网站只需包含一个脚本并传递一个与 OpenAI 兼容的 LLM 端点。

## 何时使用此技能

当用户想要时，加载此技能：

- **在其自己的 Web 应用中部署 AI 副驾驶**（SaaS、管理面板、B2B 工具、ERP、CRM）— “我仪表板上的用户应该能够输入‘为 Acme 公司创建发票并发送邮件’，而不是点击五个屏幕”
- **现代化传统 Web 应用**而无需重写前端 — page-agent 可直接叠加在现有 DOM 上
- **通过自然语言添加可访问性** — 语音 / 屏幕阅读器用户通过描述他们想要的操作来驱动 UI
- **演示或评估 page-agent** 与本地（Ollama）或托管（Qwen、OpenAI、OpenRouter）LLM 的集成
- **构建交互式培训 / 产品演示** — 让 AI 在真实 UI 中实时引导用户完成“如何提交费用报告”

## 何时**不要**使用此技能

- 用户希望 **Hermes 本身驱动浏览器** → 请使用 Hermes 内置的浏览器工具（Browserbase / Camofox）。page-agent 是**相反**的方向。
- 用户希望 **跨标签页自动化而无需嵌入** → 请使用 Playwright、browser-use 或 page-agent Chrome 扩展程序
- 用户需要 **视觉 grounding / 截图** → page-agent 仅支持文本 DOM；请改用多模态浏览器智能体

## 先决条件

- Node 22.13+ 或 24+，npm 10+（文档声称需要 11+，但 10.9 也能正常工作）
- 一个与 OpenAI 兼容的 LLM 端点：Qwen（DashScope）、OpenAI、Ollama、OpenRouter，或任何支持 `/v1/chat/completions` 的接口
- 带开发者工具的浏览器（用于调试）

## 路径 1 — 通过 CDN 进行 30 秒演示（无需安装）

查看其工作原理的最快方式。使用 alibaba 的免费测试 LLM 代理 — **仅用于评估**，受其条款约束。

添加到任何 HTML 页面（或作为书签小工具粘贴到开发者工具控制台中）：

```html
<script src="https://cdn.jsdelivr.net/npm/page-agent@1.8.0/dist/iife/page-agent.demo.js" crossorigin="true"></script>
```

一个面板会出现。输入指令。完成。

书签小工具形式（拖入书签栏，点击任何页面）：

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/page-agent@1.8.0/dist/iife/page-agent.demo.js';document.head.appendChild(s);})();
```

## 路径 2 — 通过 npm 安装到您自己的 Web 应用（生产环境使用）

在现有 Web 项目（React / Vue / Svelte / 纯 HTML）内部：

```bash
npm install page-agent
```

使用您自己的 LLM 端点进行连接 — **切勿将演示 CDN 部署给真实用户**：

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

// 或以编程方式驱动：
await agent.execute('Click submit button, then fill username as John')
```

提供商示例（任何与 OpenAI 兼容的端点均可工作）：

| 提供商 | `baseURL` | `model` |
|----------|-----------|---------|
| Qwen / DashScope | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3.5-plus` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Ollama（本地） | `http://localhost:11434/v1` | `qwen3:14b` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4.6` |

**关键配置字段**（传递给 `new PageAgent({...})`）：

- `model`、`baseURL`、`apiKey` — LLM 连接
- `language` — UI 语言（`en-US`、`zh-CN` 等）
- 存在允许列表和数据屏蔽钩子，用于限制智能体可访问的内容 — 请参阅 https://alibaba.github.io/page-agent/ 获取完整选项列表

**安全性。** 不要在客户端代码中放置您的 `apiKey` 用于真实部署 — 请将 LLM 调用通过您的后端代理，并将 `baseURL` 指向您的代理。演示 CDN 存在是因为 alibaba 为此评估运行了该代理。

## 路径 3 — 克隆源码仓库（贡献或自定义开发）

当用户想要修改 page-agent 本身、通过本地 IIFE 捆绑包在任意网站上测试它，或开发浏览器扩展程序时使用此路径。

```bash
git clone https://github.com/alibaba/page-agent.git
cd page-agent
npm ci              # 精确锁定文件安装（或使用 `npm i` 允许更新）
```

在仓库根目录创建 `.env` 文件并配置 LLM 端点。示例：

```
LLM_MODEL_NAME=gpt-4o-mini
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
```

Ollama 配置：

```
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=NA
LLM_MODEL_NAME=qwen3:14b
```

常用命令：

```bash
npm start           # 启动 docs/website 开发服务器
npm run build       # 构建所有包
npm run dev:demo    # 在 http://localhost:5174/page-agent.demo.js 提供 IIFE 捆绑包
npm run dev:ext     # 开发浏览器扩展程序（WXT + React）
npm run build:ext   # 构建扩展程序
```

**在任何网站上测试** 使用本地 IIFE 捆绑包。添加此书签小工具：

```javascript
javascript:(function(){var s=document.createElement('script');s.src=`http://localhost:5174/page-agent.demo.js?t=${Math.random()}`;s.onload=()=>console.log('PageAgent ready!');document.head.appendChild(s);})();
```

然后：`npm run dev:demo`，在任何页面上点击书签小工具，本地构建将被注入。保存时自动重新构建。

**警告：** 您的 `.env` 中的 `LLM_API_KEY` 会在开发构建期间被内联到 IIFE 捆绑包中。请勿分享该捆绑包。请勿提交它。请勿将 URL 粘贴到 Slack。（已验证：grep 公共开发捆绑包会返回 `.env` 中的字面值。）

## 仓库结构（路径 3）

使用 npm workspaces 的 Monorepo。关键包：

| 包 | 路径 | 用途 |
|---------|------|---------|
| `page-agent` | `packages/page-agent/` | 主入口，包含 UI 面板 |
| `@page-agent/core` | `packages/core/` | 核心智能体逻辑，无 UI |
| `@page-agent/mcp` | `packages/mcp/` | MCP 服务器（测试版） |
| — | `packages/llms/` | LLM 客户端 |
| — | `packages/page-controller/` | DOM 操作 + 视觉反馈 |
| — | `packages/ui/` | 面板 + 国际化 |
| — | `packages/extension/` | Chrome/Firefox 扩展程序 |
| — | `packages/website/` | 文档 + 登陆页面 |

## 验证其是否正常工作

路径 1 或路径 2 后：
1. 在打开开发者工具的浏览器中打开页面
2. 您应该会看到一个浮动面板。如果没有，请检查控制台是否有错误（最常见：LLM 端点的 CORS 问题、错误的 `baseURL` 或无效的 API 密钥）
3. 输入一个与页面上可见内容匹配的简单指令（“点击登录链接”）
4. 查看“网络”选项卡 — 您应该会看到向您的 `baseURL` 发出的请求

路径 3 后：
1. `npm run dev:demo` 打印 `Accepting connections at http://localhost:5174`
2. `curl -I http://localhost:5174/page-agent.demo.js` 返回 `HTTP/1.1 200 OK`，且 `Content-Type: application/javascript`
3. 在任何网站上点击书签小工具；面板出现

## 陷阱

- **在生产环境中使用演示 CDN** — 不要这样做。它有限速，使用 alibaba 的免费代理，且其条款禁止生产环境使用。
- **API 密钥泄露** — 任何传递给 `new PageAgent({apiKey: ...})` 的密钥都会包含在您的 JS 捆绑包中。对于真实部署，请始终通过您自己的后端代理。
- **非 OpenAI 兼容端点** 会静默失败或出现晦涩错误。如果您的提供商需要原生的 Anthropic/Gemini 格式，请在前面使用 OpenAI 兼容代理（LiteLLM、OpenRouter）。
- **CSP 阻止** — 具有严格内容安全策略（Content-Security-Policy）的网站可能拒绝加载 CDN 脚本或不允许内联 eval。在这种情况下，请从您的源自行托管。
- 路径 3 中编辑 `.env` 后**重启开发服务器** — Vite 仅在启动时读取环境变量。
- **Node 版本** — 仓库声明需要 `^22.13.0 || >=24`。Node 20 会在 `npm ci` 时因引擎错误而失败。
- **npm 10 与 11** — 文档说需要 npm 11+；npm 10.9 实际上也能正常工作。

## 参考

- 仓库：https://github.com/alibaba/page-agent
- 文档：https://alibaba.github.io/page-agent/
- 许可证：MIT（基于 browser-use 的 DOM 处理内部实现，版权所有 2024 Gregor Zunic）