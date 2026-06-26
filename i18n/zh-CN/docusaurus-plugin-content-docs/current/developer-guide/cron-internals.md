---
sidebar_position: 11
title: "Cron Internals"
description: "How Hermes stores, schedules, edits, pauses, skill-loads, and delivers cron jobs"
---

# Cron 内部机制

cron 子系统提供定时任务执行功能——从简单的一次性延迟到支持技能注入和跨平台投递的循环 cron 表达式任务。

## 关键文件

| 文件 | 用途 |
|------|---------|
| `cron/jobs.py` | 任务模型、存储、对 `jobs.json` 的原子读写 |
| `cron/scheduler.py` | 调度循环——到期任务检测、执行、重复跟踪 |
| `tools/cronjob_tools.py` | 面向模型的 `cronjob` 工具注册与处理器 |
| `gateway/run.py` | 网关集成——在长运行循环中的 cron 滴答 |
| `hermes_cli/cron.py` | CLI `hermes cron` 子命令 |

## 调度模型

支持四种调度格式：

| 格式 | 示例 | 行为 |
|--------|---------|----------|
| **相对延迟** | `30m`, `2h`, `1d` | 一次性，在指定时长后触发 |
| **间隔** | `every 2h`, `every 30m` | 循环，按固定间隔触发 |
| **Cron 表达式** | `0 9 * * *` | 标准 5 字段 cron 语法（分钟、小时、日、月、星期） |
| **ISO 时间戳** | `2025-01-15T09:00:00` | 一次性，在精确时间触发 |

面向模型的接口是一个单一的 `cronjob` 工具，支持操作式命令：`create`、`list`、`update`、`pause`、`resume`、`run`、`remove`。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json` 中，采用原子写入语义（先写入临时文件，再重命名）。每条任务记录包含：

```json
{
  "id": "a1b2c3d4e5f6",
  "name": "每日简报",
  "prompt": "总结今天的 AI 新闻和融资动态",
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
| `scheduled` | 活跃，将在下次调度时间触发 |
| `paused`  | 已暂停 — 直到恢复前不会触发 |
| `completed` | 循环次数已耗尽或一次性任务已触发 |
| `running` | 正在执行（瞬时状态） |

### 向后兼容

旧版任务可能使用单一的 `skill` 字段而非 `skills` 数组。调度器在加载时将其规范化——单一的 `skill` 会被提升为 `skills: [skill]`。

## 调度器运行时

### 滴答周期

调度器按周期性滴答运行（默认：每 60 秒）：

```text
tick()
  1. 获取调度器锁（防止滴答重叠）
  2. 从 jobs.json 加载所有任务
  3. 过滤到期任务（next_run <= 当前时间 且 state == "scheduled"）
  4. 对每个到期任务：
     a. 将状态设为 "running"
     b. 创建全新的 AIAgent 会话（无对话历史）
     c. 按顺序加载关联的技能（作为用户消息注入）
     d. 通过智能体运行任务提示词
     e. 将响应投递到配置的目标
     f. 更新 run_count，计算 next_run
     g. 如果循环次数耗尽 → state = "completed"
     h. 否则 → state = "scheduled"
  5. 将更新后的任务写回 jobs.json
  6. 释放调度器锁
```

### 网关集成

在网关模式下，cron **触发器**（决定*何时*触发到期任务的部分——"B 轴"）通过可插拔的 `CronScheduler` 提供者选择。网关调用 `resolve_cron_scheduler()`（`cron/scheduler_provider.py`），并在专用后台线程中运行已解析提供者的 `start()`，与独立的网关维护线程并行运行。

活动提供者由 `cron.provider` 配置键决定：

- **空（默认）** → 内置的 `InProcessCronScheduler`，每 60 秒运行一次调用 `scheduler.tick()` 的历史进程内循环。这与提供者出现之前的行为字节级一致。
- **命名提供者**（例如 `chronos`，用于缩零部署的托管 cron 提供者）→ 从 `plugins/cron/<name>/` 或 `$HERMES_HOME/plugins/<name>/` 发现。

如果命名提供者缺失、加载失败或报告 `is_available() == False`，解析器会回退到内置提供者并发出警告——**cron 永远不会失去触发器。** 内置提供者位于核心代码（`cron/scheduler_provider.py`）中，不在 `plugins/` 中，因此回退机制不会被意外移除。

"触发"的*含义*（任务执行 + 投递）保持不变，由所有提供者共享——它仍在 `scheduler.run_job()` / `scheduler._deliver_result()` 中。提供者仅控制触发，从不控制执行。

在 CLI 模式下，cron 任务仅在运行 `hermes cron` 命令或处于活跃 CLI 会话时触发。

### 用于缩零的托管 cron（Chronos）

托管网关可以运行 **Chronos** 提供者（`cron.provider: chronos`）替代内置滴答器。Chronos 允许空闲网关**缩零**同时仍能触发 cron 任务：它不使用 60 秒的进程内循环（这会使进程保持活跃），而是请求 Nous 基础设施在任务的真实下次触发时间设置**一个托管的一次性触发**。在触发时，Nous 通过认证的 webhook（`POST /api/cron/fire`）回调网关；网关通过与内置相同的 `run_one_job` 路径运行任务，然后重新设置下一个一次性触发。在两次触发之间，进程可以完全停止——它仅在真正的触发时唤醒，绝不会被周期性定时器唤醒。

流程（托管调度器由 Nous 提供；智能体不持有任何调度凭证）：

```
创建/更新 cron 任务
  → Chronos 请求 Nous 在任务的 next_run_at 设置一次性触发
      （使用智能体已有的 Nous 令牌进行认证）
  → 触发时 Nous 调用网关：POST {callback_url}/api/cron/fire
      （使用短生命周期的、用途范围的 Nous 签发的 JWT 进行认证）
  → 网关验证令牌，认领任务（存储层 compare-and-set 确保多副本部署最多触发一次），运行任务，并重新设置下一个一次性触发
```

配置（全部非机密；在托管智能体上 Nous 在配置时设置）：

| 键 | 含义 |
|---|---|
| `cron.provider` | 设为 `chronos` 以激活（空 = 内置滴答器） |
| `cron.chronos.portal_url` | Nous 基本 URL（设置触发 + 触发令牌签发者） |
| `cron.chronos.callback_url` | 网关自己的公共基本 URL，用于接收触发 |
| `cron.chronos.expected_audience` | 此智能体的触发令牌受众 |
| `cron.chronos.nas_jwks_url` | 用于验证传入触发令牌的密钥集 |

如果 Chronos 配置错误或智能体未登录 Nous，`resolve_cron_scheduler()` 会回退到内置滴答器（记录警告）——cron 永远不会失去触发器。循环任务在每次触发后重新设置；`repeat`-N 任务在次数耗尽时干净停止（无孤立的一次性触发）。完整的智能体↔Nous 通信协议位于 `docs/chronos-managed-cron-contract.md`。

### 全新会话隔离

每个 cron 任务在全新的智能体会话中运行：

- 没有前次运行的对话历史
- 没有之前 cron 执行的记忆（除非持久化到 memory/files）
- 提示词必须是自包含的——cron 任务不能提出澄清性问题
- `cronjob` 工具集被禁用（递归防护）

## 技能支持的任务

cron 任务可以通过 `skills` 字段关联一个或多个技能。在执行时：

1. 按指定顺序加载技能
2. 每个技能的 SKILL.md 内容作为上下文注入
3. 任务的提示词作为任务指令追加
4. 智能体处理组合的技能上下文 + 提示词

这使得可复用、经过测试的工作流成为可能，无需将完整指令粘贴到 cron 提示词中。例如：

```
创建每日融资报告 → 关联 "ai-funding-daily-report" 技能
```

### 脚本支持的任务

任务还可以通过 `script` 字段关联 Python 脚本。脚本在每次智能体轮次*之前*运行，其 stdout 作为上下文注入到提示词中。这使得数据收集和变更检测模式成为可能：

```python
# ~/.hermes/scripts/check_competitors.py
import requests, json
# 获取竞争对手发布说明，与上次运行对比
# 将摘要打印到 stdout — 智能体分析并报告
```

脚本超时默认为 120 秒。`_get_script_timeout()` 通过三层链解析限制：

1. **模块级覆盖** — `_SCRIPT_TIMEOUT`（用于测试/monkeypatching）。仅当与默认值不同时使用。
2. **环境变量** — `HERMES_CRON_SCRIPT_TIMEOUT`
3. **配置** — `config.yaml` 中的 `cron.script_timeout_seconds`（通过 `load_config()` 读取）
4. **默认值** — 120 秒

### 提供者恢复

`run_job()` 将用户配置的备用提供者和凭证池传入 `AIAgent` 实例：

- **备用提供者** — 从 `config.yaml` 读取 `fallback_providers`（列表）或 `fallback_model`（旧版字典），匹配网关的 `_load_fallback_model()` 模式。作为 `fallback_model=` 传递给 `AIAgent.__init__`，将两种格式规范化为备用链。
- **凭证池** — 使用已解析的运行时提供者名称通过 `agent.credential_pool` 的 `load_pool(provider)` 加载。仅在池中有凭证时传递（`pool.has_credentials()`）。在 429/限速错误时启用同提供者密钥轮换。

这镜像了网关的行为——没有它，cron 智能体将在限速时失败而不尝试恢复。

## 投递模型

cron 任务结果可以投递到任何支持的平台：

| 目标 | 语法 | 示例 |
|--------|--------|---------|
| 来源聊天 | `origin` | 投递到创建任务的聊天 |
| 本地文件 | `local` | 保存到 `~/.hermes/cron/output/` |
| Telegram | `telegram` 或 `telegram:<chat_id>` | `telegram:-1001234567890` |
| Discord | `discord` 或 `discord:#channel` | `discord:#engineering` |
| Slack | `slack` | 投递到 Slack 主频道 |
| WhatsApp | `whatsapp` | 投递到 WhatsApp 主界面 |
| Signal | `signal` | 投递到 Signal |
| Matrix | `matrix` | 投递到 Matrix 主房间 |
| Mattermost | `mattermost` | 投递到 Mattermost 主界面 |
| Email | `email` | 通过邮件投递 |
| SMS | `sms` | 通过短信投递 |
| Home Assistant | `homeassistant` | 投递到 HA 对话 |
| DingTalk | `dingtalk` | 投递到钉钉 |
| Feishu | `feishu` | 投递到飞书 |
| WeCom | `wecom` | 投递到企业微信 |
| Weixin | `weixin` | 投递到微信 |
| BlueBubbles | `bluebubbles` | 通过 BlueBubbles 投递到 iMessage |
| QQ Bot | `qqbot` | 通过官方 API v2 投递到 QQ |

对于 Telegram 话题，使用格式 `telegram:<chat_id>:<thread_id>`（例如 `telegram:-1001234567890:17585`）。

### 响应包装

默认情况下（`cron.wrap_response: true`），cron 投递会包装：
- 标识 cron 任务名称和任务的头部
- 注明智能体无法在对话中看到投递消息的尾部

cron 响应中的 `[SILENT]` 前缀完全抑制投递——仅需要写入文件或执行副作用的任务非常有用。

### 会话隔离

cron 投递**不会**镜像到网关会话对话历史中。它们仅存在于 cron 任务自己的会话中。这防止了目标聊天对话中的消息交替违规。

## 递归防护

cron 运行的会话中 `cronjob` 工具集被禁用。这防止：
- 已调度的任务创建新的 cron 任务
- 可能导致 token 使用量爆炸的递归调度
- 从任务内部意外变更任务调度

## 锁定

调度器使用跨进程文件锁定（Unix 上为 `fcntl.flock`，Windows 上为 `msvcrt.locking`）来防止重叠的滴答两次执行同一批到期任务——即使在网关的进程内滴答器和独立的 `hermes cron` / 手动 `tick()` 调用之间也是如此。如果无法获取锁，`tick()` 立即返回 0。

## CLI 接口

`hermes cron` CLI 提供直接的任务管理：

```bash
hermes cron list                    # 显示所有任务
hermes cron create                  # 交互式任务创建（别名：add）
hermes cron edit <job_id>           # 编辑任务配置
hermes cron pause <job_id>          # 暂停正在运行的任务
hermes cron resume <job_id>         # 恢复已暂停的任务
hermes cron run <job_id>            # 触发立即执行
hermes cron remove <job_id>         # 删除任务
```

## 相关文档

- [Cron 功能指南](/user-guide/features/cron)
- [网关内部机制](./gateway-internals.md)
- [智能体循环内部机制](./agent-loop.md)