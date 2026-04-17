---
sidebar_position: 1
title: "架构"
description: "Hermes Agent 内部机制 — 主要子系统、执行路径、数据流以及下一步阅读指南"
---

# 架构

本页面是 Hermes Agent 内部机制的顶层地图。请使用本页面来熟悉代码库的整体结构，然后深入阅读子系统特定的文档以了解实现细节。

## 系统概览

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        入口点 (Entry Points)                                  │
│                                                                      │
│  CLI (cli.py)    网关 (gateway/run.py)    ACP (acp_adapter/)     │
│  批量运行器 (Batch Runner)    API 服务器 (API Server)                  Python 库 (Python Library)          │
└──────────┬──────────────┬───────────────────────┬───────────────────┘
           │              │                       │
           ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AIAgent (run_agent.py)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ 提示构建器 │  │ 提供者解析   │  │ 工具分发器  │               │
│  │ (prompt_     │  │ (runtime_    │  │ Dispatch     │               │
│  │  builder.py) │  │  provider.py)│  │ (model_      │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                       │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴─────┐               │
│  │ 压缩与缓存  │  │ 3 种 API 模式  │  │ 工具注册器  │               │
│  │ (Compression  │  │ chat_compl.  │  │ (registry.py)│               │
│  │ & Caching    │  │ codex_resp.  │  │ 47 个工具     │               │
│  │              │  │ anthropic    │  │ 19 个工具集  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌───────────────────┐              ┌──────────────────────┐
│ 会话存储   │              │ 工具后端         │
│ (SQLite + FTS5)   │              │ 终端 (Terminal) (6 个后端) │
│ hermes_state.py   │              │ 浏览器 (Browser) (5 个后端)  │
│ gateway/session.py│              │ 网络 (Web) (4 个后端)      │
└───────────────────┘              │ MCP (动态)         │
                                  │ 文件、视觉等    │
                                   └──────────────────────┘
```

## 目录结构

```text
hermes-agent/
├── run_agent.py              # AIAgent — 核心对话循环 (~10,700 行)
├── cli.py                    # HermesCLI — 交互式终端 UI (~10,000 行)
├── model_tools.py            # 工具发现、Schema 收集、分发
├── toolsets.py               # 工具分组和平台预设
├── hermes_state.py           # 带有 FTS5 的 SQLite 会话/状态数据库
├── hermes_constants.py       # HERMES_HOME、感知配置的路径
├── batch_runner.py           # 批量轨迹生成
│
├── agent/                    # Agent 内部机制
│   ├── prompt_builder.py     # 系统提示构建
│   ├── context_engine.py     # ContextEngine ABC (可插拔)
│   ├── context_compressor.py # 默认引擎 — 损失性摘要
│   ├── prompt_caching.py     # Anthropic 提示缓存
│   ├── auxiliary_client.py   # 用于辅助任务的辅助 LLM (视觉、摘要)
│   ├── model_metadata.py     # 模型上下文长度、Token 估算
│   ├── models_dev.py         # models.dev 注册表集成
│   ├── anthropic_adapter.py  # Anthropic Messages API 格式转换
│   ├── display.py            # KawaiiSpinner、工具预览格式化
│   ├── skill_commands.py     # Skill 斜杠命令
│   ├── memory_manager.py    # 记忆管理器编排
│   ├── memory_provider.py   # MemoryProvider ABC
│   └── trajectory.py         # 轨迹保存辅助函数
│
├── hermes_cli/               # CLI 子命令和设置
│   ├── main.py               # 入口点 — 所有 `hermes` 子命令 (~6,000 行)
│   ├── config.py             # DEFAULT_CONFIG, OPTIONAL_ENV_VARS, 迁移
│   ├── commands.py           # COMMAND_REGISTRY — 中央斜杠命令定义
│   ├── auth.py               # PROVIDER_REGISTRY, 凭证解析
│   ├── runtime_provider.py   # Provider → api_mode + 凭证
│   ├── models.py             # 模型目录、Provider 模型列表
│   ├── model_switch.py       # /model 命令逻辑 (CLI + gateway 共享)
│   ├── setup.py              # 交互式设置向导 (~3,100 行)
│   ├── skin_engine.py        # CLI 主题引擎
│   ├── skills_config.py      # hermes skills — 按平台启用/禁用
│   ├── skills_hub.py         # /skills 斜杠命令
│   ├── tools_config.py       # hermes tools — 按平台启用/禁用
│   ├── plugins.py            # PluginManager — 发现、加载、钩子
│   ├── callbacks.py          # 终端回调 (clarify, sudo, approval)
│   └── gateway.py            # hermes gateway 启动/停止
│
├── tools/                    # 工具实现 (每个工具一个文件)
│   ├── registry.py           # 中央工具注册表
│   ├── approval.py           # 危险命令检测
│   ├── terminal_tool.py      # 终端编排
│   ├── process_registry.py   # 后台进程管理
│   ├── file_tools.py         # read_file, write_file, patch, search_files
│   ├── web_tools.py          # web_search, web_extract
│   ├── browser_tool.py       # 10 个浏览器自动化工具
│   ├── code_execution_tool.py # execute_code 沙箱
│   ├── delegate_tool.py      # 子 Agent 委托
│   ├── mcp_tool.py           # MCP 客户端 (~2,200 行)
│   ├── credential_files.py   # 基于文件的凭证透传
│   ├── env_passthrough.py    # 用于沙箱的环境变量透传
│   ├── ansi_strip.py         # ANSI 转义字符剥离
│   └── environments/         # 终端后端 (local, docker, ssh, modal, daytona, singularity)
│
├── gateway/                  # 消息平台网关
│   ├── run.py                # GatewayRunner — 消息分发 (~9,000 行)
│   ├── session.py            # SessionStore — 对话持久化
│   ├── delivery.py           # 出站消息交付
│   ├── pairing.py            # 私聊配对授权
│   ├── hooks.py              # 钩子发现和生命周期事件
│   ├── mirror.py             # 跨会话消息镜像
│   ├── status.py             # Token 锁定、按 Profile 范围的进程跟踪
│   ├── builtin_hooks/        # 始终注册的钩子
│   └── platforms/            # 18 个适配器：telegram, discord, slack, whatsapp,
│                             #   signal, matrix, mattermost, email, sms,
│                             #   dingtalk, feishu, wecom, wecom_callback, weixin,
│                             #   bluebubbles, qqbot, homeassistant, webhook, api_server
│
├── acp_adapter/              # ACP 服务器 (VS Code / Zed / JetBrains)
├── cron/                     # 调度器 (jobs.py, scheduler.py)
├── plugins/memory/           # 记忆提供者插件
├── plugins/context_engine/   # 上下文引擎插件
├── environments/             # RL 训练环境 (Atropos)
├── skills/                   # 捆绑技能 (始终可用)
├── optional-skills/          # 官方可选技能 (需显式安装)
├── website/                  # Docusaurus 文档网站
└── tests/                    # Pytest 套件 (~3,000+ 测试)
```

## 数据流

### CLI 会话

```text
用户输入 → HermesCLI.process_input()
  → AIAgent.run_conversation()
    → prompt_builder.build_system_prompt()
    → runtime_provider.resolve_runtime_provider()
    → API 调用 (chat_completions / codex_responses / anthropic_messages)
    → 是否有工具调用？ → model_tools.handle_function_call() → 循环
    → 最终响应 → display → 保存到 SessionDB
```

### 网关消息

```text
平台事件 → Adapter.on_message() → MessageEvent
  → GatewayRunner._handle_message()
    → 授权用户
    → 解析会话键
    → 创建 AIAgent 并加载会话历史
    → AIAgent.run_conversation()
    → 通过适配器将响应交付回去
```

### Cron 任务

```text
调度器滴答 → 从 jobs.json 加载待执行任务
  → 创建新的 AIAgent (无历史记录)
  → 注入附加的技能作为上下文
  → 运行任务提示
  → 将响应交付给目标平台
  → 更新任务状态和下次运行时间
```

## 推荐阅读顺序

如果你是代码库新手：

1. **本页面** — 熟悉整体结构
2. **[Agent Loop Internals](./agent-loop.md)** — AIAgent 的工作原理
3. **[Prompt Assembly](./prompt-assembly.md)** — 系统提示构建
4. **[Provider Runtime Resolution](./provider-runtime.md)** — Provider 的选择机制
5. **[Adding Providers](./adding-providers.md)** — 添加新 Provider 的实践指南
6. **[Tools Runtime](./tools-runtime.md)** — 工具注册表、分发、环境
7. **[Session Storage](./session-storage.md)** — SQLite Schema、FTS5、会话血缘
8. **[Gateway Internals](./gateway-internals.md)** — 消息平台网关
9. **[Context Compression & Prompt Caching](./context-compression-and-caching.md)** — 压缩和缓存
10. **[ACP Internals](./acp-internals.md)** — IDE 集成
11. **[Environments, Benchmarks & Data Generation](./environments.md)** — RL 训练

## 主要子系统

### Agent 循环 (Agent Loop)

同步编排引擎（`run_agent.py` 中的 `AIAgent`）。负责 Provider 选择、提示构建、工具执行、重试、回退、回调、压缩和持久化。支持三种 API 模式以适应不同的 Provider 后端。

→ [Agent Loop Internals](./agent-loop.md)

### 提示系统 (Prompt System)

贯穿整个对话生命周期的提示构建和维护：

- **`prompt_builder.py`** — 从以下内容组合系统提示：个性（SOUL.md）、记忆（MEMORY.md, USER.md）、技能、上下文文件（AGENTS.md, .hermes.md）、工具使用指导和模型特定指令。
- **`prompt_caching.py`** — 应用 Anthropic 缓存断点进行前缀缓存。
- **`context_compressor.py`** — 当上下文超出阈值时，对中间对话轮次进行摘要。

→ [Prompt Assembly](./prompt-assembly.md), [Context Compression & Prompt Caching](./context-compression-and-caching.md)

### Provider 解析 (Provider Resolution)

CLI、网关、Cron、ACP 和辅助调用共享的运行时解析器。将 `(provider, model)` 元组映射到 `(api_mode, api_key, base_url)`。负责处理 18+ 个 Provider、OAuth 流程、凭证池和别名解析。

→ [Provider Runtime Resolution](./provider-runtime.md)

### 工具系统 (Tool System)

中央工具注册表（`tools/registry.py`），包含 19 个工具集中的 47 个已注册工具。每个工具文件在导入时自动注册。注册表负责处理 Schema 收集、分发、可用性检查和错误封装。终端工具支持 6 个后端（local, Docker, SSH, Daytona, Modal, Singularity）。

→ [Tools Runtime](./tools-runtime.md)

### 会话持久化 (Session Persistence)

基于 SQLite 的会话存储，并支持 FTS5 全文搜索。会话具有血缘跟踪（压缩过程中的父/子关系）、按平台隔离和带有冲突处理的原子写入。

→ [Session Storage](./session-storage.md)

### 消息网关 (Messaging Gateway)

一个长期运行的过程，包含 18 个平台适配器，统一的会话路由、用户授权（白名单 + 私聊配对）、斜杠命令分发、钩子系统、Cron 滴答和后台维护。

→ [Gateway Internals](./gateway-internals.md)

### 插件系统 (Plugin System)

三个发现源：`~/.hermes/plugins/` (用户)、`.hermes/plugins/` (项目) 和 pip 入口点。插件通过上下文 API 注册工具、钩子和 CLI 命令。存在两种专业插件类型：记忆提供者（`plugins/memory/`）和上下文引擎（`plugins/context_engine/`）。两者都是单选的——每次只能激活一个，通过 `hermes plugins` 或 `config.yaml` 配置。

→ [Plugin Guide](/docs/guides/build-a-hermes-plugin), [Memory Provider Plugin](./memory-provider-plugin.md)

### Cron (定时任务)

一级 Agent 任务（非 Shell 任务）。任务存储在 JSON 中，支持多种调度格式，可以附加技能和脚本，并将响应交付给任何平台。

→ [Cron Internals](./cron-internals.md)

### ACP 集成 (ACP Integration)

通过 stdio/JSON-RPC 将 Hermes 作为编辑器原生的 Agent 暴露给 VS Code、Zed 和 JetBrains。

→ [ACP Internals](./acp-internals.md)

### RL / 环境 / 轨迹 (RL / Environments / Trajectories)

用于评估和 RL 训练的完整环境框架。集成了 Atropos，支持多种工具调用解析器，并生成 ShareGPT 格式的轨迹。

→ [Environments, Benchmarks & Data Generation](./environments.md), [Trajectories & Training Format](./trajectory-format.md)

## 设计原则

| 原则 | 实践意义 |
| :--- | :--- |
| **提示稳定性 (Prompt stability)** | 系统提示在对话中不会改变。除了明确的用户操作（`/model`），不会发生缓存破坏的修改。 |
| **可观察执行 (Observable execution)** | 每次工具调用都通过回调对用户可见。CLI（旋转器）和网关（聊天消息）提供进度更新。 |
| **可中断性 (Interruptible)** | API 调用和工具执行可以在用户输入或信号触发时在飞行途中取消。 |
| **平台无关核心 (Platform-agnostic core)** | 一个 AIAgent 类服务于 CLI、网关、ACP、批量和 API 服务器。平台差异存在于入口点，而非 Agent 本身。 |
| **松耦合 (Loose coupling)** | 可选子系统（MCP、插件、记忆提供者、RL 环境）使用注册表模式和 `check_fn` 门控，而非硬依赖。 |
| **Profile 隔离 (Profile isolation)** | 每个 Profile（`hermes -p <name>`）拥有独立的 HERMES_HOME、配置、记忆、会话和网关 PID。多个 Profile 可以并发运行。 |

## 文件依赖链

```text
tools/registry.py  (无依赖 — 所有工具文件导入)
       ↑
tools/*.py  (每个文件在导入时调用 registry.register())
       ↑
model_tools.py  (导入 tools/registry + 触发工具发现)
       ↑
run_agent.py, cli.py, batch_runner.py, environments/
```

此链意味着工具注册发生在导入时，在任何 Agent 实例创建之前。任何包含顶级 `registry.register()` 调用的 `tools/*.py` 文件都会被自动发现——无需手动导入列表。