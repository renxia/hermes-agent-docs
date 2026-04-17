---
title: 视觉与图像粘贴
description: 将剪贴板中的图像粘贴到 Hermes CLI，进行多模态视觉分析。
sidebar_label: 视觉与图像粘贴
sidebar_position: 7
---

# 视觉与图像粘贴

Hermes Agent 支持**多模态视觉**——您可以将剪贴板中的图像直接粘贴到 CLI 中，并要求 Agent 进行分析、描述或处理这些图像。图像会作为 base64 编码的内容块发送给模型，因此任何具备视觉能力的模型都可以处理它们。

## 工作原理

1. 将图像复制到剪贴板（截图、浏览器图像等）。
2. 使用以下任一方法附加图像。
3. 输入您的问题并按回车键。
4. 图像会显示为输入框上方的 `[📎 Image #1]` 徽章。
5. 提交时，图像会作为视觉内容块发送给模型。

在发送之前，您可以附加多张图像——每张图像都会获得自己的徽章。按下 `Ctrl+C` 可以清除所有已附加的图像。

图像将保存到 `~/.hermes/images/` 目录下，并以带时间戳的文件名 PNG 格式存储。

## 粘贴方法

您如何附加图像取决于您的终端环境。并非所有方法都适用——以下是完整的说明：

### `/paste` 命令

**最可靠的方法。通用。**

```
/paste
```

输入 `/paste` 并按回车键。Hermes 会检查您的剪贴板中是否有图像并将其附加。由于它明确调用了剪贴板后端，因此无论在何种环境中都能工作——无需担心终端快捷键拦截问题。

### Ctrl+V / Cmd+V（括号粘贴）

当您粘贴的内容包含图像和文本时，Hermes 会自动检查图像。当满足以下条件时，此方法有效：
- 您的剪贴板同时包含**文本和图像**（某些应用在复制时会将两者都放在剪贴板中）
- 您的终端支持括号粘贴（大多数现代终端都支持）

:::warning
如果您的剪贴板**只包含图像**（没有文本），在大多数终端中，Ctrl+V 不起作用。终端只能粘贴文本——没有标准的机制来粘贴二进制图像数据。请改用 `/paste` 或 Alt+V。
:::

### Alt+V

Alt 键组合可以穿透大多数终端模拟器（它们是以 ESC + 键的形式发送，而不是被拦截的）。按下 `Alt+V` 来检查剪贴板中的图像。

:::caution
**在 VSCode 的集成终端中不工作。** VSCode 会拦截许多 Alt+键组合用于其自身的 UI。请改用 `/paste`。
:::

### Ctrl+V（原始 — 仅限 Linux）

在 Linux 桌面终端（GNOME Terminal、Konsole、Alacritty 等）中，`Ctrl+V` **不是**粘贴快捷键——正确的快捷键是 `Ctrl+Shift+V`。因此，`Ctrl+V` 会向应用程序发送一个原始字节，而 Hermes 会捕获它来检查剪贴板。此方法仅在具备 X11 或 Wayland 剪贴板访问权限的 Linux 桌面终端上有效。

## 平台兼容性

| 环境 | `/paste` | Ctrl+V 文本+图像 | Alt+V | 备注 |
|:---:|:---:|:---:|:---:|---|
| **macOS Terminal / iTerm2** | ✅ | ✅ | ✅ | 最佳体验 — `osascript` 始终可用 |
| **Linux X11 桌面** | ✅ | ✅ | ✅ | 需要 `xclip` (`apt install xclip`) |
| **Linux Wayland 桌面** | ✅ | ✅ | ✅ | 需要 `wl-paste` (`apt install wl-clipboard`) |
| **WSL2 (Windows Terminal)** | ✅ | ✅¹ | ✅ | 使用 `powershell.exe` — 无需额外安装 |
| **VSCode 终端 (本地)** | ✅ | ✅¹ | ❌ | VSCode 拦截 Alt+键 |
| **VSCode 终端 (SSH)** | ❌² | ❌² | ❌ | 无法访问远程剪贴板 |
| **SSH 终端 (任意)** | ❌² | ❌² | ❌² | 无法访问远程剪贴板 |

¹ 仅当剪贴板同时包含文本和图像时有效（仅图像的剪贴板 = 无反应）
² 参见下文的 [SSH 和远程会话](#ssh--remote-sessions)

## 平台特定设置

### macOS

**无需设置。** Hermes 使用 `osascript`（macOS 内置）来读取剪贴板。为了获得更快的性能，您可以选择安装 `pngpaste`：

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

现代 Linux 桌面（Ubuntu 22.04+，Fedora 34+）通常默认使用 Wayland。安装 `wl-clipboard`：

```bash
# Ubuntu/Debian
sudo apt install wl-clipboard

# Fedora
sudo dnf install wl-clipboard

# Arch
sudo pacman -S wl-clipboard
```

:::tip 如何检查您是否在 Wayland 上
```bash
echo $XDG_SESSION_TYPE
# "wayland" = Wayland, "x11" = X11, "tty" = 无显示服务器
```
:::

### WSL2

**无需额外设置。** Hermes 会自动检测 WSL2（通过 `/proc/version`），并使用 `powershell.exe` 通过 .NET 的 `System.Windows.Forms.Clipboard` 访问 Windows 剪贴板。这是 WSL2 的 Windows 互操作性内置功能——`powershell.exe` 默认可用。

剪贴板数据通过 stdout 以 base64 编码的 PNG 形式传输，因此不需要文件路径转换或临时文件。

:::info WSLg 注意事项
如果您运行的是 WSLg（带有 GUI 支持的 WSL2），Hermes 会首先尝试 PowerShell 路径，然后回退到 `wl-paste`。WSLg 的剪贴板桥接只支持 BMP 格式的图像——Hermes 会使用 Pillow（如果已安装）或 ImageMagick 的 `convert` 命令自动将 BMP 转换为 PNG。
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

**SSH 不支持剪贴板粘贴。** 当您通过 SSH 连接到远程机器时，Hermes CLI 在远程主机上运行。所有剪贴板工具（`xclip`、`wl-paste`、`powershell.exe`、`osascript`）读取的是它们运行所在机器的剪贴板——即远程服务器，而不是您的本地机器。您的本地剪贴板无法从远程访问。

### SSH 解决方案

1. **上传图像文件** — 将图像本地保存，通过 `scp`、VSCode 的文件浏览器（拖放）或任何文件传输方法上传到远程服务器。然后通过路径引用它。*(计划在未来版本中添加 `/attach <filepath>` 命令。)*

2. **使用 URL** — 如果图像可以在线访问，只需将 URL 粘贴到消息中。Agent 可以使用 `vision_analyze` 直接查看任何图像 URL。

3. **X11 转发** — 使用 `ssh -X` 连接以转发 X11。这允许远程机器上的 `xclip` 访问您本地的 X11 剪贴板。需要本地运行 X 服务器（macOS 上的 XQuartz，Linux X11 桌面内置）。处理大图像时速度较慢。

4. **使用消息平台** — 通过 Telegram、Discord、Slack 或 WhatsApp 将图像发送给 Hermes。这些平台原生处理图像上传，不受剪贴板/终端限制的影响。

## 为什么终端不能粘贴图像

这是一个常见的混淆点，所以这里提供技术解释：

终端是**基于文本**的界面。当您按下 Ctrl+V（或 Cmd+V）时，终端模拟器：

1. 读取剪贴板中的**文本内容**
2. 使用 [括号粘贴](https://en.wikipedia.org/wiki/Bracketed-paste) 转义序列包裹它
3. 通过终端的文本流将其发送给应用程序

如果剪贴板只包含图像（没有文本），终端就没有东西可以发送。没有标准的终端转义序列来表示二进制图像数据。终端只会什么都不做。

这就是为什么 Hermes 使用了单独的剪贴板检查——它不是通过终端粘贴事件接收图像数据，而是直接通过子进程调用操作系统级别的工具（`osascript`、`powershell.exe`、`xclip`、`wl-paste`）来独立读取剪贴板。

## 支持的模型

图像粘贴可用于任何具备视觉能力的模型。图像以 base64 编码的数据 URL 形式发送，遵循 OpenAI 视觉内容格式：

```json
{
  "type": "image_url",
  "image_url": {
    "url": "data:image/png;base64,..."
  }
}
```

大多数现代模型都支持此格式，包括 GPT-4 Vision、Claude（带视觉）、Gemini 和通过 OpenRouter 提供的开源多模态模型。