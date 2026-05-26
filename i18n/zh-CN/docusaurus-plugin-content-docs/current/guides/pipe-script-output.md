---
sidebar_position: 12
title: "将脚本输出导出到消息平台"
description: "使用 `hermes send` 命令，将来自任何 Shell 脚本、cron 作业、CI 钩子或监控守护程序的文本发送到 Telegram、Discord、Slack、Signal 等平台。"
---

# 将脚本输出导出到消息平台

`hermes send` 是一个可编写脚本的轻量级 CLI 工具，能够将消息推送到 Hermes 已配置的任何消息平台。可以将其视为用于通知的跨平台 `curl` —— 你无需运行网关，无需 LLM，也无需在每个脚本中重新粘贴机器人令牌。

使用场景：

- 系统监控（内存、磁盘、GPU 温度、长时间运行的任务完成通知）
- CI/CD 通知（部署完成、测试失败）
- 需要向你发送结果的 cron 脚本
- 从终端快速发送一次性消息
- 将任何工具的输出导出到任何地方（`make | hermes send --to slack:#builds`）

该命令复用了 `hermes gateway` 已使用的凭据和平台适配器，因此无需维护第二套配置。

---

## 快速开始

```bash
# 将纯文本发送到某个平台的家庭频道
hermes send --to telegram "部署完成"

# 通过管道传入任何命令的标准输出
echo "内存使用率 92%" | hermes send --to telegram:-1001234567890

# 发送文件
hermes send --to discord:#ops --file /tmp/report.md

# 附加主题/标题行
hermes send --to slack:#eng --subject "[CI] build.log" --file build.log

# 指定线程目标（Telegram 话题、Discord 线程）
hermes send --to telegram:-1001234567890:17585 "线程回复"

# 列出所有已配置的目标
hermes send --list

# 按平台过滤
hermes send --list telegram
```

---

## 参数参考

| 标志 | 描述 |
|------|-------------|
| `-t, --to TARGET` | 目标地址。参见[目标格式](#目标格式)。 |
| `message`（位置参数） | 消息文本。省略则从 `--file` 或 stdin 读取。 |
| `-f, --file PATH` | 从文件读取消息正文。`--file -` 强制从 stdin 读取。 |
| `-s, --subject LINE` | 在正文前添加标题/主题行。 |
| `-l, --list` | 列出可用目标。可选位置参数用于按平台过滤。 |
| `-q, --quiet` | 成功时不输出到 stdout（仅返回退出码 —— 适用于脚本）。 |
| `--json` | 输出发送结果的原始 JSON 数据。 |
| `-h, --help` | 显示内置帮助文本。 |

### 目标格式

| 格式 | 示例 | 含义 |
|--------|---------|---------|
| `platform` | `telegram` | 发送到该平台已配置的家庭频道 |
| `platform:chat_id` | `telegram:-1001234567890` | 特定的数字聊天/群组/用户 |
| `platform:chat_id:thread_id` | `telegram:-1001234567890:17585` | 特定线程或 Telegram 论坛话题 |
| `platform:#channel` | `discord:#ops` | 人类友好的频道名称（通过频道目录解析） |
| `platform:+E164` | `signal:+15551234567` | 通过电话号码寻址的平台：Signal、SMS、WhatsApp |

任何 Hermes 提供了适配器的平台都可用作目标：
`telegram`、`discord`、`slack`、`signal`、`sms`、`whatsapp`、`matrix`、
`mattermost`、`feishu`、`dingtalk`、`wecom`、`weixin`、`email` 以及其他。

### 退出码

| 代码 | 含义 |
|------|---------|
| `0` | 发送（或列出）成功 |
| `1` | 在平台层面传递失败（认证、权限、网络） |
| `2` | 用法/参数/配置错误 |

退出码遵循标准 Unix 惯例，因此你的脚本可以像处理 `curl` 或 `grep` 的结果一样进行分支处理。

---

## 消息正文解析顺序

`hermes send` 按以下顺序解析消息正文：

1. **位置参数** —— `hermes send --to telegram "你好"`
2. **`--file PATH`** —— `hermes send --to telegram --file msg.txt`
3. **管道输入的 stdin** —— `echo 你好 | hermes send --to telegram`

当 stdin 是一个终端（非管道）时，Hermes **不会**等待输入 —— 而是会给出清晰的用法错误提示。这可以避免脚本因意外省略正文而挂起。

---

## 实际应用示例

### 监控：内存/磁盘警报

用一行可移植的命令替换你的看门狗脚本中临时拼凑的 `curl https://api.telegram.org/...` 调用：

```bash
#!/usr/bin/env bash
ram_pct=$(free | awk '/^Mem:/ {printf "%d", $3 * 100 / $2}')
if [ "$ram_pct" -ge 85 ]; then
  hermes send --to telegram --subject "⚠ 内存警告" \
    "主机 $(hostname) 内存使用率 ${ram_pct}%"
fi
```

因为 `hermes send` 复用你的 Hermes 配置，所以同一脚本可以在任何安装了 Hermes 的主机上运行 —— 无需手动在每台机器的环境中导出机器人令牌。

:::tip 避免让网关监控自身问题
对于可能在网关本身出现问题（如 OOM 警报、磁盘满警报）时触发的看门狗，建议继续使用简单的 `curl` 调用，而不是 `hermes send`。如果因为系统颠簸导致 Python 解释器无法加载，你仍然希望警报能发出去。
:::

### CI / CD：构建和测试结果

```bash
# 在 .github/workflows/deploy.yml 或任何 CI 脚本中
if ./scripts/deploy.sh; then
  hermes send --to slack:#deploys "✅ ${CI_COMMIT_SHA:0:7} 已部署"
else
  tail -n 100 deploy.log | hermes send \
    --to slack:#deploys --subject "❌ 部署失败"
  exit 1
fi
```

### Cron：每日报告

```bash
# Crontab 条目
0 9 * * * /usr/local/bin/generate-metrics.sh \
  | /home/me/.hermes/bin/hermes send \
      --to telegram --subject "每日指标 $(date +%Y-%m-%d)"
```

### 长时间运行的任务：完成时通知

```bash
./train.py --epochs 200 && \
  hermes send --to telegram "训练完成" || \
  hermes send --to telegram "训练失败 (退出码 $?)"
```

### 使用 `--json` 和 `--quiet` 进行脚本化

```bash
# 如果传递失败则使脚本硬性失败；成功时不在日志中产生冗余输出
hermes send --to telegram --quiet "保持活动" || {
  echo "Telegram 传递失败" >&2
  exit 1
}

# 捕获消息 ID 以便稍后编辑/用于线程
msg_id=$(hermes send --to discord:#ops --json "构建开始" \
  | jq -r .message_id)
```

---

## `hermes send` 需要网关运行吗？

**通常不需要。** 对于任何使用机器人令牌的平台 —— Telegram、Discord、Slack、Signal、SMS、WhatsApp Cloud API 以及大多数其他平台 —— `hermes send` 会使用 `~/.hermes/.env` 和 `~/.hermes/config.yaml` 中的凭据，直接调用平台的 REST 端点。它是一个独立的子进程，消息一送达就会退出。

只有对于**插件平台**（那些依赖持久适配器连接的平台，例如保持长时间 WebSocket 连接的自定义插件），才需要运行中的网关。在这种情况下，你会收到指向网关的清晰错误提示；使用 `hermes gateway start` 启动它并重试即可。

---

## 列出和发现目标

在向特定频道发送消息之前，你可以检查可用的目标：

```bash
# 所有已配置平台的所有目标
hermes send --list

# 仅 Telegram 目标
hermes send --list telegram

# 机器可读格式
hermes send --list --json
```

列表是根据 `~/.hermes/channel_directory.json` 构建的，网关在运行期间每隔几分钟会刷新一次。如果你看到"尚未发现频道"，请启动一次网关（`hermes gateway start`）以填充缓存。

人类友好的名称（`discord:#ops`、`slack:#engineering`）在发送时会根据此缓存进行解析，因此你无需记忆数字 ID。

---

## 与其他方法的比较

| 方法 | 多平台支持 | 复用 Hermes 凭据 | 需要网关 | 最适用于 |
|----------|----------------|---------------------|---------------|----------|
| `hermes send` | ✅ | ✅ | 否（机器人令牌） | 以下所有场景 |
| 对每个平台使用原始 `curl` | 需要分别编写脚本 | 手动管理 | 否 | 关键看门狗脚本 |
| 带 `--deliver` 的 `cron` 作业 | ✅ | ✅ | 否 | 调度的智能体任务 |
| `send_message` 智能体工具 | ✅ | ✅ | 否 | 在智能体循环内部使用 |

`hermes send` 刻意保持为最简单的界面。如果你需要一个智能体来决定说什么，请在聊天或 cron 作业中使用 `send_message` 工具。如果你需要带有 LLM 生成内容的定时运行，请使用 `cronjob(action='create', prompt=...)` 并设置 `deliver='telegram:...'`。如果你只需要导出原始字符串，请使用 `hermes send`。

---

## 相关内容

- [使用 Cron 自动化一切](/guides/automate-with-cron) —— 输出自动传递到任何平台的调度作业。
- [网关内部机制](/developer-guide/gateway-internals) —— `hermes send` 与 cron 传递共享的传递路由器。
- [消息平台设置](/user-guide/messaging/) —— 每个平台的一次性配置。