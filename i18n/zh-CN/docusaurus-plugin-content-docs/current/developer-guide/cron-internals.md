---
sidebar_position: 11
title: "Cron Internals"
description: "How Hermes stores, schedules, edits, pauses, skill-loads, and delivers cron jobs"
---

# Cron 内部机制

Cron 子系统提供定时任务执行功能——从简单的单次延迟任务到带有技能注入和跨平台交付的周期性 cron 表达式任务。

## 关键文件

| 文件 | 用途 |
|------|---------|
| `cron/jobs.py` | 任务模型、存储、对 `jobs.json` 的原子读写 |
| `cron/scheduler.py` | 调度器循环 — 发现到期任务、执行、重复次数跟踪 |
| `tools/cronjob_tools.py` | 面向模型的 `cronjob` 工具注册和处理器 |
| `gateway/run.py` | 网关集成 — 在长期运行循环中执行 cron 计时 |
| `hermes_cli/cron.py` | CLI `hermes cron` 子命令 |

## 调度模型

支持四种调度格式：

| 格式 | 示例 | 行为 |
|--------|---------|----------|
| **相对延迟** | `30m`, `2h`, `1d` | 单次触发，在指定持续时间后执行 |
| **间隔** | `every 2h`, `every 30m` | 周期性，在固定间隔触发 |
| **Cron 表达式** | `0 9 * * *` | 标准 5 字段 cron 语法（分钟，小时，日，月，周几） |
| **ISO 时间戳** | `2025-01-15T09:00:00` | 单次触发，在精确时间执行 |

面向模型的接口是一个单一的 `cronjob` 工具，具有动作式操作：`create`（创建）、`list`（列出）、`update`（更新）、`pause`（暂停）、`resume`（恢复）、`run`（运行）、`remove`（删除）。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json` 中，具有原子写入语义（写入临时文件，然后重命名）。每个任务记录包含：

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "每日简报",
  "prompt": "总结今日的 AI 新闻和融资轮次",
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * *",
    "display": "0 9 * * *"
  },
  "skills": ["ai-funding-daily-report"],
  "deliver": "telegram:-1001234567890",
  "repeat": {
    "times": null,
    "completed": 42
  },
  "state": "scheduled",
  "enabled": true,
  "next_run_at": "2025-01-16T09:00:00Z",
  "last_run_at": "2025-01-15T09:00:00Z",
  "last_status": "ok",
  "created_at": "2025-01-01T00:00:00Z",
  "model": null,
  "provider": null,
  "script": null
}
```

### 任务生命周期状态

| 状态 | 含义 |
|-------|---------|
| `scheduled` | 活动状态，将在下次计划时间触发 |
| `paused` | 暂停 — 直到恢复不会触发 |
| `completed` | 重复次数用尽或单次任务已触发 |
| `running` | 正在执行（瞬态状态） |

### 向后兼容性

较旧的任务可能使用单个 `skill` 字段而不是 `skills` 数组。调度器在加载时会标准化这一点 — 单个 `skill` 会提升为 `skills: [skill]`。

## 调度器运行时

### 滴答周期 (Tick Cycle)

调度器以周期性滴答运行（默认：每 60 秒）：

```text
tick()
  1. 获取调度器锁（防止滴答重叠）
  2. 从 jobs.json 加载所有任务
  3. 过滤出到期任务（next_run <= now 且 state == "scheduled"）
  4. 对每个到期任务：
     a. 将状态设置为 "running"
     b. 创建全新的 AIAgent 会话（无对话历史）
     c. 按顺序加载附加的技能（注入为用户消息）
     d. 通过代理运行任务提示
     e. 将响应交付给配置的目标
     f. 更新运行次数，计算 next_run
     g. 如果重复次数用尽 → state = "completed"
     h. 否则 → state = "scheduled"
  5. 将更新后的任务写回 jobs.json
  6. 释放调度器锁
```

### 网关集成

在网关模式下，调度器滴答集成到网关的主事件循环中。网关在其周期性维护周期调用 `scheduler.tick()`，该调用与消息处理并行运行。

在 CLI 模式下，只有在运行 `hermes cron` 命令或在活跃的 CLI 会话期间，cron 任务才会触发。

### 新会话隔离

每个 cron 任务都在一个完全全新的代理会话中运行：

- 没有来自先前运行的对话历史
- 没有先前 cron 执行的记忆（除非持久化到内存/文件）
- 提示必须是自包含的 — cron 任务不能提出澄清问题
- `cronjob` 工具集被禁用（防止递归）

## 技能支持任务

cron 任务可以通过 `skills` 字段附加一个或多个技能。在执行时：

1. 按照指定的顺序加载技能
2. 每个技能的 SKILL.md 内容作为上下文注入
3. 任务的提示作为任务指令附加
4. 代理处理结合的技能上下文 + 提示

这使得可以在不将完整指令粘贴到 cron 提示中的情况下，实现可重用、可测试的工作流。例如：

```
创建每日融资报告 → 附加 "ai-funding-daily-report" 技能
```

### 脚本支持任务

任务还可以通过 `script` 字段附加一个 Python 脚本。该脚本在每次代理回合*之前*运行，其标准输出 (stdout) 作为上下文注入到提示中。这使得数据收集和变更检测模式成为可能：

```python
# ~/.hermes/scripts/check_competitors.py
import requests, json
# 获取竞争对手的发布说明，与上次运行进行差异比较
# 将摘要打印到 stdout — 代理进行分析并报告
```

脚本超时默认设置为 120 秒。`_get_script_timeout()` 通过三层链解析限制：

1. **模块级覆盖** — `_SCRIPT_TIMEOUT`（用于测试/猴子补丁）。仅在与默认值不同时使用。
2. **环境变量** — `HERMES_CRON_SCRIPT_TIMEOUT`
3. **配置** — `config.yaml` 中的 `cron.script_timeout_seconds`（通过 `load_config()` 读取）
4. **默认值** — 120 秒

### 提供商恢复

`run_job()` 将用户配置的故障转移提供商和凭证池传递给 `AIAgent` 实例：

- **故障转移提供商** — 从 `config.yaml` 读取 `fallback_providers` (列表) 或 `fallback_model` (旧字典)，匹配网关的 `_load_fallback_model()` 模式。作为 `fallback_model=` 传递给 `AIAgent.__init__`，该方法将这两种格式标准化为一个故障转移链。
- **凭证池** — 通过 `load_pool(provider)` 从 `agent.credential_pool` 加载，使用解析后的运行时提供商名称。仅在凭证池包含凭证时才传递 (`pool.has_credentials()`)。这使得在遇到 429/速率限制错误时，可以实现相同提供商的密钥轮换。

这模仿了网关的行为——如果没有它，cron 代理在遇到速率限制时将无法尝试恢复而直接失败。

## 交付模型

cron 任务的结果可以交付到任何支持的平台：

| 目标 | 语法 | 示例 |
|--------|--------|---------|
| 原始聊天 | `origin` | 交付到创建任务的聊天中 |
| 本地文件 | `local` | 保存到 `~/.hermes/cron/output/` |
| Telegram | `telegram` 或 `telegram:<chat_id>` | `telegram:-1001234567890` |
| Discord | `discord` 或 `discord:#channel` | `discord:#engineering` |
| Slack | `slack` | 交付到 Slack 主频道 |
| WhatsApp | `whatsapp` | 交付到 WhatsApp 主界面 |
| Signal | `signal` | 交付到 Signal |
| Matrix | `matrix` | 交付到 Matrix 主房间 |
| Mattermost | `mattermost` | 交付到 Mattermost 主界面 |
| Email | `email` | 通过电子邮件交付 |
| SMS | `sms` | 通过短信交付 |
| Home Assistant | `homeassistant` | 交付到 HA 对话中 |
| DingTalk | `dingtalk` | 交付到 DingTalk |
| Feishu | `feishu` | 交付到飞书 |
| WeCom | `wecom` | 交付到企业微信 |
| Weixin | `weixin` | 交付到微信 (WeChat) |
| BlueBubbles | `bluebubbles` | 通过 BlueBubbles 交付到 iMessage |
| QQ Bot | `qqbot` | 通过官方 API v2 交付到 QQ (Tencent) |

对于 Telegram 主题，请使用格式 `telegram:<chat_id>:<thread_id>`（例如，`telegram:-1001234567890:17585`）。

### 响应包装

默认情况下（`cron.wrap_response: true`），cron 交付物会包含包装：
- 一个标识 cron 任务名称和任务的头部
- 一个注明代理无法在对话中看到交付消息的底部

cron 响应中的 `[SILENT]` 前缀会完全抑制交付——这对于只需要写入文件或执行副作用的任务非常有用。

### 会话隔离

cron 交付物不会镜像到网关会话对话历史中。它们只存在于 cron 任务自身的会话中。这可以防止目标聊天对话中出现消息交替违规。

## 递归保护

cron 运行的会话会禁用 `cronjob` 工具集。这可以防止：
- 计划任务创建新的 cron 任务
- 可能导致 token 使用爆炸的递归调度
- 从任务内部意外修改任务计划

## 锁定机制

调度器使用基于文件的锁定机制，以防止重叠的滴答执行两次相同的到期任务批次。这在网关模式中尤为重要，因为如果前一个滴答耗时超过滴答间隔，多个维护周期可能会重叠。

## CLI 接口

`hermes cron` CLI 提供直接的任务管理：

```bash
hermes cron list                    # 显示所有任务
hermes cron create                  # 交互式任务创建 (别名: add)
hermes cron edit <job_id>           # 编辑任务配置
hermes cron pause <job_id>          # 暂停正在运行的任务
hermes cron resume <job_id>         # 恢复已暂停的任务
hermes cron run <job_id>            # 触发立即执行
hermes cron remove <job_id>         # 删除任务
```

## 相关文档

- [Cron 功能指南](/docs/user-guide/features/cron)
- [网关内部机制](./gateway-internals.md)
- [代理循环内部机制](./agent-loop.md)