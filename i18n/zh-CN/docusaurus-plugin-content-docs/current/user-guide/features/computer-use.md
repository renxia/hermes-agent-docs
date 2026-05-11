# 计算机使用（macOS）

Hermes 智能体可以在**后台**驱动你的 Mac 桌面 —— 点击、键入、滚动、拖拽。你的光标不会移动，键盘焦点不会改变，macOS 也不会为你切换桌面空间。你和智能体在同一台机器上协作。

与大多数计算机使用集成不同，这适用于**任何支持工具的模型** —— Claude、GPT、Gemini，或在本地 vLLM 端点上运行的开源模型。无需担心 Anthropic 原生的架构。

## 工作原理

`computer_use` 工具集通过 stdio 使用 MCP 协议与 [`cua-driver`](https://github.com/trycua/cua) 通信，这是一个 macOS 驱动程序，它利用 SkyLight 私有 SPI（`SLEventPostToPid`、`SLPSPostEventRecordTo`）以及 `_AXObserverAddNotificationAndCheckRemote` 辅助功能 SPI 来实现：

- 将合成的事件直接发送到目标进程 —— 无需 HID 事件捕获，无需光标移动。
- 在不提升窗口的情况下切换 AppKit 的活动状态 —— 无需切换桌面空间。
- 在窗口被遮挡时，保持 Chromium/Electron 辅助功能树的活性。

这种组合正是 OpenAI Codex “后台计算机使用”功能所采用的方案。cua-driver 是其开源的等效实现。

## 启用方式

选择最方便的路径即可 —— 两者都运行相同的上游安装程序：

**选项 1：专用 CLI 命令（最直接）。**

```
hermes computer-use install
```

这将获取并运行上游的 cua-driver 安装程序：
`curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/cua-driver/scripts/install.sh`。
使用 `hermes computer-use status` 来验证安装。

**选项 2：交互式启用工具集。**

1. 运行 `hermes tools`，选择 `🖱️ Computer Use (macOS)` → `cua-driver (background)`。
2. 设置过程将运行上游安装程序（与选项 1 相同）。

安装完成后，无论你选择了哪种路径：

3. 在提示时授予 macOS 权限：
   - **系统设置 → 隐私与安全性 → 辅助功能** → 允许终端（或 Hermes 应用）。
   - **系统设置 → 隐私与安全性 → 屏幕录制** → 允许同一应用。
4. 启用工具集后开始会话：
   ```
   hermes -t computer_use chat
   ```
   或者将 `computer_use` 添加到你的 `~/.hermes/config.yaml` 中的已启用工具集列表。

## 快速示例

用户提示：*"找到我来自 Stripe 的最新邮件，并总结他们希望我做什么。"*

智能体的计划：

1. `computer_use(action="capture", mode="som", app="Mail")` —— 获取邮件应用的截图，其中每个侧边栏项目、工具栏按钮和消息行都被编号。
2. `computer_use(action="click", element=14)` —— 点击搜索字段（来自截图的第 14 号元素）。
3. `computer_use(action="type", text="from:stripe")`
4. `computer_use(action="key", keys="return", capture_after=True)` —— 提交并获取新的截图。
5. 点击顶部结果，阅读正文，进行总结。

在整个过程中，你的光标保持在原处，邮件应用也不会切换到前台。

## 提供商兼容性

| 提供商 | 视觉？ | 有效？ | 备注 |
|---|---|---|---|
| Anthropic (Claude Sonnet/Opus 3+) | ✅ | ✅ | 整体最佳；SOM + 原始坐标。 |
| OpenRouter（任何视觉模型） | ✅ | ✅ | 支持多部分工具消息。 |
| OpenAI (GPT-4+, GPT-5) | ✅ | ✅ | 同上。 |
| 本地 vLLM / LM Studio（视觉模型） | ✅ | ✅ | 如果模型支持多部分工具内容。 |
| 纯文本模型 | ❌ | ✅（降级） | 使用 `mode="ax"` 进行仅限辅助功能树的操作。 |

截图作为 OpenAI 风格的 `image_url` 部分内联在工具结果中发送。对于 Anthropic，适配器将它们转换为原生的 `tool_result` 图像块。

## 安全性

Hermes 应用了多层防护：

- 破坏性操作（click、type、drag、scroll、key、focus_app）需要批准 —— 可以通过 CLI 对话框交互式批准，或通过消息平台的批准按钮批准。
- 在工具层面硬编码拦截的按键组合：清空废纸篓、强制删除、锁定屏幕、注销、强制注销。
- 硬编码拦截的键入模式：`curl | bash`、`sudo rm -rf /`、fork 炸弹等。
- 智能体的系统提示会明确告知它：不要点击权限对话框，不要输入密码，不要遵循嵌入在截图中的指令。

如果你想确认每一个操作，可以在 `~/.hermes/config.yaml` 中结合使用 `approvals.mode: manual`。

## 令牌效率

截图成本高昂。Hermes 应用了四层优化：

- **截图驱逐** —— Anthropic 适配器仅在上下文中保留最近的 3 张截图；更早的截图会变成 `[screenshot removed to save context]` 占位符。
- **客户端压缩修剪** —— 上下文压缩器检测多模态工具结果，并从旧的结果中剥离图像部分。
- **图像感知令牌估算** —— 每张图像按约 1500 个令牌（Anthropic 的统一费率）计算，而不是其 base64 字符长度。
- **服务器端上下文编辑（仅限 Anthropic）** —— 当激活时，适配器通过 `context_management` 启用 `clear_tool_uses_20250919`，让 Anthropic 的 API 在服务器端清除旧的工具结果。

在 1568×900 显示屏上进行 20 个操作的会话，通常消耗约 30K 令牌的截图上下文，而不是约 600K。

## 限制

- **仅限 macOS。** cua-driver 使用了在 Linux 或 Windows 上不存在的私有 Apple SPI。要实现跨平台 GUI 自动化，请使用 `browser` 工具集。
- **私有 SPI 风险。** Apple 可能在任何操作系统更新中更改 SkyLight 的符号表面。如果你想在 macOS 版本更新间保持可重现性，请使用 `HERMES_CUA_DRIVER_VERSION` 环境变量固定驱动程序版本。
- **性能。** 后台模式比前台模式慢 —— 通过 SkyLight 路由的事件需要约 5-20 毫秒，而直接 HID 发送则快得多。对于智能体速度的点击操作来说不明显；但如果你想录制速通视频，就会感觉到了。
- **不允许键盘输入密码。** `type` 对命令行负载有硬编码拦截模式；对于密码，请使用系统的自动填充。

## 配置

覆盖驱动程序二进制文件路径（测试/CI）：

```
HERMES_CUA_DRIVER_CMD=/opt/homebrew/bin/cua-driver
HERMES_CUA_DRIVER_VERSION=0.5.0    # 可选的版本固定
```

完全切换后端（用于测试）：

```
HERMES_COMPUTER_USE_BACKEND=noop   # 记录调用，无副作用
```

## 故障排除

**`computer_use backend unavailable: cua-driver is not installed`** —— 运行 `hermes computer-use install` 获取 cua-driver 二进制文件，或运行 `hermes tools` 并启用计算机使用工具集。

**点击似乎没有效果** —— 进行截图并验证。可能有一个你看不到的模态框正在阻止输入。使用 `escape` 或关闭按钮来关闭它。

**元素索引已过时** —— SOM 索引仅在下次 `capture` 之前有效。在任何改变状态的操作后，请重新截图。

**"blocked pattern in type text"** —— 你尝试 `type` 的文本匹配了危险的 shell 模式列表。请将命令拆分或重新考虑。

## 另请参阅

- [通用技能：`macos-computer-use`](https://github.com/NousResearch/hermes-agent/blob/main/skills/apple/macos-computer-use/SKILL.md)
- [cua-driver 源代码 (trycua/cua)](https://github.com/trycua/cua)
- [浏览器自动化](./browser.md) 用于跨平台 Web 任务。