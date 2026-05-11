---
sidebar_position: 1
title: "架构"
description: "Hermes 智能体内部原理 — 主要子系统、执行路径、数据流及后续阅读指南"
---

# 架构

本页面是 Hermes 智能体内部原理的顶级导航图。请先通过它熟悉代码库结构，然后深入各子系统的特定文档以了解实现细节。

## 系统概述

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         入口点                                     │
│                                                                      │
│  CLI (cli.py)    网关 (gateway/run.py)    ACP (acp_adapter/)        │
│  批量运行器      API 服务器                Python 库                 │
└──────────┬──────────────┬───────────────────────┬───────────────────┘
           │              │                       │
           ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AIAgent 智能体 (run_agent.py)                   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ 提示词       │  │ 提供商       │  │ 工具         │               │
│  │ 构建器       │  │ 解析         │  │ 调度         │               │
│  │ (prompt_     │  │ (runtime_    │  │ (model_      │               │
│  │  builder.py) │  │  provider.py)│  │  tools.py)   │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                       │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐               │
│  │ 压缩与       │  │ 3种API模式   │  │ 工具注册表   │               │
│  │ 缓存         │  │ 聊天补全     │  │ (registry.py)│               │
│  │              │  │ 代码响应     │  │ 70+工具      │               │
│  │              │  │ Anthropic    │  │ 28工具集     │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────┴─────────────────┴─────────────────┴───────────────────────┘
           │                                    │
           ▼                                    ▼
┌───────────────────┐              ┌──────────────────────┐
│ 会话存储          │              │ 工具后端             │
│ (SQLite + FTS5)   │              │ 终端（7个后端）      │
│ hermes_state.py   │              │ 浏览器（5个后端）    │
│ gateway/session.py│              │ Web（4个后端）       │
└───────────────────┘              │ MCP（动态）          │
                                   │ 文件、视觉等         │
                                   └──────────────────────┘
```

# Hermes 智能体架构

## 目录结构

```text
hermes-agent/
├── run_agent.py              # AIAgent — 核心对话循环（大型文件）
├── cli.py                    # HermesCLI — 交互式终端用户界面（大型文件）
├── model_tools.py            # 工具发现、模式收集、调度
├── toolsets.py               # 工具分组与平台预设
├── hermes_state.py           # SQLite 会话/状态数据库（带 FTS5）
├── hermes_constants.py       # HERMES_HOME，用户配置感知路径
├── batch_runner.py           # 批量轨迹生成
│
├── agent/                    # 智能体内部结构
│   ├── prompt_builder.py     # 系统提示词组装
│   ├── context_engine.py     # ContextEngine 抽象基类（可插拔）
│   ├── context_compressor.py # 默认引擎 — 有损摘要
│   ├── prompt_caching.py     # Anthropic 提示词缓存
│   ├── auxiliary_client.py   # 用于辅助任务（视觉、摘要）的辅助 LLM
│   ├── model_metadata.py     # 模型上下文长度、令牌估算
│   ├── models_dev.py         # models.dev 注册集成
│   ├── anthropic_adapter.py  # Anthropic 消息 API 格式转换
│   ├── display.py            # KawaiiSpinner、工具预览格式化
│   ├── skill_commands.py     # 技能斜杠命令
│   ├── memory_manager.py    # 记忆管理器编排
│   ├── memory_provider.py   # 记忆提供商抽象基类
│   └── trajectory.py         # 轨迹保存辅助工具
│
├── hermes_cli/               # CLI 子命令与设置
│   ├── main.py               # 入口点 — 所有 `hermes` 子命令（大型文件）
│   ├── config.py             # DEFAULT_CONFIG, OPTIONAL_ENV_VARS, 迁移
│   ├── commands.py           # COMMAND_REGISTRY — 中心斜杠命令定义
│   ├── auth.py               # PROVIDER_REGISTRY, 凭证解析
│   ├── runtime_provider.py   # 提供商 → api_mode + 凭证
│   ├── models.py             # 模型目录，提供商模型列表
│   ├── model_switch.py       # /model 命令逻辑（CLI 与网关共享）
│   ├── setup.py              # 交互式设置向导（大型文件）
│   ├── skin_engine.py        # CLI 主题引擎
│   ├── skills_config.py      # hermes 技能 — 按平台启用/禁用
│   ├── skills_hub.py         # /skills 斜杠命令
│   ├── tools_config.py       # hermes 工具 — 按平台启用/禁用
│   ├── plugins.py            # PluginManager — 发现、加载、钩子
│   ├── callbacks.py          # 终端回调（澄清、sudo、审批）
│   └── gateway.py            # hermes 网关启动/停止
│
├── tools/                    # 工具实现（每个工具一个文件）
│   ├── registry.py           # 中心工具注册表
│   ├── approval.py           # 危险命令检测
│   ├── terminal_tool.py      # 终端编排
│   ├── process_registry.py   # 后台进程管理
│   ├── file_tools.py         # read_file, write_file, patch, search_files
│   ├── web_tools.py          # web_search, web_extract
│   ├── browser_tool.py       # 10 个浏览器自动化工具
│   ├── code_execution_tool.py # execute_code 沙盒
│   ├── delegate_tool.py      # 子智能体委派
│   ├── mcp_tool.py           # MCP 客户端（大型文件）
│   ├── credential_files.py   # 基于文件的凭证透传
│   ├── env_passthrough.py    # 用于沙盒的环境变量透传
│   ├── ansi_strip.py         # ANSI 转义序列剥离
│   └── environments/         # 终端后端（本地、Docker、SSH、Modal、Daytona、Singularity）
│
├── gateway/                  # 消息平台网关
│   ├── run.py                # GatewayRunner — 消息调度（大型文件）
│   ├── session.py            # SessionStore — 对话持久化
│   ├── delivery.py           # 出站消息投递
│   ├── pairing.py            # 私信配对授权
│   ├── hooks.py              # 钩子发现与生命周期事件
│   ├── mirror.py             # 跨会话消息镜像
│   ├── status.py             # 令牌锁、用户配置作用域的进程跟踪
│   ├── builtin_hooks/        # 永久注册钩子的扩展点（无预置）
│   └── platforms/            # 20 个适配器：Telegram, Discord, Slack, WhatsApp,
│                             #   Signal, Matrix, Mattermost, 电子邮件, 短信,
│                             #   钉钉, 飞书, 企业微信, 企业微信回调, 微信,
│                             #   BlueBubbles, QQ机器人, Home Assistant, Webhook, API服务器,
│                             #   元宝
│
├── acp_adapter/              # ACP 服务器（VS Code / Zed / JetBrains）
├── cron/                     # 调度器（jobs.py, scheduler.py）
├── plugins/memory/           # 记忆提供商插件
├── plugins/context_engine/   # 上下文引擎插件
├── environments/             # RL 训练环境（Atropos）
├── skills/                   # 内置技能（始终可用）
├── optional-skills/          # 官方可选技能（需显式安装）
├── website/                  # Docusaurus 文档站点
└── tests/                    # Pytest 测试套件（~3,000+ 测试）
```

## 数据流

### CLI 会话

```text
用户输入 → HermesCLI.process_input()
  → AIAgent.run_conversation()
    → prompt_builder.build_system_prompt()
    → runtime_provider.resolve_runtime_provider()
    → API 调用 (chat_completions / codex_responses / anthropic_messages)
    → 工具调用? → model_tools.handle_function_call() → 循环
    → 最终响应 → display → 保存至 SessionDB
```

### 网关消息

```text
平台事件 → Adapter.on_message() → MessageEvent
  → GatewayRunner._handle_message()
    → 授权用户
    → 解析会话键
    → 创建带有会话历史的 AIAgent
    → AIAgent.run_conversation()
    → 通过适配器投递响应回去
```

### 定时任务

```text
调度器滴答 → 从 jobs.json 加载到期任务
  → 创建全新的 AIAgent（无历史记录）
  → 注入附带的技能作为上下文
  → 运行任务提示词
  → 将响应投递至目标平台
  → 更新任务状态及下次运行时间
```

## 推荐阅读顺序

如果您是代码库的新手：

1.  **本页面** — 熟悉整体架构
2.  **[智能体循环内部机制](./agent-loop.md)** — AIAgent 的工作原理
3.  **[提示词组装](./prompt-assembly.md)** — 系统提示词的构建
4.  **[提供商运行时解析](./provider-runtime.md)** — 提供商的选择方式
5.  **[添加提供商](./adding-providers.md)** — 添加新提供商的实用指南
6.  **[工具运行时](./tools-runtime.md)** — 工具注册、调度、环境
7.  **[会话存储](./session-storage.md)** — SQLite 模式、FTS5、会话血统
8.  **[网关内部机制](./gateway-internals.md)** — 消息平台网关
9.  **[上下文压缩与提示词缓存](./context-compression-and-caching.md)** — 压缩与缓存
10. **[ACP 内部机制](./acp-internals.md)** — IDE 集成
11. **[环境、基准与数据生成](./environments.md)** — RL 训练

## 主要子系统

### 智能体循环

同步编排引擎（`run_agent.py` 中的 `AIAgent`）。处理提供商选择、提示词构建、工具执行、重试、回退、回调、压缩和持久化。支持三种 API 模式以适配不同的提供商后端。

→ [智能体循环内部机制](./agent-loop.md)

### 提示词系统

贯穿对话生命周期的提示词构建与维护：

- **`prompt_builder.py`** — 从以下组件组装系统提示词：个性（SOUL.md）、记忆（MEMORY.md, USER.md）、技能、上下文文件（AGENTS.md, .hermes.md）、工具使用指导以及模型特定说明
- **`prompt_caching.py`** — 为 Anthropic 前缀缓存应用缓存断点
- **`context_compressor.py`** — 当上下文超过阈值时，对中间对话轮次进行摘要

→ [提示词组装](./prompt-assembly.md), [上下文压缩与提示词缓存](./context-compression-and-caching.md)

### 提供商解析

一个共享的运行时解析器，被 CLI、网关、定时任务、ACP 和辅助调用使用。将 `(provider, model)` 元组映射到 `(api_mode, api_key, base_url)`。处理 18+ 个提供商、OAuth 流程、凭证池和别名解析。

→ [提供商运行时解析](./provider-runtime.md)

### 工具系统

中心工具注册表（`tools/registry.py`），拥有分布在约 28 个工具集中的 70+ 个已注册工具。每个工具文件在导入时自注册。注册表处理模式收集、调度、可用性检查和错误包装。终端工具支持 7 种后端（本地、Docker、SSH、Daytona、Modal、Singularity、Vercel 沙盒）。

→ [工具运行时](./tools-runtime.md)

### 会话持久化

基于 SQLite 的会话存储，支持 FTS5 全文搜索。会话具有血统跟踪（压缩过程中的父子关系）、按平台隔离以及带冲突处理的原子写入。

→ [会话存储](./session-storage.md)

### 消息网关

一个长期运行的进程，包含 20 个平台适配器、统一的会话路由、用户授权（白名单 + 私信配对）、斜杠命令调度、钩子系统、定时任务触发和后台维护。

→ [网关内部机制](./gateway-internals.md)

### 插件系统

三个发现源：`~/.hermes/plugins/`（用户级）、`.hermes/plugins/`（项目级）和 pip 入口点。插件通过上下文 API 注册工具、钩子和 CLI 命令。存在两种专门的插件类型：记忆提供商（`plugins/memory/`）和上下文引擎（`plugins/context_engine/`）。两者都是单选的——同时只能各激活一个，通过 `hermes plugins` 或 `config.yaml` 配置。

→ [插件指南](/docs/guides/build-a-hermes-plugin), [记忆提供商插件](./memory-provider-plugin.md)

### 定时任务

一等智能体任务（非 shell 任务）。任务存储在 JSON 中，支持多种调度格式，可以附加技能和脚本，并能投递到任何平台。

→ [定时任务内部机制](./cron-internals.md)

### ACP 集成

通过 stdio/JSON-RPC 将 Hermes 暴露为 VS Code、Zed 和 JetBrains 的编辑器原生智能体。

→ [ACP 内部机制](./acp-internals.md)

### RL / 环境 / 轨迹

用于评估和 RL 训练的完整环境框架。与 Atropos 集成，支持多种工具调用解析器，并生成 ShareGPT 格式的轨迹。

→ [环境、基准与数据生成](./environments.md), [轨迹与训练格式](./trajectory-format.md)

## 设计原则

| 原则 | 实践中的含义 |
|------|--------------|
| **提示稳定性** | 系统提示在对话过程中不会改变。除用户明确的操作（`/model`）外，不会进行破坏缓存的变更。 |
| **可观测的执行** | 每次工具调用通过回调对用户可见。在命令行（加载动画）和网关（聊天消息）中提供进度更新。 |
| **可中断** | API 调用和工具执行可被用户输入或信号中途中断。 |
| **平台无关的核心** | 一个 AIAgent 类为命令行、网关、ACP、批处理和 API 服务器提供服务。平台差异存在于入口点，而非智能体内。 |
| **松耦合** | 可选子系统（MCP、插件、内存提供者、强化学习环境）使用注册表模式和 check_fn 门控，而非硬依赖。 |
| **配置隔离** | 每个配置文件（`hermes -p <name>`）拥有其独立的 HERMES_HOME、配置、内存、会话和网关进程ID。多个配置文件可并发运行。 |

## 文件依赖链

```text
tools/registry.py  (无依赖 — 被所有工具文件导入)
       ↑
tools/*.py  (每个文件在导入时调用 registry.register())
       ↑
model_tools.py  (导入 tools/registry 并触发工具发现)
       ↑
run_agent.py, cli.py, batch_runner.py, environments/
```

这条链意味着工具注册发生在导入时，在创建任何智能体实例之前。任何在顶层调用 `registry.register()` 的 `tools/*.py` 文件都会被自动发现——无需手动导入列表。