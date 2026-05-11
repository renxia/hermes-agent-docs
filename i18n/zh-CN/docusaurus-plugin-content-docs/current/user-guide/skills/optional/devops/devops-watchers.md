---
title: "监视器 — 通过水印去重轮询 RSS、JSON API 和 GitHub"
sidebar_label: "监视器"
description: "通过水印去重轮询 RSS、JSON API 和 GitHub"
---

{/* 本页面由网站脚本 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 监视器

通过水印去重轮询 RSS、JSON API 和 GitHub。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/devops/watchers` 安装 |
| 路径 | `optional-skills/devops/watchers` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos |
| 标签 | `cron`, `轮询`, `rss`, `github`, `http`, `自动化`, `监控` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# 监视器

按间隔轮询外部源，仅对新条目做出反应。提供三个现成的脚本和一个共享的水印辅助工具；将它们接入 cron 作业（或从终端临时运行）。

## 何时使用

- 用户想要监视一个 RSS/Atom 源并获得新条目通知
- 用户想要监视一个 GitHub 仓库的 issue / pull request / 发布 / 提交
- 用户想要轮询一个任意的 JSON 端点并在有新项目时获得通知
- 用户要求“为 X 提供一个监视器”或“当 X 变化时通知我”

## 心智模型

一个监视器就是一个脚本，其作用是：

1. 从外部源获取数据
2. 与一个包含先前已见 ID 的水印文件进行比对
3. 将新的水印写回文件
4. 将新项目打印到标准输出（无变化则不输出）

下面的脚本处理了所有三个方面。智能体通过终端工具运行它们——来自 cron 作业、webhook 或交互式聊天——并报告新内容。

## 现成脚本

技能安装后，这三个脚本都位于 `$HERMES_HOME/skills/devops/watchers/scripts/`。每个脚本都会读取 `WATCHER_STATE_DIR`（默认为 `$HERMES_HOME/watcher-state/`）来获取其状态文件，文件名由 `--name` 参数指定。

| 脚本 | 监视内容 | 去重键 |
|---|---|---|
| `watch_rss.py` | RSS 2.0 或 Atom 源 URL | `<guid>` / `<id>` |
| `watch_http_json.py` | 任何返回对象列表的 JSON 端点 | 可配置的 id 字段 |
| `watch_github.py` | GitHub 仓库的 issue / pull request / 发布 / 提交 | `id` / `sha` |

这三个脚本共同特点：

- 首次运行会记录一个基线——不会回放现有的源
- 水印是一个有界的 ID 集合（最大 500），以限制内存占用
- 输出格式：每个项目为 `## <标题>\n<URL>\n\n<可选正文>`
- 无新内容时标准输出为空——调用者将其视为静默
- 获取错误时以非零状态退出

## 用法

直接从终端工具运行一个监视器：

```bash
python $HERMES_HOME/skills/devops/watchers/scripts/watch_rss.py \
  --name hn --url https://news.ycombinator.com/rss --max 5
```

监视一个 GitHub 仓库（在 `~/.hermes/.env` 中设置 `GITHUB_TOKEN` 以避免每小时 60 次请求的匿名速率限制）：

```bash
python $HERMES_HOME/skills/devops/watchers/scripts/watch_github.py \
  --name hermes-issues --repo NousResearch/hermes-agent --scope issues
```

轮询一个任意的 JSON API：

```bash
python $HERMES_HOME/skills/devops/watchers/scripts/watch_http_json.py \
  --name api --url https://api.example.com/events \
  --id-field event_id --items-path data.events
```

## 接入 cron

用类似以下的提示让智能体安排一个 cron 作业：

> 每 15 分钟，运行 `watch_rss.py --name hn --url https://news.ycombinator.com/rss`。如果它输出了任何内容，总结标题并发送给我。如果它没有输出，则保持静默。

智能体在 cron 作业的智能体循环中通过终端工具调用脚本；无需更改 cron 内置的 `--script` 标志。

## 状态文件

每个监视器都会写入 `$HERMES_HOME/watcher-state/<name>.json`。检查：

```bash
cat $HERMES_HOME/watcher-state/hn.json
```

强制重新回放（下次运行视为首次轮询）：

```bash
rm $HERMES_HOME/watcher-state/hn.json
```

## 编写你自己的监视器

所有三个脚本都使用相同的模板：加载水印、获取数据、比对差异、保存、输出。`scripts/_watermark.py` 是共享的辅助工具；导入它即可免费获得原子写入、有界 ID 集合和首次运行基线功能。参见任何一个参考脚本，了解其所需的样板代码有多简单。

## 常见陷阱

1.  **每个周期都打印“无新项目”的标题。** 调用者依赖于标准输出为空 = 静默。如果你在空差异时打印任何内容，就会骚扰频道。附带的脚本已处理此问题；自定义脚本也必须如此。
2.  **期望首次运行就输出项目。** 它不会——首次运行记录的是一个基线。如果你需要初始摘要，请在首次运行后删除状态文件，或在自己的脚本中添加一个 `--prime-with-latest N` 标志。
3.  **水印无限增长。** 共享辅助工具限制为 500 个 ID。对于高变动源可提高此限制；在受约束的文件系统上可降低此限制。
4.  **将状态目录放在智能体沙盒无法写入的位置。** `$HERMES_HOME/watcher-state/` 始终可写。Docker/Modal 后端可能无法识别任意的主机路径。