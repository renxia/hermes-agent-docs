---
title: 视觉与图像粘贴
description: 将剪贴板中的图像粘贴到 Hermes CLI 中，进行多模态视觉分析。
sidebar_label: 视觉与图像粘贴
sidebar_position: 7
---

# 视觉与图像粘贴

Hermes 智能体支持**多模态视觉**——您可以将剪贴板中的图像直接粘贴到 CLI 中，并要求智能体对其进行分析、描述或处理。图像会以 base64 编码的内容块形式发送给模型，因此任何支持视觉功能的模型都可以处理它们。

## 工作原理

1. 将图像复制到剪贴板（截图、浏览器中的图像等）
2. 使用以下方法之一将其附加
3. 输入您的问题并按 Enter 键
4. 图像会以 `[📎 图像 #1]` 徽章的形式显示在输入框上方
5. 提交后，图像会以视觉内容块的形式发送给模型

您可以在发送前附加多个图像——每个图像都会显示自己的徽章。按 `Ctrl+C` 可清除所有已附加的图像。

图像会以带时间戳文件名的 PNG 文件保存到 `~/.hermes/images/` 目录中。

## 粘贴方法

如何附加图像取决于您的终端环境。并非所有方法都适用于所有环境——以下是详细说明：

### `/paste` 命令

**最可靠的显式图像附加回退方案。**

```
/paste
```

输入 `/paste` 并按 Enter 键。Hermes 会检查剪贴板中是否有图像并将其附加。当您的终端重写 `Cmd+V`/`Ctrl+V`，或者您只复制了图像而没有可检查的带括号粘贴文本负载时，这是最安全的选择。

### Ctrl+V / Cmd+V

Hermes 现在将粘贴视为分层流程：
- 首先进行普通文本粘贴
- 如果终端未能清晰地传递文本，则回退到原生剪贴板 / OSC52 文本
- 当剪贴板或粘贴负载解析为图像或图像路径时，附加图像

这意味着粘贴的 macOS 截图临时路径和 `file://...` 图像 URI 可以立即附加，而不会作为原始文本保留在编辑器中。

:::warning
如果您的剪贴板中**只有图像**（没有文本），终端仍然无法直接发送二进制图像字节。请使用 `/paste` 作为显式图像附加回退方案。
:::

### `/terminal-setup`（适用于 VS Code / Cursor / Windsurf）

如果您在 macOS 上的本地 VS Code 系列集成终端中运行 TUI，Hermes 可以安装推荐的 `workbench.action.terminal.sendSequence` 绑定，以获得更好的多行和撤销/重做对等性：

```text
/terminal-setup
```

当 `Cmd+Enter`、`Cmd+Z` 或 `Shift+Cmd+Z` 被 IDE 拦截时，这尤其有用。请仅在本地机器上运行此命令——不要在 SSH 会话中运行。

## 平台兼容性

| 环境 | `/paste` | Cmd/Ctrl+V | `/terminal-setup` | 说明 |
|---|:---:|:---:|:---:|---|
| **macOS 终端 / iTerm2** | ✅ | ✅ | 不适用 | 最佳体验——原生剪贴板 + 截图路径恢复 |
| **Apple 终端** | ✅ | ✅ | 不适用 | 如果 Cmd+←/→/⌫ 被重写，请使用 Ctrl+A / Ctrl+E / Ctrl+U 回退方案 |
| **Linux X11 桌面** | ✅ | ✅ | 不适用 | 需要 `xclip`（`apt install xclip`） |
| **Linux Wayland 桌面** | ✅ | ✅ | 不适用 | 需要 `wl-paste`（`apt install wl-clipboard`） |
| **WSL2（Windows 终端）** | ✅ | ✅ | 不适用 | 使用 `powershell.exe`——无需额外安装 |
| **VS Code / Cursor / Windsurf（本地）** | ✅ | ✅ | ✅ | 推荐用于更好的 Cmd+Enter / 撤销 / 重做对等性 |
| **VS Code / Cursor / Windsurf（SSH）** | ❌² | ❌² | ❌³ | 请在本地机器上运行 `/terminal-setup` |
| **SSH 终端（任意）** | ❌² | ❌² | 不适用 | 远程剪贴板无法访问 |

² 参见下面的 [SSH 与远程会话](#ssh--remote-sessions)  
³ 该命令会写入本地 IDE 键绑定，不应从远程主机运行

## 平台特定设置

### macOS

**无需设置。** Hermes 使用 `osascript`（macOS 内置）来读取剪贴板。为了获得更快的性能，可以选择安装 `pngpaste`：

```bash
brew install pngpaste
```

### Linux (X11)

安装 `xclip`：

```bash
# Ubuntu/Debian
sudo apt install xclip

# Fedora
sudo dnf install xclip

# Arch
sudo pacman -S xclip
```

### Linux (Wayland)

现代 Linux 桌面（Ubuntu 22.04+、Fedora 34+）通常默认使用 Wayland。安装 `wl-clipboard`：

```bash
# Ubuntu/Debian
sudo apt install wl-clipboard

# Fedora
sudo dnf install wl-clipboard

# Arch
sudo pacman -S wl-clipboard
```

:::tip 如何检查您是否在使用 Wayland
```bash
echo $XDG_SESSION_TYPE
# "wayland" = Wayland，"x11" = X11，"tty" = 无显示服务器
```
:::

### WSL2

**无需额外设置。** Hermes 会自动检测 WSL2（通过 `/proc/version`），并使用 `powershell.exe` 通过 .NET 的 `System.Windows.Forms.Clipboard` 访问 Windows 剪贴板。这是 WSL2 的 Windows 互操作性内置功能——`powershell.exe` 默认可用。

剪贴板数据会通过 stdout 以 base64 编码的 PNG 形式传输，因此无需进行文件路径转换或创建临时文件。

:::info WSLg 说明
如果您正在运行 WSLg（带 GUI 支持的 WSL2），Hermes 会首先尝试 PowerShell 路径，然后回退到 `wl-paste`。WSLg 的剪贴板桥接仅支持 BMP 格式的图像——Hermes 会使用 Pillow（如果已安装）或 ImageMagick 的 `convert` 命令自动将 BMP 转换为 PNG。
:::

#### 验证 WSL2 剪贴板访问

```bash
# 1. 检查 WSL 检测
grep -i microsoft /proc/version

# 2. 检查 PowerShell 是否可访问
which powershell.exe

# 3. 复制一张图像，然后检查
powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::ContainsImage()"
# 应打印 "True"
```

## SSH 与远程会话

**剪贴板图像粘贴在 SSH 上无法完全正常工作。** 当您通过 SSH 连接到远程机器时，Hermes CLI 会在远程主机上运行。剪贴板工具（`xclip`、`wl-paste`、`powershell.exe`、`osascript`）读取的是它们所运行机器的剪贴板——也就是远程服务器，而不是您的本地机器。因此，您的本地剪贴板图像无法从远程端访问。

文本有时仍可通过终端粘贴或 OSC52 传递，但图像剪贴板访问和本地截图临时路径仍然与运行 Hermes 的机器绑定。

### SSH 的解决方法

1. **上传图像文件**——将图像保存在本地，然后通过 `scp`、VSCode 的文件资源管理器（拖放）或任何文件传输方法将其上传到远程服务器。然后通过路径引用它。*（未来版本计划提供 `/attach <filepath>` 命令。）*

2. **使用 URL**——如果图像可以在线访问，只需在消息中粘贴 URL。智能体可以使用 `vision_analyze` 直接查看任何图像 URL。

3. **X11 转发**——使用 `ssh -X` 连接以转发 X11。这允许远程机器上的 `xclip` 访问您的本地 X11 剪贴板。需要在本地运行 X 服务器（macOS 上的 XQuartz，Linux X11 桌面内置）。对于大图像来说速度较慢。

4. **使用消息平台**——通过 Telegram、Discord、Slack 或 WhatsApp 将图像发送给 Hermes。这些平台原生支持图像上传，不受剪贴板/终端限制的影响。

## 为什么终端无法粘贴图像

这是一个常见的困惑来源，以下是技术解释：

终端是**基于文本**的界面。当您按下 Ctrl+V（或 Cmd+V）时，终端模拟器会：

1. 读取剪贴板中的**文本内容**
2. 将其包装在[带括号粘贴](https://en.wikipedia.org/wiki/Bracketed-paste)转义序列中
3. 通过终端的文本流将其发送给应用程序

如果剪贴板中只包含图像（没有文本），终端就无事可发送。没有用于二进制图像数据的标准终端转义序列。终端 simply does nothing。

这就是为什么 Hermes 使用单独的剪贴板检查——它不是通过终端粘贴事件接收图像数据，而是通过子进程直接调用操作系统级工具（`osascript`、`powershell.exe`、`xclip`、`wl-paste`）来独立读取剪贴板。

## 支持的模型

图像粘贴适用于任何支持视觉功能的模型。图像会以 OpenAI 视觉内容格式中的 base64 编码数据 URL 形式发送：

```json
{
  "type": "image_url",
  "image_url": {
    "url": "data:image/png;base64,..."
  }
}
```

大多数现代模型都支持此格式，包括 GPT-4 Vision、Claude（带视觉功能）、Gemini 以及通过 OpenRouter 提供的开源多模态模型。