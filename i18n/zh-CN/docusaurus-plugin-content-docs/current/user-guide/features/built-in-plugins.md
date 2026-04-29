---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "随 Hermes 智能体一起发布并通过生命周期钩子自动运行的插件 —— 如磁盘清理等"
---

# 内置插件

Hermes 随仓库捆绑了一小部分插件。它们位于 `<repo>/plugins/<name>/` 目录下，并会与用户安装的插件（位于 `~/.hermes/plugins/`）一同自动加载。它们使用与第三方插件相同的插件接口 —— 钩子、工具、斜杠命令 —— 只是由项目内部维护。

请参阅 [插件](/docs/user-guide/features/plugins) 页面了解通用插件系统，以及 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) 页面来编写您自己的插件。

## 发现机制如何工作

`PluginManager` 按顺序扫描四个来源：

1. **捆绑插件** —— `<repo>/plugins/<name>/`（本文档所描述的内容）
2. **用户插件** —— `~/.hermes/plugins/<name>/`
3. **项目插件** —— `./.hermes/plugins/<name>/`（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4. **Pip 入口点** —— `hermes_agent.plugins`

当名称冲突时，后面的来源优先 —— 一个名为 `disk-cleanup` 的用户插件将替换捆绑版本。

`plugins/memory/` 和 `plugins/context_engine/` 被故意排除在捆绑插件扫描之外。这些目录使用自己的发现路径，因为内存提供者和上下文引擎是通过配置中的 `hermes memory setup` / `context.engine` 配置的单选提供者。

## 捆绑插件需手动启用

捆绑插件默认是禁用的。发现机制会找到它们（它们会出现在 `hermes plugins list` 和交互式 `hermes plugins` 界面中），但在您显式启用之前不会加载：

```bash
hermes plugins enable disk-cleanup
```

或通过 `~/.hermes/config.yaml`：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这与用户安装插件使用的机制相同。捆绑插件永远不会自动启用 —— 无论是全新安装，还是现有用户升级到较新版本的 Hermes。您始终需要显式选择启用。

要再次关闭捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或者：从 config.yaml 的 plugins.enabled 中移除它
```

## 当前已发布的捆绑插件

### disk-cleanup

自动跟踪并删除会话期间创建的临时文件 —— 测试脚本、临时输出、cron 日志、过期的 Chrome 配置文件 —— 而无需智能体记住调用某个工具。

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 内创建匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，静默将其跟踪为 `test` / `temp` / `cron-output`。 |
| `on_session_end` | 如果当前轮次中自动跟踪了任何测试文件，则运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 是否确认 |
|---|---|---|
| `test` | 每轮会话结束时 | 从不 |
| `temp` | 跟踪时间 >7 天 | 从不 |
| `cron-output` | 跟踪时间 >14 天 | 从不 |
| `HERMES_HOME` 下的空目录 | 总是 | 从不 |
| `research` | >30 天，且不在最新的 10 个文件中 | 总是（仅深度清理） |
| `chrome-profile` | 跟踪时间 >14 天 | 总是（仅深度清理） |
| 文件 >500 MB | 从不自动删除 | 总是（仅深度清理） |

**斜杠命令** —— `/disk-cleanup` 在 CLI 和网关会话中均可用：

```
/disk-cleanup status                     # 分类统计 + 最大的 10 个文件
/disk-cleanup dry-run                    # 预览但不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项目
/disk-cleanup track <path> <category>    # 手动跟踪
/disk-cleanup forget <path>              # 停止跟踪（不删除）
```

**状态** —— 所有数据位于 `$HERMES_HOME/disk-cleanup/`：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 跟踪的路径及其类别、大小和时间戳 |
| `tracked.json.bak` | 上述文件的原子写入备份 |
| `cleanup.log` | 仅追加的审计日志，记录每次跟踪 / 跳过 / 拒绝 / 删除操作 |

**安全性** —— 清理操作仅影响 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。Windows 挂载（`/mnt/c/...`）会被拒绝。众所周知的顶级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 自身）即使为空也永远不会被删除 —— 全新安装不会在第一轮会话结束时被清空。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 中勾选复选框）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

### observability/langfuse

将 Hermes 轮次、LLM 调用和工具调用追踪到 [Langfuse](https://langfuse.com) —— 一个开源的 LLM 可观测性平台。每轮一个 span，每次 API 调用一个 generation，每次工具调用一个 tool observation。使用总量、每类 token 计数和成本估算来自 Hermes 规范的 `agent.usage_pricing` 数据，因此 Langfuse 仪表板看到的分解（输入 / 输出 / `cache_read_input_tokens` / `cache_creation_input_tokens` / `reasoning_tokens`）与 `hermes logs` 中显示的一致。

该插件是“失败开放”的：未安装 SDK、无凭据，或 Langfuse 出现瞬时错误 —— 所有情况都会导致钩子静默无操作。智能体循环永远不会受到影响。

**设置（交互式 —— 推荐）：**

```bash
hermes tools          # → Langfuse 可观测性 → 云端或自托管
```

向导会收集您的密钥，执行 `pip install` 安装 `langfuse` SDK，并将 `observability/langfuse` 添加到 `plugins.enabled`。重启 Hermes 后，下一轮将发送追踪数据。

**设置（手动）：**

```bash
pip install langfuse
hermes plugins enable observability/langfuse
```

然后将凭据放入 `~/.hermes/.env`：

```bash
HERMES_LANGFUSE_PUBLIC_KEY=pk-lf-...
HERMES_LANGFUSE_SECRET_KEY=sk-lf-...
HERMES_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # 或您的自托管 URL
```

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `pre_api_request` / `pre_llm_call` | 打开（或复用）每轮的根 span “Hermes turn”。为此 API 调用启动一个 `generation` 子观察，并将序列化的最近消息作为输入。 |
| `post_api_request` / `post_llm_call` | 关闭 generation，附加 `usage_details`、`cost_details`、`finish_reason`、助手输出 + 工具调用。如果没有工具调用且内容非空，则关闭本轮。 |
| `pre_tool_call` | 使用清理后的 `args` 启动一个 `tool` 子观察。 |
| `post_tool_call` | 使用清理后的 `result` 关闭工具观察。`read_file` 的有效载荷会被摘要（开头 + 结尾 + 省略行数），以便大文件读取保持在 `HERMES_LANGFUSE_MAX_CHARS` 限制内。 |

会话分组基于 Hermes 会话 ID（或子智能体的任务 ID）通过 `langfuse.propagate_attributes` 实现，因此单个 `hermes chat` 会话中的所有数据都位于一个 Langfuse 会话下。

**验证：**

```bash
hermes plugins list                 # observability/langfuse 应显示“已启用”
hermes chat -q "hello"              # 在 Langfuse 界面中检查“Hermes turn”追踪
```

**可选调优**（在 `.env` 中）：

| 变量 | 默认值 | 用途 |
|---|---|---|
| `HERMES_LANGFUSE_ENV` | — | 追踪的环境标签（`production`、`staging` 等） |
| `HERMES_LANGFUSE_RELEASE` | — | 发布/版本标签 |
| `HERMES_LANGFUSE_SAMPLE_RATE` | `1.0` | 传递给 SDK 的采样率（0.0–1.0） |
| `HERMES_LANGFUSE_MAX_CHARS` | `12000` | 消息内容 / 工具参数 / 工具结果的每字段截断长度 |
| `HERMES_LANGFUSE_DEBUG` | `false` | 向 `agent.log` 输出详细的插件日志 |

同时支持 Hermes 前缀和标准 SDK 环境变量（`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`、`LANGFUSE_BASE_URL`）—— 当两者都设置时，Hermes 前缀的变量优先。

**性能：** Langfuse 客户端在首次钩子调用后被缓存。如果缺少凭据或 SDK，该决定也会被缓存 —— 后续钩子将快速返回，无需重新检查环境变量或重新加载配置。

**禁用：** `hermes plugins disable observability/langfuse`。插件模块仍会被发现，但在重新启用之前不会运行任何模块代码。

## 添加捆绑插件

捆绑插件的编写方式与任何其他 Hermes 插件完全相同 —— 请参阅 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)。唯一的区别是：

- 目录位于 `<repo>/plugins/<name>/` 而非 `~/.hermes/plugins/<name>/`
- 在 `hermes plugins list` 中，清单来源报告为 `bundled`
- 同名用户插件会覆盖捆绑版本

一个插件适合捆绑的情况包括：

- 它没有可选依赖（或这些依赖已经是 `pip install .[all]` 的依赖）
- 其行为对大多数用户有益，且是“默认启用但可关闭”而非“默认关闭需手动启用”
- 其逻辑与生命周期钩子相关，否则智能体需要记住调用
- 它补充了核心功能，但不会扩展模型可见的工具接口

反例 —— 应保持为用户可安装插件而非捆绑插件的情况：需要 API 密钥的第三方集成、小众工作流、大型依赖树、任何会显著改变智能体默认行为的内容。