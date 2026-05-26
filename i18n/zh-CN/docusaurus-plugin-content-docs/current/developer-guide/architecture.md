---
sidebar_position: 1
title: "架构"
description: "Hermes智能体内部解析——主要子系统、执行路径、数据流及后续阅读指引"
---

# 架构

本页面是Hermes智能体内部的顶层架构图。请以此导航代码库，随后可深入各子系统文档查阅实现细节。

## 系统概览

```text
┌─────────────────────────────────────────────────────────────────────┐
│                            入口点                                    │
│                                                                      │
│  CLI (cli.py)    网关 (gateway/run.py)    ACP (acp_adapter/)     │
│  批处理运行器    API服务器                  Python库          │
└──────────┬──────────────┬───────────────────────┬───────────────────┘
           │              │                       │
           ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AIAgent (run_agent.py)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ 提示构建器   │  │ 提供者解析   │  │ 工具分发     │               │
│  │ (prompt_     │  │ (runtime_    │  │ (model_      │               │
│  │  builder.py) │  │  provider.py)│  │  tools.py)   │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                       │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐               │
│  │ 压缩与缓存   │  │ 3种API模式   │  │ 工具注册表   │               │
│  │              │  │ chat_compl.  │  │ (registry.py)│               │
│  │              │  │ codex_resp.  │  │ 70+工具      │               │
│  │              │  │ anthropic    │  │ 28个工具集   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────┴─────────────────┴─────────────────┴───────────────────────┘
           │                                    │
           ▼                                    ▼
┌───────────────────┐              ┌──────────────────────┐
│ 会话存储          │              │ 工具后端             │
│ (SQLite + FTS5)   │              │ 终端 (7个后端)       │
│ hermes_state.py   │              │ 浏览器 (5个后端)     │
│ gateway/session.py│              │ Web (4个后端)        │
└───────────────────┘              │ MCP (动态)           │
                                   │ 文件、视觉等         │
                                   └──────────────────────┘
```

## 目录结构

```text
hermes-agent/
├── run_agent.py              # AIAgent — 核心对话循环（大文件）
├── cli.py                    # HermesCLI — 交互式终端UI（大文件）
├── model_tools.py            # 工具发现、模式收集、分发
├── toolsets.py               # 工具分组和平台预设
├── hermes_state.py           # SQLite 会话/状态数据库，带 FTS5 全文搜索
├── hermes_constants.py       # HERMES_HOME，基于配置文件的路径
├── batch_runner.py           # 批量轨迹生成
│
├── agent/                    # 智能体内部结构
│   ├── prompt_builder.py     # 系统提示词组装
│   ├── context_engine.py     # ContextEngine 抽象基类（可插拔）
│   ├── context_compressor.py # 默认引擎 — 有损摘要
│   ├── prompt_caching.py     # Anthropic 提示词缓存
│   ├── auxiliary_client.py   # 用于辅助任务（视觉、摘要）的辅助LLM
│   ├── model_metadata.py     # 模型上下文长度、词元估算
│   ├── models_dev.py         # models.dev 注册表集成
│   ├── anthropic_adapter.py  # Anthropic Messages API 格式转换
│   ├── display.py            # KawaiiSpinner、工具预览格式化
│   ├── skill_commands.py     # 技能斜杠命令
│   ├── memory_manager.py    # 记忆管理器编排
│   ├── memory_provider.py   # 记忆提供者抽象基类
│   └── trajectory.py         # 轨迹保存助手
│
├── hermes_cli/               # CLI 子命令和设置
│   ├── main.py               # 入口点 — 所有 `hermes` 子命令（大文件）
│   ├── config.py             # DEFAULT_CONFIG、OPTIONAL_ENV_VARS、迁移
│   ├── commands.py           # COMMAND_REGISTRY — 核心斜杠命令定义
│   ├── auth.py               # PROVIDER_REGISTRY、凭证解析
│   ├── runtime_provider.py   # Provider → api_mode + 凭证
│   ├── models.py             # 模型目录、提供者模型列表
│   ├── model_switch.py       # /model 命令逻辑（CLI 和网关共享）
│   ├── setup.py              # 交互式设置向导（大文件）
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
│   ├── file_tools.py         # read_file、write_file、patch、search_files
│   ├── web_tools.py          # web_search、web_extract
│   ├── browser_tool.py       # 10 个浏览器自动化工具
│   ├── code_execution_tool.py # execute_code 沙箱
│   ├── delegate_tool.py      # 子智能体委派
│   ├── mcp_tool.py           # MCP 客户端（大文件）
│   ├── credential_files.py   # 基于文件的凭证透传
│   ├── env_passthrough.py    # 用于沙箱的环境变量透传
│   ├── ansi_strip.py         # ANSI 转义符剥离
│   └── environments/         # 终端后端（本地、Docker、SSH、Modal、Daytona、Singularity）
│
├── gateway/                  # 消息平台网关
│   ├── run.py                # GatewayRunner — 消息分发（大文件）
│   ├── session.py            # SessionStore — 对话持久化
│   ├── delivery.py           # 出站消息传递
│   ├── pairing.py            # 私信配对授权
│   ├── hooks.py              # 钩子发现和生命周期事件
│   ├── mirror.py             # 跨会话消息镜像
│   ├── status.py             # 令牌锁、基于配置文件的进程追踪
│   ├── builtin_hooks/        # 始终注册的钩子扩展点（当前无内置）
│   └── platforms/            # 20 个适配器：telegram、discord、slack、whatsapp、
│                             #   signal、matrix、mattermost、email、sms、
│                             #   dingtalk、feishu、wecom、wecom_callback、weixin、
│                             #   bluebubbles、qqbot、homeassistant、webhook、api_server、
│                             #   yuanbao
│
├── acp_adapter/              # ACP 服务器（VS Code / Zed / JetBrains）
├── cron/                     # 调度器（jobs.py、scheduler.py）
├── plugins/memory/           # 记忆提供者插件
├── plugins/context_engine/   # 上下文引擎插件
├── skills/                   # 内置技能（始终可用）
├── optional-skills/          # 官方可选技能（需显式安装）
├── website/                  # Docusaurus 文档站点
└── tests/                    # Pytest 测试套件（约 3,000+ 测试）
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
    → 最终响应 → 显示 → 保存到 SessionDB
```

### 网关消息

```text
平台事件 → Adapter.on_message() → MessageEvent
  → GatewayRunner._handle_message()
    → 授权用户
    → 解析会话密钥
    → 使用会话历史创建 AIAgent
    → AIAgent.run_conversation()
    → 通过适配器发回响应
```

### 定时任务

```text
调度器 tick → 从 jobs.json 加载到期的任务
  → 创建新的 AIAgent（无历史记录）
    → 将关联的技能作为上下文注入
    → 运行任务提示词
    → 将响应传递到目标平台
    → 更新任务状态和下次运行时间
```

## 推荐阅读顺序

如果您是代码库的新手：

1.  **本页** — 了解概况
2.  **[智能体循环内部](./agent-loop.md)** — AIAgent 如何工作
3.  **[提示词组装](./prompt-assembly.md)** — 系统提示词构建
4.  **[提供者运行时解析](./provider-runtime.md)** — 提供者如何被选择
5.  **[添加提供者](./adding-providers.md)** — 添加新提供者的实用指南
6.  **[工具运行时](./tools-runtime.md)** — 工具注册表、分发、环境
7.  **[会话存储](./session-storage.md)** — SQLite 模式、FTS5、会话谱系
8.  **[网关内部](./gateway-internals.md)** — 消息平台网关
9.  **[上下文压缩与提示词缓存](./context-compression-and-caching.md)** — 压缩与缓存
10. **[ACP 内部](./acp-internals.md)** — IDE 集成

## 主要子系统

### 智能体循环

同步编排引擎（`run_agent.py` 中的 `AIAgent`）。处理提供者选择、提示词构建、工具执行、重试、回退、回调、压缩和持久化。支持三种 API 模式以适应不同的提供者后端。

→ [智能体循环内部](./agent-loop.md)

### 提示词系统

跨对话生命周期的提示词构建与维护：

- **`prompt_builder.py`** — 从以下内容组装系统提示词：个性 (SOUL.md)、记忆 (MEMORY.md, USER.md)、技能、上下文文件 (AGENTS.md, .hermes.md)、工具使用指南以及特定于模型的指令
- **`prompt_caching.py`** — 应用 Anthropic 缓存断点以进行前缀缓存
- **`context_compressor.py`** — 当上下文超过阈值时，总结中间的对话轮次

→ [提示词组装](./prompt-assembly.md), [上下文压缩与提示词缓存](./context-compression-and-caching.md)

### 提供者解析

一个共享的运行时解析器，供 CLI、网关、定时任务、ACP 和辅助调用使用。将 `(provider, model)` 元组映射到 `(api_mode, api_key, base_url)`。处理 18+ 个提供者、OAuth 流程、凭证池和别名解析。

→ [提供者运行时解析](./provider-runtime.md)

### 工具系统

中心工具注册表（`tools/registry.py`），在约 28 个工具集中注册了 70+ 个工具。每个工具文件在导入时自注册。注册表处理模式收集、分发、可用性检查和错误包装。终端工具支持 7 个后端（本地、Docker、SSH、Daytona、Modal、Singularity、Vercel Sandbox）。

→ [工具运行时](./tools-runtime.md)

### 会话持久化

基于 SQLite 的会话存储，带 FTS5 全文搜索。会话具有谱系追踪（压缩时的父/子关系）、按平台隔离以及带有争用处理的原子写入。

→ [会话存储](./session-storage.md)

### 消息网关

一个长驻进程，包含 20 个平台适配器、统一的会话路由、用户授权（允许列表 + 私信配对）、斜杠命令分发、钩子系统、定时任务触发和后台维护。

→ [网关内部](./gateway-internals.md)

### 插件系统

三个发现来源：`~/.hermes/plugins/`（用户）、`.hermes/plugins/`（项目）和 pip 入口点。插件通过上下文 API 注册工具、钩子和 CLI 命令。存在两种专门的插件类型：记忆提供者 (`plugins/memory/`) 和上下文引擎 (`plugins/context_engine/`)。两者都是单选的 — 同一时间只能各有一个处于活动状态，通过 `hermes plugins` 或 `config.yaml` 配置。

→ [插件指南](/guides/build-a-hermes-plugin), [记忆提供者插件](./memory-provider-plugin.md)

### 定时任务

一等智能体任务（非 Shell 任务）。作业以 JSON 存储，支持多种调度格式，可以附加技能和脚本，并可以传递到任何平台。

→ [定时任务内部](./cron-internals.md)

### ACP 集成

通过 stdio/JSON-RPC 将 Hermes 暴露为 VS Code、Zed 和 JetBrains 的原生编辑器智能体。

→ [ACP 内部](./acp-internals.md)

### 轨迹

从智能体会话中生成 ShareGPT 格式的轨迹，用于训练数据生成。

→ [轨迹与训练格式](./trajectory-format.md)

## 设计原则

| 原则 | 实践中的具体体现 |
|-----------|--------------------------|
| **提示稳定性** | 系统提示在对话过程中不会改变。除用户执行明确操作（如 `/model`）外，不会进行破坏缓存的更改。 |
| **执行可观察** | 每次工具调用都通过回调对用户可见。在命令行界面（CLI，显示加载动画）和网关（显示聊天消息）中提供进度更新。 |
| **可中断** | API 调用和工具执行可在用户输入或信号指令下达时中途取消。 |
| **平台无关核心** | 单一 AIAgent 类可服务于命令行界面、网关、ACP、批处理和 API 服务器。平台差异存在于入口点，而非智能体本身。 |
| **松耦合** | 可选子系统（如 MCP、插件、内存提供器、强化学习环境）使用注册表模式和 `check_fn` 门控机制，而非硬依赖。 |
| **配置隔离** | 每个配置文件（`hermes -p <名称>`）都拥有独立的 HERMES_HOME、配置、内存、会话和网关进程标识符。多个配置文件可同时运行。 |

## 文件依赖链

```text
tools/registry.py  （无依赖 — 被所有工具文件导入）
       ↑
tools/*.py  （每个文件在导入时调用 registry.register()）
       ↑
model_tools.py  （导入 tools/registry 并触发工具发现）
       ↑
run_agent.py, cli.py, batch_runner.py, environments/
```

这条依赖链意味着工具注册发生在导入时，即在任何智能体实例创建之前。任何在顶层调用 `registry.register()` 的 `tools/*.py` 文件都会被自动发现——无需手动维护导入列表。