---
sidebar_position: 12
sidebar_label: "内置插件"
title: "内置插件"
description: "Hermes Agent 附带的插件，通过生命周期钩子自动运行 — 如 disk-cleanup 等"
---

# 内置插件

Hermes 随仓库捆绑了一小部分插件。它们位于 `<repo>/plugins/<name>/` 目录下，并会与用户安装的插件（位于 `~/.hermes/plugins/`）一起自动加载。它们使用与第三方插件相同的插件接口 — 钩子、工具、斜杠命令 — 只是维护在代码库内部。

请参阅 [插件](/docs/user-guide/features/plugins) 页面了解通用插件系统，以及 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin) 来编写您自己的插件。

## 发现机制如何工作

`PluginManager` 按顺序扫描四个来源：

1. **捆绑插件** — `<repo>/plugins/<name>/`（本文档所描述的内容）
2. **用户插件** — `~/.hermes/plugins/<name>/`
3. **项目插件** — `./.hermes/plugins/<name>/`（需要设置 `HERMES_ENABLE_PROJECT_PLUGINS=1`）
4. **Pip 入口点** — `hermes_agent.plugins`

当出现名称冲突时，后面的来源优先 — 一个名为 `disk-cleanup` 的用户插件将替换捆绑版本。

`plugins/memory/` 和 `plugins/context_engine/` 被有意排除在捆绑插件扫描之外。这些目录使用自己的发现路径，因为内存提供者和上下文引擎是通过配置中的 `hermes memory setup` / `context.engine` 配置的单选提供者。

## 捆绑插件需手动启用

捆绑插件默认是禁用的。发现机制会找到它们（它们会出现在 `hermes plugins list` 和交互式的 `hermes plugins` 界面中），但在您显式启用它们之前不会加载：

```bash
hermes plugins enable disk-cleanup
```

或通过 `~/.hermes/config.yaml`：

```yaml
plugins:
  enabled:
    - disk-cleanup
```

这与用户安装插件使用的机制相同。捆绑插件永远不会自动启用 — 无论是全新安装，还是现有用户升级到较新版本的 Hermes。您始终需要显式选择启用。

要再次关闭一个捆绑插件：

```bash
hermes plugins disable disk-cleanup
# 或者：从 config.yaml 的 plugins.enabled 中移除它
```

## 当前附带的插件

### disk-cleanup

自动跟踪并删除会话期间创建的临时文件 — 测试脚本、临时输出、cron 日志、过期的 Chrome 配置文件 — 而无需智能体记得调用某个工具。

**工作原理：**

| 钩子 | 行为 |
|---|---|
| `post_tool_call` | 当 `write_file` / `terminal` / `patch` 在 `HERMES_HOME` 或 `/tmp/hermes-*` 内创建匹配 `test_*`、`tmp_*` 或 `*.test.*` 的文件时，将其静默跟踪为 `test` / `temp` / `cron-output`。 |
| `on_session_end` | 如果本轮会话中自动跟踪了任何测试文件，则运行安全的 `quick` 清理并记录一行摘要。否则保持静默。 |

**删除规则：**

| 类别 | 阈值 | 确认 |
|---|---|---|
| `test` | 每次会话结束 | 从不 |
| `temp` | 跟踪时间 >7 天 | 从不 |
| `cron-output` | 跟踪时间 >14 天 | 从不 |
| `HERMES_HOME` 下的空目录 | 总是 | 从不 |
| `research` | >30 天，且不在最新的 10 个之内 | 总是（仅深度清理） |
| `chrome-profile` | 跟踪时间 >14 天 | 总是（仅深度清理） |
| 文件 >500 MB | 从不自动删除 | 总是（仅深度清理） |

**斜杠命令** — `/disk-cleanup` 在 CLI 和网关会话中均可用：

```
/disk-cleanup status                     # 分类统计 + 最大的 10 个文件
/disk-cleanup dry-run                    # 预览但不删除
/disk-cleanup quick                      # 立即运行安全清理
/disk-cleanup deep                       # quick + 列出需要确认的项目
/disk-cleanup track <path> <category>    # 手动跟踪
/disk-cleanup forget <path>              # 停止跟踪（不删除）
```

**状态** — 所有数据都位于 `$HERMES_HOME/disk-cleanup/`：

| 文件 | 内容 |
|---|---|
| `tracked.json` | 跟踪的路径及其类别、大小和时间戳 |
| `tracked.json.bak` | 上述文件的原子写入备份 |
| `cleanup.log` | 仅追加的审计日志，记录每次跟踪 / 跳过 / 拒绝 / 删除操作 |

**安全性** — 清理操作仅会触及 `HERMES_HOME` 或 `/tmp/hermes-*` 下的路径。Windows 挂载（`/mnt/c/...`）会被拒绝。众所周知的顶级状态目录（`logs/`、`memories/`、`sessions/`、`cron/`、`cache/`、`skills/`、`plugins/`、`disk-cleanup/` 自身）即使为空也永远不会被移除 — 全新安装不会在首次会话结束时被清空。

**启用：** `hermes plugins enable disk-cleanup`（或在 `hermes plugins` 中勾选复选框）。

**再次禁用：** `hermes plugins disable disk-cleanup`。

## 添加一个捆绑插件

捆绑插件的编写方式与任何其他 Hermes 插件完全相同 — 请参阅 [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)。唯一的区别是：

- 目录位于 `<repo>/plugins/<name>/` 而不是 `~/.hermes/plugins/<name>/`
- 在 `hermes plugins list` 中，清单来源显示为 `bundled`
- 同名用户插件会覆盖捆绑版本

一个插件适合捆绑的条件是：

- 它没有可选依赖项（或其依赖项已经是 `pip install .[all]` 的依赖项）
- 其行为对大多数用户有益，且是默认关闭而非默认开启
- 其逻辑与生命周期钩子相关联，否则智能体将不得不记得调用
- 它补充了核心功能，而不会扩展模型可见的工具接口

反例 — 应保持为用户可安装插件，而非捆绑插件的内容：带有 API 密钥的第三方集成、小众工作流、大型依赖树、任何会显著改变智能体默认行为的内容。