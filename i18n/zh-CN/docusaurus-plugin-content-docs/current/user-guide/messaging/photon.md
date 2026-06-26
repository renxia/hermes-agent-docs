---
sidebar_position: 18
---

# Photon iMessage

通过 [Photon][photon]，将 Hermes 连接到 **iMessage**，Photon 是一个托管服务，它负责处理 Apple 的线路分配和滥用预防层，因此您无需运行自己的 Mac 中继。

免费套餐使用 Photon 的共享 iMessage 线路池——不同的收件人可能会看到不同的发送号码，但每次对话都保持稳定。付费的商业版为每个用户提供相同的专用号码；该插件均支持这两种模式，而免费套餐是推荐的起始点。

:::info 免费开始
Photon 的共享线路池是免费的。无需订阅即可从 Hermes 发送您的第一条 iMessage——只需一个我们可以绑定到您账户的电话号码。
:::

## 架构

Photon 是一个**持久连接**通道，类似于 Discord 或 Slack——**没有 Webhook，没有公共 URL，也没有签名密钥需要管理。**

`spectrum-ts` SDK 对 Photon 保持着一条长寿命的 **gRPC 流**，用于双向通信。由于该 SDK 仅支持 TypeScript，Hermes 在一个小型受控的 **Node sidecar** 中运行它，并通过回环（loopback）与它进行通信：

- **入站 (Inbound)** — sidecar 消费 SDK 的 `app.messages` gRPC 流，并将每条消息通过回环 `GET /inbound` (NDJSON) 转发给 Python 适配器。适配器会去重并将其分派给**智能体**，如果流中断，会自动重新连接。
- **出站 (Outbound)** — 回复函是发送给 sidecar 的回环 POST 请求，sidecar 再调用 SDK 上的 `space.send(...)`。

Python 插件会自动启动、监督和关闭 sidecar。

## 先决条件

- 一个 Photon 账户——请在 [app.photon.codes][app] 注册
- **Node.js 18.17 或更高版本**（通过 `node --version` 命令检查）
- 一个可以接收 iMessage 的电话号码（用于绑定您的账户）

仅此而已——您无需设置公共 URL 或隧道。

## 首次设置

您可以运行统一网关向导并选择 **Photon iMessage**：

```bash
hermes gateway setup
```

或者直接运行 Photon 设置（向导会调用相同的流程）：

```bash
# 设备代码登录 + 项目 + 用户 + sidecar 依赖，一站式完成
hermes photon setup --phone +15551234567
```

设置步骤如下：

1. **设备登录** (`client_id=photon-cli`) — 打开 `https://app.photon.codes/` 进行批准并存储 bearer token。
2. **查找或创建**您账户上的 `Hermes 智能体` 项目。
3. **启用 Spectrum**，读取项目的 Spectrum id，并轮换项目密钥。
4. **注册您的电话号码**为 Spectrum 用户——如果该号码已存在用户，则跳过此步，重新运行也是安全的。
5. **打印分配给您的 iMessage 线路**——您用此号码发送短信以联系您的智能体。
6. **在插件的 sidecar 目录内运行 `npm install`**。

运行时凭证被写入到 `~/.hermes/.env` (`PHOTON_PROJECT_ID` = Spectrum 项目 ID, `PHOTON_PROJECT_SECRET`)，这是其他所有频道存储其 token 的同一位置。管理元数据（设备 token、仪表板项目 ID）保存在 `~/.hermes/auth.json` 的 `credential_pool.photon` / `credential_pool.photon_project` 下。

## 授权用户

Photon 使用与所有其他 Hermes 频道相同的授权模型。请选择一种方法：

**DM 配对（默认）。** 当一个未知号码向您的 Photon 线路发送消息时，Hermes 会回复一个配对代码。使用以下命令批准它：

```bash
hermes pairing approve photon <CODE>
```

使用 `hermes pairing list` 查看待定的代码和已批准的用户。

**预授权特定号码**（在 `~/.hermes/.env` 中）：

```bash
PHOTON_ALLOWED_USERS=+15551234567,+15559876543
```

**开放访问**（仅限开发，在 `~/.hermes/.env` 中）：

```bash
PHOTON_ALLOW_ALL_USERS=true
```

当设置了 `PHOTON_ALLOWED_USERS` 时，未知发送者会被静默忽略，而不是被提供配对代码（白名单表示您故意限制了访问）。

### 要求群聊中的提及

默认情况下，Hermes 会响应所有授权的 DM 和群组消息。要使群聊成为选择加入（opt-in），请启用提及门控（DM 仍然总是有效）：

```yaml
gateway:
  platforms:
    photon:
      enabled: true
      require_mention: true
```

设置 `require_mention: true` 后，除非群组消息匹配唤醒词模式，否则将被忽略。默认的模式包括 `Hermes` 和 `@Hermes 智能体` 的变体。如需自定义智能体名称，请设置正则表达式：

```yaml
gateway:
  platforms:
    photon:
      require_mention: true
      mention_patterns:
        - '(?<![\w@])@?amos\b[,:\-]?'
```

这两个键也接受环境变量（`PHOTON_REQUIRE_MENTION`、`PHOTON_MENTION_PATTERNS`）。这是 BlueBubbles iMessage 频道使用的相同的提及门控模型。

## 启动网关

```bash
hermes gateway start
```

您将看到类似以下内容：

```
[photon] connected — sidecar on 127.0.0.1:8789, streaming inbound over gRPC
```

向您的分配号码发送一条 iMessage，Hermes 就会回复。

## 状态和故障排除

```bash
hermes photon status
```

打印保存的凭证、sidecar 健康状况、您的注册号码以及 Hermes 使用的分配 iMessage 线路。当 Photon token 和仪表板项目可用时，`status` 会刷新仪表板中缺失的号码行，而无需配置新的线路。

```
Photon iMessage status
──────────────────────
  device token        : ✓ stored (✓ 已存储)
  dashboard project   : 3c90c3cc-0d44-4b50-...
  spectrum project id : sp-...
  project secret      : ✓ stored (✓ 已存储)
  my number           : +15551234567
  assigned number     : +16282679185
  node binary         : /usr/bin/node
  sidecar deps        : ✓ installed (✓ 已安装)
```

常见问题：

- **`sidecar deps : ✗ run hermes photon install-sidecar`** — Node 已安装，但 `spectrum-ts` 未安装。请运行建议的命令。
- **`device token : ✗ missing`** — 请运行 `hermes photon setup` 进行登录。
- **`No iMessage line assigned yet`** — Spectrum 已启用，但尚未配置线路；请重新运行 `hermes photon setup` 或查看 [dashboard][app]。
- **Sidecar won't start** — 确认 `node --version` 是 18.17+，并且 `hermes photon install-sidecar` 没有错误完成。

## 今日限制

- **入站附件仅包含元数据。** 入站事件携带文件名 + MIME 类型；智能体可以看到一个标记，但尚不能读取字节内容。SDK 通过 `content.read()` 暴露附件字节，因此这是一个 sidecar 后续操作。
- **支持出站附件。** Hermes 通过 sidecar 的 `/send-attachment` 端点，通过 spectrum-ts 的 `attachment()` / `voice()` 内容构建器发送图片、语音备忘录、视频和文档。字幕将在媒体之后作为独立的 iMessage 气泡到达。
- **Photon 的免费配额：** 每个服务器每天 5,000 条消息，每个共享线路每天 50 次新对话发起。需要更多？请发送邮件至 `help@photon.codes`。

## 环境变量 (Env vars)

| Variable | Default | Notes |
|---|---|---|
| `PHOTON_PROJECT_ID` | from `.env` | Spectrum 项目 ID（SDK 的 `projectId`）；由设置程序设定 |
| `PHOTON_PROJECT_SECRET` | from `.env` | 项目密钥；由设置程序设定 |
| `PHOTON_SIDECAR_PORT` | `8789` | 用于 sidecar 控制和入站通道的回环端口 |
| `PHOTON_SIDECAR_AUTOSTART` | `true` | 适配器是否自动启动 sidecar |
| `PHOTON_NODE_BIN` | `which node` | 覆盖 Node 二进制文件路径 |
| `PHOTON_HOME_CHANNEL` | (unset) | Cron / 通知使用的默认空间 ID |
| `PHOTON_HOME_CHANNEL_NAME` | (unset) | 主频道的标签名称（人类可读） |
| `PHOTON_ALLOWED_USERS` | (unset) | 逗号分隔的 E.164 白名单 |
| `PHOTON_ALLOW_ALL_USERS` | `false` | 仅限开发——接受任何发送者 |
| `PHOTON_REQUIRE_MENTION` | `false` | 在群组中回复前是否需要唤醒词 |
| `PHOTON_MENTION_PATTERNS` | Hermes wake words | 用于群组提及的 JSON 列表 / 逗号 / 换行符正则表达式模式 |
| `PHOTON_DASHBOARD_HOST` | `app.photon.codes` | 覆盖仪表板/设备登录主机 |
| `PHOTON_SPECTRUM_HOST` | `spectrum.photon.codes` | 覆盖 Spectrum API 主机 |

[photon]: https://photon.codes/
[app]: https://app.photon.codes/