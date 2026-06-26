---
sidebar_position: 0
title: "Run Nemotron 3 Ultra free in Hermes Agent"
description: "Try NVIDIA Nemotron 3 Ultra on Nous Portal — free June 4–18 — with day 0 support in Hermes Agent"
---

# 在 Hermes 智能体中免费运行 Nemotron 3 Ultra

Nous Research 已入选由顶尖 AI 实验室组成的 **Nemotron 联盟**，与 **NVIDIA** 合作推进开放前沿基础模型。为此，我们与 **Nebius** 合作，在 [Nous Portal](https://portal.nousresearch.com) 上提供为期两周（**6月4日 – 6月18日**）的 **Nemotron 3 Ultra** 免费使用。请按照以下说明立即在您的 Hermes 智能体中试用该模型。

:::info 限时优惠
`nvidia/nemotron-3-ultra:free` 层级在 **6月4日至6月18日** 期间可用。`:free` 标签是保持免费计划的关键——请选择该特定变体。
:::

选择最适合您的安装方式。**桌面应用**最简单——无需终端。如果您习惯使用终端，下方提供了**命令行**安装方式。

## 方案 A — 桌面应用（推荐）

最简路径：一键安装器，引导式点击设置。无需终端。

### 1. 下载并安装

[下载 Hermes 桌面安装器](https://hermes-agent.nousresearch.com/)（macOS 或 Windows），然后打开。首次启动时，它会自动完成设置（通常不到一分钟）。

### 2. 连接 Nous Portal

应用打开后，您会看到"Let's get you set up"界面。点击标记为**推荐的** **Nous Portal**。浏览器将打开——创建 [Nous Portal](https://portal.nousresearch.com) 账户（或登录），选择**免费**计划，并授权 Hermes。应用会自动连接。

### 3. 选择免费的 Nemotron 3 Ultra 模型

连接后，应用会显示**默认模型**卡片。点击**更改**，搜索 **nemotron 3 ultra**，并选择标记为**免费层级**的变体：

```
nvidia/nemotron-3-ultra:free
```

`:free` 标签是保持免费层级的关键——请选择该变体。

### 4. 开始对话

点击**开始对话**。就这样——您正在免费与 Nemotron 3 Ultra 对话。

## 方案 B — 命令行

更偏好终端？

### 1. 安装 Hermes 智能体

在 macOS/Linux/WSL2/Android 上，运行

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

在 Windows 上，运行

```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

想先查看一下？下载 [`install.sh`](https://hermes-agent.nousresearch.com/install.sh)，检查内容后再运行。

安装完成后，重新加载您的 shell：

```bash
source ~/.bashrc   # 或 source ~/.zshrc
```

### 2. 运行快速设置

```bash
hermes setup
```

选择**快速设置**。Hermes 会打开浏览器标签页，等待您完成后续步骤。

### 3. 创建 Nous Portal 账户

在浏览器中，创建 [Nous Portal](https://portal.nousresearch.com) 账户（或登录）并选择**免费**计划。

### 4. 连接您的账户

当提示将账户连接到 Hermes 智能体时，点击**连接**。连接成功后您将看到确认信息。

### 5. 选择免费的 Nemotron 3 Ultra 模型

返回终端。从模型列表中选择：

```
nvidia/nemotron-3-ultra:free
```

`:free` 标签是保持免费层级的关键，因此请确保选择该变体。

### 6. 开始对话

完成剩余的快速设置提示，然后运行：

```bash
hermes
```

就这样——您正在免费与 Nemotron 3 Ultra 对话。

## 稍后切换

已经设置了其他模型？

- **桌面应用：**打开模型选择器，搜索 **nemotron 3 ultra**，并选择**免费层级**变体。
- **CLI / TUI：**在会话中随时使用 `/model nvidia/nemotron-3-ultra:free` 切换，或运行 `/model` 打开选择器并从列表中选择。

## 故障排除

- **在列表中看不到模型？**请确认您已完成 Nous Portal 连接且处于**免费**计划。在 CLI 中，`hermes portal info` 可确认您已登录并通过 Nous 路由。
- **选错了变体？**重新选择 `nvidia/nemotron-3-ultra:free`——`:free` 后缀是保持免费层级所必需的。
- **浏览器未打开 / 您使用的是远程主机（CLI）？**请参阅 [OAuth over SSH / 远程主机](/guides/oauth-over-ssh) 了解端口转发和手动粘贴的解决方案。

## 另请参阅

- **[桌面应用](/user-guide/desktop)** — 原生一键应用（macOS、Windows、Linux）
- **[使用 Nous Portal 运行 Hermes 智能体](/guides/run-hermes-with-nous-portal)** — 完整的 Portal 指南：模型、工具网关和验证
- **[Nous Portal 集成](/integrations/nous-portal)** — 订阅包含的内容
- **[快速入门](/getting-started/quickstart)** — 5 分钟内从安装到对话