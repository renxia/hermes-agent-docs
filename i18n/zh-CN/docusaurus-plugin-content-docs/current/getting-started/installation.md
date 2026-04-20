---
sidebar_position: 2
title: "安装"
description: "在 Linux、macOS、WSL2 或 Android（通过 Termux）上安装 Hermes Agent"
---

# 安装

使用单行安装脚本，两分钟内即可启动并运行 Hermes Agent。

## 快速安装

### Linux / macOS / WSL2

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### Android / Termux

Hermes 现在也支持 Termux 专用安装路径：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

该安装程序会自动检测 Termux 环境，并切换到经过测试的 Android 流程：
- 使用 Termux 的 `pkg` 命令安装系统依赖项（`git`、`python`、`nodejs`、`ripgrep`、`ffmpeg` 及构建工具）
- 使用 `python -m venv` 创建虚拟环境
- 自动为 Android wheel 构建导出 `ANDROID_API_LEVEL`
- 使用 `pip` 安装精选的 `.[termux]` 额外依赖包
- 默认跳过未经充分测试的浏览器和 WhatsApp 引导流程

如需更明确的操作路径，请参考专门的 [Termux 指南](./termux.md)。

:::warning Windows
原生 Windows **不支持**。请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，并在其中运行 Hermes Agent。上述安装命令可在 WSL2 中正常使用。
:::

### 安装程序的作用

该安装程序会自动处理所有事项——包括依赖项（Python、Node.js、ripgrep、ffmpeg）、代码库克隆、虚拟环境配置、全局 `hermes` 命令设置以及 LLM 提供商配置。完成后，您就可以开始对话了。

### 安装后操作

重新加载 shell 并开始对话：

```bash
source ~/.bashrc   # 或：source ~/.zshrc
hermes             # 开始对话！
```

如需稍后单独配置各项设置，可使用以下专用命令：

```bash
hermes model          # 选择您的 LLM 提供商和模型
hermes tools          # 配置启用的工具
hermes gateway setup  # 设置消息平台
hermes config set     # 设置单个配置值
hermes setup          # 或运行完整的设置向导一次性配置全部内容
```

---

## 前提条件

唯一的前提条件是 **Git**。安装程序会自动处理其余所有内容：

- **uv**（快速的 Python 包管理器）
- **Python 3.11**（通过 uv 安装，无需 sudo）
- **Node.js v22**（用于浏览器自动化和 WhatsApp 桥接）
- **ripgrep**（快速文件搜索工具）
- **ffmpeg**（音频格式转换，用于 TTS）

:::info
您**无需**手动安装 Python、Node.js、ripgrep 或 ffmpeg。安装程序会检测缺失项并为您自动安装。只需确保 `git` 可用（执行 `git --version` 验证即可）。
:::

:::tip Nix 用户
如果您使用 Nix（在 NixOS、macOS 或 Linux 上），我们提供专用的安装路径，包含 Nix flake、声明式 NixOS 模块以及可选的容器模式。请参见 **[Nix & NixOS 安装指南](./nix-setup.md)**。
:::

---

## 手动/开发者安装

如果您希望克隆代码库并从源码安装——例如为了贡献代码、从特定分支运行，或对虚拟环境拥有完全控制权——请参考《贡献指南》中的 **[开发环境搭建](../developer-guide/contributing.md#development-setup)** 部分。

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `hermes: command not found` | 重新加载 shell（`source ~/.bashrc`）或检查 PATH 路径 |
| `API key not set` | 运行 `hermes model` 配置您的提供商，或使用 `hermes config set OPENROUTER_API_KEY your_key` |
| 更新后缺少配置 | 依次运行 `hermes config check` 和 `hermes config migrate` |

如需更多诊断信息，请运行 `hermes doctor`——它将准确告知您缺少什么以及如何修复。