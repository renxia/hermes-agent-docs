---
sidebar_position: 1
title: "架构"
description: "Hermes Agent 内部结构 — 主要子系统、执行路径、数据流以及下一步阅读指南"
---

# 架构

此页面是 Hermes Agent 内部结构的顶层地图。用它来定位自己在代码库中的位置，然后深入阅读特定子系统的文档以了解实现细节。

## 系统概览

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        入口点                                       │
│                                                                      │
│  CLI (cli.py)    网关 (gateway/run.py)    ACP (acp_adapter/)        │
│  批处理运行器     API 服务器                 Python 库               │
└──────────┬──────────────┬───────────────────────┬───────────────────┘
           │              │                       │
           ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AIAgent (run_agent.py)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ 提示词       │  │ 模型提供者   │  │ 工具         │               │
│  │ 构建器       │  │ 解析         │  │ 调度         │               │
│  │ (prompt_     │  │ (runtime_    │  │ (model_      │               │
│  │  builder.py) │  │  provider.py)│  │  tools.py)   │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                       │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐               │
│  │ 压缩         │  │ 3 种 API 模式 │  │ 工具注册表   │               │
│  │ 与缓存       │  │ chat_compl.  │  │ (registry.py)│               │
│  │              │  │ codex_resp.  │  │ 47 个工具     │               │
│  │              │  │ anthropic    │  │ 19 个工具集   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────┴─────────────────┴─────────────────┴───────────────────────┘
           │                                    │
           ▼                                    ▼
┌───────────────────┐              ┌──────────────────────┐
│ 会话存储          │              │ 工具后端              │
│ (SQLite + FTS5)   │              │ 终端 (6 个后端)       │
│ hermes_state.py   │              │ 浏览器 (5 个后端)     │
│ gateway/session.py│              │ 网络 (4 个后端)       │
└───────────────────┘              │ MCP (动态)            │
                                   │ 文件、视觉等          │
                                   └──────────────────────┘
```

## 目录结构

```text
hermes-agent/
├── run_agent.py              # AIAgent — 核心对话循环（约 10,700 行）
├── cli.py                    # HermesCLI — 交互式终端 UI（约 10,000 行）
├── model_tools.py            # 工具发现、Schema 收集、调度
├── toolsets.py               # 工具分组和平台预设
├── hermes_state.py           # 基于 SQLite 的会话/状态数据库（含 FTS5）
├── hermes_constants.py       # HERMES_HOME、感知配置的路径
├── batch_runner.py           # 批量轨迹生成
│
├── agent/                    # 智能体内部实现
│   ├── prompt_builder.py     # 系统提示组装
│   ├── context_engine.py     # ContextEngine 抽象基类（可插拔）
│   ├── context_compressor.py # 默认引擎 — 有损摘要
│   ├── prompt_caching.py     # Anthropic 提示缓存
│   ├── auxiliary_client.py   # 辅助 LLM（用于视觉、摘要等副任务）
│   ├── model_metadata.py     # 模型上下文长度、Token 估算
│   ├── models_dev.py         # models.dev 注册表集成
│   ├── anthropic_adapter.py  # Anthropic Messages API 格式转换
│   ├── display.py            # KawaiiSpinner、工具预览格式化
│   ├── skill_commands.py     # 技能斜杠命令
│   ├── memory_manager.py    # 记忆管理器编排
│   ├── memory_provider.py   # 记忆提供器抽象基类
│   └── trajectory.py         # 轨迹保存辅助工具
│
├── hermes_cli/               # CLI 子命令与设置
│   ├── main.py               # 入口点 — 所有 `hermes` 子命令（约 6,000 行）
│   ├── config.py             # DEFAULT_CONFIG、OPTIONAL_ENV_VARS、迁移逻辑
│   ├── commands.py           # COMMAND_REGISTRY — 中央斜杠命令定义
│   ├── auth.py               # PROVIDER_REGISTRY、凭据解析
│   ├── runtime_provider.py   # 提供器 → api_mode + 凭据
│   ├── models.py             # 模型目录、提供器模型列表
│   ├── model_switch.py       # /model 命令逻辑（CLI 与网关共用）
│   ├── setup.py              # 交互式设置向导（约 3,100 行）
│   ├── skin_engine.py        # CLI 主题引擎
│   ├── skills_config.py      # hermes 技能 — 按平台启用/禁用
│   ├── skills_hub.py         # /skills 斜杠命令
│   ├── tools_config.py       # hermes 工具 — 按平台启用/禁用
│   ├── plugins.py            # PluginManager — 发现、加载、钩子
│   ├── callbacks.py          # 终端回调（澄清、sudo、审批）
│   └── gateway.py            # hermes 网关启动/停止
│
├── tools/                    # 工具实现（每个工具一个文件）
│   ├── registry.py           # 中央工具注册表
│   ├── approval.py           # 危险命令检测
│   ├── terminal_tool.py      # 终端编排
│   ├── process_registry.py   # 后台进程管理
│   ├── file_tools.py         # read_file、write_file、patch、search_files
│   ├── web_tools.py          # web_search、web_extract
│   ├── browser_tool.py       # 10 个浏览器自动化工具
│   ├── code_execution_tool.py # execute_code 沙箱
│   ├── delegate_tool.py      # 子智能体委派
│   ├── mcp_tool.py           # MCP 客户端（约 2,200 行）
│   ├── credential_files.py   # 基于文件的凭据透传
│   ├── env_passthrough.py    # 沙箱环境变量透传
│   ├── ansi_strip.py         # ANSI 转义序列剥离
│   └── environments/         # 终端后端（本地、Docker、SSH、Modal、Daytona、Singularity）
│
├── gateway/                  # 消息平台网关
│   ├── run.py                # GatewayRunner — 消息调度（约 9,000 行）
│   ├── session.py            # SessionStore — 会话持久化
│   ├── delivery.py           # 出站消息投递
│   ├── pairing.py            # DM 配对授权
│   ├── hooks.py              # 钩子发现与生命周期事件
│   ├── mirror.py             # 跨会话消息镜像
│   ├── status.py             # Token 锁、按配置档案范围的进程跟踪
│   ├── builtin_hooks/        # 始终注册的钩子
│   └── platforms/            # 18 个适配器：Telegram、Discord、Slack、WhatsApp、
│                             #   Signal、Matrix、Mattermost、Email、SMS、
│                             #   钉钉、飞书、企业微信、企业微信回调、微信、
│                             #   BlueBubbles、QQ 机器人、Home Assistant、Webhook、API 服务器
│
├── acp_adapter/              # ACP 服务器（VS Code / Zed / JetBrains）
├── cron/                     # 调度器（jobs.py、scheduler.py）
├── plugins/memory/           # 记忆提供器插件
├── plugins/context_engine/   # 上下文引擎插件
├── environments/             # 强化学习训练环境（Atropos）
├── skills/                   # 内置技能（始终可用）
├── optional-skills/          # 官方可选技能（需显式安装）
├── website/                  # Docusaurus 文档站点
└── tests/                    # Pytest 测试套件（约 3,000+ 个测试）
```

## 数据流

### CLI 会话

```text
用户输入 → HermesCLI.process_input()
  → AIAgent.run_conversation()
    → prompt_builder.build_system_prompt()
    → runtime_provider.resolve_runtime_provider()
    → API 调用（chat_completions / codex_responses / anthropic_messages）
    → tool_calls? → model_tools.handle_function_call() → 循环
    → 最终响应 → 显示 → 保存至 SessionDB
```

### 网关消息

```text
平台事件 → Adapter.on_message() → MessageEvent
  → GatewayRunner._handle_message()
    → 授权用户
    → 解析会话键
    → 使用会话历史创建 AIAgent
    → AIAgent.run_conversation()
    → 通过适配器回传响应
```

### Cron 作业

```text
调度器滴答 → 从 jobs.json 加载到期作业
  → 创建全新 AIAgent（无历史记录）
  → 将附加技能注入上下文
  → 运行作业提示
  → 将响应投递至目标平台
  → 更新作业状态与下次运行时间
```

## 推荐阅读顺序

如果你是代码库的新手：

1. **本页面** — 了解整体结构
2. **[智能体循环内部机制](./agent-loop.md)** — AIAgent 如何工作
3. **[提示组装](./prompt-assembly.md)** — 系统提示构建
4. **[提供器运行时解析](./provider-runtime.md)** — 如何选择提供器
5. **[添加提供器](./adding-providers.md)** — 添加新提供器的实践指南
6. **[工具运行时](./tools-runtime.md)** — 工具注册表、调度、环境
7. **[会话存储](./session-storage.md)** — SQLite Schema、FTS5、会话谱系
8. **[网关内部机制](./gateway-internals.md)** — 消息平台网关
9. **[上下文压缩与提示缓存](./context-compression-and-caching.md)** — 压缩与缓存
10. **[ACP 内部机制](./acp-internals.md)** — IDE 集成
11. **[环境、基准测试与数据生成](./environments.md)** — 强化学习训练

## 主要子系统

### 智能体循环

同步编排引擎（`run_agent.py` 中的 `AIAgent`）。处理提供器选择、提示构建、工具执行、重试、回退、回调、压缩和持久化。支持三种 API 模式以适应不同的提供器后端。

→ [智能体循环内部机制](./agent-loop.md)

### 提示系统

在整个对话生命周期中构建和维护提示：

- **`prompt_builder.py`** — 从以下内容组装系统提示：人格（SOUL.md）、记忆（MEMORY.md、USER.md）、技能、上下文文件（AGENTS.md、.hermes.md）、工具使用指导以及模型特定指令
- **`prompt_caching.py`** — 应用 Anthropic 缓存断点以实现前缀缓存
- **`context_compressor.py`** — 当上下文超过阈值时，对中间对话轮次进行摘要

→ [提示组装](./prompt-assembly.md)，[上下文压缩与提示缓存](./context-compression-and-caching.md)

### 提供器解析

由 CLI、网关、Cron、ACP 和辅助调用共享的运行时解析器。将 `(提供器, 模型)` 元组映射为 `(api_mode, api_key, base_url)`。处理 18+ 个提供器、OAuth 流程、凭据池和别名解析。

→ [提供器运行时解析](./provider-runtime.md)

### 工具系统

中央工具注册表（`tools/registry.py`），包含 19 个工具集中的 47 个已注册工具。每个工具文件在导入时自动注册。注册表负责 Schema 收集、调度、可用性检查和错误包装。终端工具支持 6 种后端（本地、Docker、SSH、Daytona、Modal、Singularity）。

→ [工具运行时](./tools-runtime.md)

### 会话持久化

基于 SQLite 的会话存储，支持 FTS5 全文搜索。会话具有谱系跟踪（压缩间的父子关系）、按平台隔离以及带竞争处理的原子写入。

→ [会话存储](./session-storage.md)

### 消息网关

长期运行进程，包含 18 个平台适配器、统一会话路由、用户授权（白名单 + DM 配对）、斜杠命令调度、钩子系统、Cron 滴答和后台维护。

→ [网关内部机制](./gateway-internals.md)

### 插件系统

三个发现源：`~/.hermes/plugins/`（用户）、`.hermes/plugins/`（项目）和 pip 入口点。插件通过上下文 API 注册工具、钩子和 CLI 命令。存在两种专用插件类型：记忆提供器（`plugins/memory/`）和上下文引擎（`plugins/context_engine/`）。两者均为单选 — 每次只能激活一种，通过 `hermes plugins` 或 `config.yaml` 配置。

→ [插件指南](/docs/guides/build-a-hermes-plugin)，[记忆提供器插件](./memory-provider-plugin.md)

### Cron

一等智能体任务（非 Shell 任务）。作业以 JSON 存储，支持多种调度格式，可附加技能和脚本，并可投递至任何平台。

→ [Cron 内部机制](./cron-internals.md)

### ACP 集成

通过 stdio/JSON-RPC 将 Hermes 暴露为 VS Code、Zed 和 JetBrains 的原生编辑器智能体。

→ [ACP 内部机制](./acp-internals.md)

### 强化学习 / 环境 / 轨迹

用于评估和强化学习训练的完整环境框架。与 Atropos 集成，支持多种工具调用解析器，并生成 ShareGPT 格式的轨迹。

→ [环境、基准测试与数据生成](./environments.md)，[轨迹与训练格式](./trajectory-format.md)

## 设计原则

| 原则 | 实际含义 |
|-----------|--------------------------|
| **提示词稳定性** | 系统提示词在对话过程中不会改变。除非用户显式操作（`/model`），否则不会发生破坏缓存的变更。 |
| **可观测执行** | 每次工具调用都通过回调对用户可见。在命令行界面（CLI）中显示进度更新（旋转指示器），在网关中显示聊天消息。 |
| **可中断性** | API调用和工具执行可由用户输入或信号中途取消。 |
| **平台无关核心** | 一个AIAgent类服务于CLI、网关、ACP、批处理和API服务器。平台差异体现在入口点，而非智能体本身。 |
| **松耦合** | 可选子系统（MCP、插件、记忆提供者、强化学习环境）采用注册表模式和check_fn门控，而非硬依赖。 |
| **配置文件隔离** | 每个配置文件（`hermes -p <name>`）拥有独立的HERMES_HOME、配置、记忆、会话和网关PID。多个配置文件可同时运行。 |

## 文件依赖链

```text
tools/registry.py  (无依赖 — 被所有工具文件导入)
       ↑
tools/*.py  (每个文件在导入时调用registry.register())
       ↑
model_tools.py  (导入tools/registry + 触发工具发现)
       ↑
run_agent.py, cli.py, batch_runner.py, environments/
```

该依赖链意味着工具注册发生在导入时，在任何智能体实例创建之前。任何包含顶级`registry.register()`调用的`tools/*.py`文件都会被自动发现 — 无需手动导入列表。