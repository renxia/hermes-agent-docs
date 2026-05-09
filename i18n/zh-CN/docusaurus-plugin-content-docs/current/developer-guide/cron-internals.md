---
sidebar_position: 11
title: "Cron 内部机制"
description: "Hermes 如何存储、调度、编辑、暂停、加载技能以及投递 cron 任务"
---

# Cron 内部机制

cron 子系统提供定时任务执行功能——从简单的单次延迟到具有技能注入和跨平台投递能力的周期性 cron 表达式任务。

## 关键文件

| 文件 | 用途 |
|------|------|
| `cron/jobs.py` | 任务模型、存储、对 `jobs.json` 的原子读写 |
| `cron/scheduler.py` | 调度器循环——到期任务检测、执行、重复次数跟踪 |
| `tools/cronjob_tools.py` | 面向模型的 `cronjob` 工具注册与处理器 |
| `gateway/run.py` | 网关集成——在长运行循环中进行 cron 滴答 |
| `hermes_cli/cron.py` | 命令行 `hermes cron` 子命令 |

## 调度模型

支持四种调度格式：

| 格式 | 示例 | 行为 |
|------|------|------|
| **相对延迟** | `30m`、`2h`、`1d` | 单次执行，在指定持续时间后触发 |
| **间隔** | `every 2h`、`every 30m` | 周期性执行，按固定间隔触发 |
| **Cron 表达式** | `0 9 * * *` | 标准 5 字段 cron 语法（分钟、小时、日、月、星期） |
| **ISO 时间戳** | `2025-01-15T09:00:00` | 单次执行，在精确时间触发 |

面向模型的接口是一个单一的 `cronjob` 工具，支持以下操作：`create`（创建）、`list`（列出）、`update`（更新）、`pause`（暂停）、`resume`（恢复）、`run`（运行）、`remove`（删除）。

## 任务存储

任务以原子写入语义存储在 `~/.hermes/cron/jobs.json` 中（先写入临时文件，再重命名）。每个任务记录包含：

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "每日简报",
  "prompt": "总结今日 AI 新闻与融资轮次",
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
|------|------|
| `scheduled` | 活跃状态，将在下次计划时间触发 |
| `paused` | 暂停状态——恢复前不会触发 |
| `completed` | 重复次数已耗尽或单次任务已执行 |
| `running` | 正在执行中（瞬时状态） |

### 向后兼容性

旧版本任务可能使用单个 `skill` 字段而非 `skills` 数组。调度器在加载时会将其标准化——将单个 `skill` 提升为 `skills: [skill]`。

## 调度器运行时

### 滴答周期

调度器按周期性滴答运行（默认：每 60 秒）：

```text
tick()
  1. 获取调度器锁（防止滴答重叠）
  2. 从 jobs.json 加载所有任务
  3. 筛选到期任务（next_run <= 当前时间 AND state == "scheduled"）
  4. 对每个到期任务：
     a. 将状态设为 "running"
     b. 创建全新的 AIAgent 会话（无对话历史）
     c. 按顺序加载附加技能（作为用户消息注入）
     d. 将任务提示通过智能体运行
     e. 将响应投递到配置的目标
     f. 更新运行次数，计算下次运行时间
     g. 若重复次数耗尽 → 状态 = "completed"
     h. 否则 → 状态 = "scheduled"
  5. 将更新后的任务写回 jobs.json
  6. 释放调度器锁
```

### 网关集成

在网关模式下，调度器在专用后台线程（`gateway/run.py` 中的 `_start_cron_ticker`）中运行，每 60 秒调用一次 `scheduler.tick()`，与消息处理并行。

在 CLI 模式下，cron 任务仅在运行 `hermes cron` 命令或处于活跃 CLI 会话期间触发。

### 全新会话隔离

每个 cron 任务在完全独立的智能体会话中运行：

- 无前次运行的对话历史
- 无前次 cron 执行的内存（除非持久化到内存/文件）
- 提示必须是自包含的——cron 任务不能提出澄清问题
- `cronjob` 工具集被禁用（递归防护）

## 技能支持的任务

cron 任务可通过 `skills` 字段附加一个或多个技能。执行时：

1. 技能按指定顺序加载  
2. 每个技能的 SKILL.md 内容作为上下文注入  
3. 任务的提示作为任务指令追加  
4. 智能体处理组合后的技能上下文 + 提示  

这使得可重用、经过测试的工作流成为可能，无需将完整指令粘贴到 cron 提示中。例如：

```
创建每日融资报告 → 附加 "ai-funding-daily-report" 技能
```

### 脚本支持的任务

任务还可通过 `script` 字段附加 Python 脚本。脚本在每次智能体轮询*之前*运行，其 stdout 作为上下文注入提示。这支持数据收集和变更检测模式：

```python
# ~/.hermes/scripts/check_competitors.py
import requests, json
# 获取竞争对手发布说明，与上次运行结果对比
# 将摘要打印到 stdout —— 智能体分析并报告
```

脚本超时默认为 120 秒。`_get_script_timeout()` 通过三层链解析限制：

1. **模块级覆盖** —— `_SCRIPT_TIMEOUT`（用于测试/猴子补丁）。仅当其与默认值不同时使用。
2. **环境变量** —— `HERMES_CRON_SCRIPT_TIMEOUT`
3. **配置** —— `config.yaml` 中的 `cron.script_timeout_seconds`（通过 `load_config()` 读取）
4. **默认值** —— 120 秒

### 提供商恢复

`run_job()` 将用户配置的备用提供商和凭据池传入 `AIAgent` 实例：

- **备用提供商** —— 从 `config.yaml` 读取 `fallback_providers`（列表）或 `fallback_model`（旧版字典），匹配网关的 `_load_fallback_model()` 模式。作为 `fallback_model=` 传递给 `AIAgent.__init__`，后者将两种格式统一为备用链。
- **凭据池** —— 通过 `agent.credential_pool` 的 `load_pool(provider)` 加载，使用解析后的运行时提供商名称。仅在池中有凭据时传递（`pool.has_credentials()`）。支持在 429/速率限制错误时进行同提供商密钥轮换。

这镜像了网关的行为——若无此机制，cron 智能体将在遇到速率限制时失败，而不会尝试恢复。

## 投递模型

cron 任务结果可投递至任何受支持的平台：

| 目标 | 语法 | 示例 |
|------|------|------|
| 原始聊天 | `origin` | 投递至创建任务的聊天 |
| 本地文件 | `local` | 保存至 `~/.hermes/cron/output/` |
| Telegram | `telegram` 或 `telegram:<chat_id>` | `telegram:-1001234567890` |
| Discord | `discord` 或 `discord:#channel` | `discord:#engineering` |
| Slack | `slack` | 投递至 Slack 主频道 |
| WhatsApp | `whatsapp` | 投递至 WhatsApp 主页 |
| Signal | `signal` | 投递至 Signal |
| Matrix | `matrix` | 投递至 Matrix 主页房间 |
| Mattermost | `mattermost` | 投递至 Mattermost 主页 |
| 邮件 | `email` | 通过邮件投递 |
| 短信 | `sms` | 通过短信投递 |
| Home Assistant | `homeassistant` | 投递至 HA 对话 |
| 钉钉 | `dingtalk` | 投递至钉钉 |
| 飞书 | `feishu` | 投递至飞书 |
| 企业微信 | `wecom` | 投递至企业微信 |
| 微信 | `weixin` | 投递至微信 |
| BlueBubbles | `bluebubbles` | 通过 BlueBubbles 投递至 iMessage |
| QQ 机器人 | `qqbot` | 通过官方 API v2 投递至 QQ（腾讯） |

对于 Telegram 主题，使用格式 `telegram:<chat_id>:<thread_id>`（例如：`telegram:-1001234567890:17585`）。

### 响应包装

默认情况下（`cron.wrap_response: true`），cron 投递会被包装：
- 头部标识 cron 任务名称和任务
- 脚注说明智能体无法在对话中看到投递的消息

cron 响应中的 `[SILENT]` 前缀会完全抑制投递——适用于仅需写入文件或执行副作用的任务。

### 会话隔离

cron 投递**不会**镜像到网关会话对话历史中。它们仅存在于 cron 任务自身的会话中。这可防止目标聊天对话中的消息交替违规。

## 递归防护

cron 运行的会话中 `cronjob` 工具集被禁用。这可防止：
- 计划任务创建新的 cron 任务
- 可能导致 token 使用量爆炸的递归调度
- 任务内部意外修改任务调度

## 锁机制

调度器使用跨进程文件锁（Unix 上为 `fcntl.flock`，Windows 上为 `msvcrt.locking`）防止重叠的滴答重复执行同一批到期任务——即使在网关进程内滴答与独立 `hermes cron` / 手动 `tick()` 调用之间也是如此。若无法获取锁，`tick()` 立即返回 0。

## CLI 接口

`hermes cron` CLI 提供直接的任务管理：

```bash
hermes cron list                    # 显示所有任务
hermes cron create                  # 交互式任务创建（别名：add）
hermes cron edit <job_id>           # 编辑任务配置
hermes cron pause <job_id>          # 暂停运行中的任务
hermes cron resume <job_id>         # 恢复暂停的任务
hermes cron run <job_id>            # 触发立即执行
hermes cron remove <job_id>         # 删除任务
```

## 相关文档

- [Cron 功能指南](/docs/user-guide/features/cron)
- [网关内部机制](./gateway-internals.md)
- [智能体循环内部机制](./agent-loop.md)