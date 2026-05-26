---
title: 视觉与图片粘贴
description: 将剪贴板中的图片粘贴到 Hermes CLI 中进行多模态视觉分析。
sidebar_label: 视觉与图片粘贴
sidebar_position: 7
---

# 视觉与图片粘贴

Hermes 智能体支持**多模态视觉**功能——您可以直接将剪贴板中的图片粘贴到 CLI 中，并请求智能体对其进行分析、描述或处理。图片会以 Base64 编码的内容块形式发送给模型，因此任何具备视觉处理能力的模型都可以处理它们。

## 工作原理

1.  将图片复制到剪贴板（截图、浏览器图片等）
2.  通过以下任一方法附加图片
3.  输入您的问题并按 Enter
4.  图片会以 `[📎 Image #1]` 标记显示在输入框上方
5.  提交时，图片会作为视觉内容块发送给模型

您可以在发送前附加多张图片——每张图片都会获得其独有的标记。按 `Ctrl+C` 可清除所有已附加的图片。

图片会以 PNG 文件格式保存到 `~/.hermes/images/` 目录，文件名包含时间戳。

## 粘贴方法

如何附加图像取决于您的终端环境。并非所有方法都适用于所有环境——以下是完整分解：

### `/paste` 命令

**最可靠的显式图像附加后备方案。**

```
/paste
```
输入 `/paste` 并按 Enter。Hermes 会检查剪贴板中的图像并将其附加。当您的终端重写 `Cmd+V`/`Ctrl+V`，或者当您仅复制了图像且没有可检查的括号粘贴文本有效载荷时，这是最安全的选项。

### Ctrl+V / Cmd+V

Hermes 现在将粘贴视为分层流程：
- 首先是普通文本粘贴
- 如果终端未能干净地传递文本，则使用本机剪贴板/OSC52 文本回退
- 当剪贴板或粘贴的有效载荷解析为图像或图像路径时，附加图像

这意味着粘贴的 macOS 截屏临时路径和 `file://...` 图像 URI 可以立即附加，而不是作为原始文本停留在编辑器中。

:::warning
如果您的剪贴板**只有图像**（没有文本），终端仍然无法直接发送二进制图像字节。请使用 `/paste` 作为显式的图像附加后备方案。
:::

### 用于 VS Code / Cursor / Windsurf 的 `/terminal-setup`

如果您在 macOS 上本地的 VS Code 系列集成终端内运行 TUI，Hermes 可以安装推荐的 `workbench.action.terminal.sendSequence` 绑定，以获得更好的多行和撤销/重做一致性：

```text
/terminal-setup
```
当 `Cmd+Enter`、`Cmd+Z` 或 `Shift+Cmd+Z` 被 IDE 拦截时，这特别有用。请仅在本地机器上运行——不要在 SSH 会话中运行。

## 平台兼容性

| 环境 | `/paste` | Cmd/Ctrl+V | `/terminal-setup` | 备注 |
|---|:---:|:---:|:---:|---|
| **macOS 终端 / iTerm2** | ✅ | ✅ | 不适用 | 最佳体验——原生剪贴板 + 截屏路径恢复 |
| **Apple 终端** | ✅ | ✅ | 不适用 | 如果 Cmd+←/→/⌫ 被重写，请使用 Ctrl+A / Ctrl+E / Ctrl+U 后备方案 |
| **Linux X11 桌面** | ✅ | ✅ | 不适用 | 需要 `xclip` (`apt install xclip`) |
| **Linux Wayland 桌面** | ✅ | ✅ | 不适用 | 需要 `wl-paste` (`apt install wl-clipboard`) |
| **WSL2 (Windows 终端)** | ✅ | ✅ | 不适用 | 使用 `powershell.exe`——无需额外安装 |
| **VS Code / Cursor / Windsurf (本地)** | ✅ | ✅ | ✅ | 推荐用于更好的 Cmd+Enter / 撤销 / 重做一致性 |
| **VS Code / Cursor / Windsurf (SSH)** | ❌² | ❌² | ❌³ | 请在本地机器上运行 `/terminal-setup` |
| **SSH 终端 (任意)** | ❌² | ❌² | 不适用 | 无法访问远程剪贴板 |

² 请参阅下面的 [SSH 和远程会话](#ssh--remote-sessions)
³ 该命令写入本地 IDE 快捷键绑定，不应从远程主机运行

## 平台特定设置

### macOS

**无需设置。** Hermes 使用 macOS 内置的 `osascript` 读取剪贴板。为了获得更快的性能，可以选择安装 `pngpaste`：

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

现代 Linux 桌面 (Ubuntu 22.04+、Fedora 34+) 通常默认使用 Wayland。安装 `wl-clipboard`：

```bash
# Ubuntu/Debian
sudo apt install wl-clipboard

# Fedora
sudo dnf install wl-clipboard

# Arch
sudo pacman -S wl-clipboard
```

:::tip 如何检查是否使用 Wayland
```bash
echo $XDG_SESSION_TYPE
# "wayland" = Wayland，"x11" = X11，"tty" = 无显示服务器
```
:::

### WSL2

**无需额外设置。** Hermes 自动检测 WSL2（通过 `/proc/version`），并使用 `powershell.exe` 通过 .NET 的 `System.Windows.Forms.Clipboard` 访问 Windows 剪贴板。这内置在 WSL2 的 Windows 互操作中——`powershell.exe` 默认可用。

剪贴板数据通过 stdout 作为 base64 编码的 PNG 传输，因此无需文件路径转换或临时文件。

:::info WSLg 注意事项
如果您正在运行 WSLg（带 GUI 支持的 WSL2），Hermes 会首先尝试 PowerShell 路径，然后回退到 `wl-paste`。WSLg 的剪贴板桥仅支持 BMP 格式的图像——Hermes 使用 Pillow（如果已安装）或 ImageMagick 的 `convert` 命令自动将 BMP 转换为 PNG。
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

## SSH 和远程会话

**剪贴板图像粘贴在 SSH 上无法完全工作。** 当您通过 SSH 登录远程机器时，Hermes CLI 在远程主机上运行。剪贴板工具（`xclip`、`wl-paste`、`powershell.exe`、`osascript`）读取其运行机器的剪贴板——即远程服务器，而非您的本地机器。因此，您的本地剪贴板图像在远程端无法访问。

文本有时仍然可以通过终端粘贴或 OSC52 桥接，但图像剪贴板访问和本地截屏临时路径仍然绑定在运行 Hermes 的机器上。

### SSH 的变通方法

1.  **上传图像文件** — 在本地保存图像，通过 `scp`、VSCode 的文件资源管理器（拖放）或任何文件传输方法将其上传到远程服务器。然后通过路径引用它。*(未来的版本计划推出 `/attach <filepath>` 命令。)*

2.  **使用 URL** — 如果图像可在线访问，只需在消息中粘贴 URL。智能体可以使用 `vision_analyze` 直接查看任何图像 URL。

3.  **X11 转发** — 使用 `ssh -X` 连接以转发 X11。这允许远程机器上的 `xclip` 访问您的本地 X11 剪贴板。需要本地运行 X 服务器（macOS 上为 XQuartz，Linux X11 桌面内置）。对于大型图像速度较慢。

4.  **使用消息平台** — 通过 Telegram、Discord、Slack 或 WhatsApp 向 Hermes 发送图像。这些平台原生处理图像上传，不受剪贴板/终端限制的影响。

## 为什么终端无法粘贴图像

这是一个常见的困惑点，以下是技术解释：

终端是**基于文本的**界面。当您按下 Ctrl+V（或 Cmd+V）时，终端模拟器：

1.  读取剪贴板中的**文本内容**
2.  将其包装在[括号粘贴](https://en.wikipedia.org/wiki/Bracketed-paste)转义序列中
3.  通过终端的文本流将其发送给应用程序

如果剪贴板仅包含图像（没有文本），终端就没有任何内容可发送。没有用于二进制图像数据的标准终端转义序列。终端什么也不做。

这就是为什么 Hermes 使用单独的剪贴板检查——它不通过终端粘贴事件接收图像数据，而是通过子进程直接调用操作系统级工具（`osascript`、`powershell.exe`、`xclip`、`wl-paste`）独立读取剪贴板。

## 支持的模型

图像粘贴适用于任何具有视觉能力的模型。图像以 OpenAI 视觉内容格式作为 base64 编码的数据 URL 发送：

```json
{
  "type": "image_url",
  "image_url": {
    "url": "data:image/png;base64,..."
  }
}
```

大多数现代模型支持此格式，包括 GPT-4 Vision、Claude（带视觉）、Gemini 以及通过 OpenRouter 提供的开源多模态模型。

## 图像路由（具有视觉能力的模型 vs 纯文本模型）

当用户附加图像时——来自 CLI 剪贴板、网关（Telegram/Discord 照片）或任何其他入口点——Hermes 会根据您当前的模型是否真正支持视觉功能进行路由：

| 您的模型 | 图像的处理方式 |
|---|---|
| **具有视觉能力** (GPT-4V, Claude with vision, Gemini, Qwen-VL, MiMo-VL 等) | 使用提供商的原生图像内容格式（如上所述）作为**真实像素**发送。没有文本摘要层。 |
| **纯文本** (DeepSeek V3，较小的开源模型，较旧的仅聊天端点) | 通过 `vision_analyze` 辅助工具路由——一个辅助视觉模型描述图像，文本描述被注入到对话中。 |

您无需配置此功能——Hermes 会查找您当前模型在提供商元数据中的能力，并自动选择正确的路径。实际效果是：您可以在会话中切换视觉和非视觉模型，图像处理“开箱即用”，无需更改您的工作流程。纯文本模型获得关于图像的连贯上下文，而不是它们必须拒绝的损坏的多模态有效载荷。

哪个辅助模型处理文本描述路径可在 `auxiliary.vision` 下配置——请参阅[辅助模型](/user-guide/configuration#auxiliary-models)。

### `vision_analyze` 具有相同的双重行为

`vision_analyze` 工具本身遵循相同的路由。当活动的主模型具有视觉能力**且**其提供商支持工具结果中的图像内容（目前包括 Anthropic、OpenAI、Azure-OpenAI 和 Gemini 3.x 技术栈）时，`vision_analyze` 会短路辅助描述器，并将原始图像像素作为多模态工具结果信封返回。主模型在其下一轮原生看到图像——无需辅助调用，无文本摘要信息损失，无额外延迟。

对于纯文本主模型（或其工具结果通道不支持图像的提供商），`vision_analyze` 会回退到传统路径：它请求配置的辅助视觉模型描述图像，并将描述作为纯文本返回。无论哪种方式，调用工具签名都是相同的——工具在运行时根据活动模型决定采用哪条路径。