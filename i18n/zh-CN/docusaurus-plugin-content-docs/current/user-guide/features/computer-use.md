# 计算机控制（macOS）

Hermes 智能体可以在**后台**操控您的 Mac 桌面——点击、键入、滚动、拖拽。您的光标不会移动，键盘焦点不会切换，macOS 也不会切换桌面空间。您和智能体在同一台机器上协同工作。

与大多数计算机控制集成不同，此功能兼容**任何具备工具调用能力的模型**——无论是 Claude、GPT、Gemini，还是本地 vLLM 端点上的开源模型。您无需担心 Anthropic 原生架构的限制。

## 工作原理

`computer_use` 工具集通过标准输入输出（stdio）与 [`cua-driver`](https://github.com/trycua/cua) 进行 MCP 通信。该 macOS 驱动程序利用 SkyLight 私有 SPI（`SLEventPostToPid`、`SLPSPostEventRecordTo`）以及 `_AXObserverAddNotificationAndCheckRemote` 辅助功能 SPI 来实现以下功能：

- 直接向目标进程投递合成事件——无需 HID 事件监听，也无需移动光标。
- 在不激活窗口的情况下切换 AppKit 的活跃状态——不会导致桌面空间切换。
- 当窗口被遮挡时，保持 Chromium/Electron 的辅助功能树处于活跃状态。

这种组合正是 OpenAI Codex “后台计算机控制”功能所采用的技术方案。cua-driver 是其开源等效实现。

## 启用方式

选择最方便的方式进行安装——两者都运行相同的上游安装程序：

**选项一：专用 CLI 命令（最直接）。**

```
hermes computer-use install
```

此命令将获取并运行上游 cua-driver 安装程序：
`curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/cua-driver/scripts/install.sh`。
可使用 `hermes computer-use status` 验证安装。

**选项二：交互式启用工具集。**

1. 运行 `hermes tools`，选择 `🖱️ Computer Use (macOS)` → `cua-driver (background)`。
2. 设置过程将运行上游安装程序（与选项一相同）。

安装完成后，无论您选择了哪种方式，请继续以下步骤：

3. 在系统提示时授予 macOS 权限：
   - **系统设置 → 隐私与安全性 → 辅助功能** → 允许终端（或 Hermes 应用）访问。
   - **系统设置 → 隐私与安全性 → 屏幕录制** → 允许相同的访问权限。
4. 启用工具集并开始会话：
   ```
   hermes -t computer_use chat
   ```
   或在 `~/.hermes/config.yaml` 文件中将 `computer_use` 添加到已启用的工具集列表。

## 保持 cua-driver 更新

cua-driver 项目会定期发布修复更新（例如 v0.1.6 修复了 UTM 工作流中的 Safari 窗口焦点错误）。Hermes 会在两处刷新该二进制文件，确保您不会使用过时版本：

- **`hermes update`** — 当您更新 Hermes 本身时，如果 `cua-driver` 位于 PATH 中，更新程序最后会重新运行上游安装程序。对于非 macOS 用户或未安装 cua-driver 的用户，此操作无效。
- **`hermes computer-use install --upgrade`** — 手动强制刷新。无论 cua-driver 是否已安装，都会重新运行上游安装程序。当您希望在不等待下一次智能体更新的情况下获取最新修复时，请使用此命令。

`hermes computer-use status` 命令可在二进制文件路径旁显示已安装的版本号。

## 快速示例

用户提示：*"找到我最近收到的 Stripe 邮件，并总结他们希望我做什么。"*

智能体的执行计划：

1. `computer_use(action="capture", mode="som", app="Mail")` — 获取邮件应用的截图，其中每个侧边栏项目、工具栏按钮和消息行均被编号。
2. `computer_use(action="click", element=14)` — 点击搜索栏（截图中的第 14 号元素）。
3. `computer_use(action="type", text="from:stripe")`
4. `computer_use(action="key", keys="return", capture_after=True)` — 提交搜索并获取新的截图。
5. 点击顶部搜索结果，阅读邮件正文，进行总结。

在此过程中，您的光标会保持在原位，邮件应用也不会切换到前台。

## 提供商兼容性

| 提供商 | 支持视觉？ | 是否可用？ | 备注 |
|---|---|---|---|
| Anthropic (Claude Sonnet/Opus 3+) | ✅ | ✅ | 整体最佳；支持 SOM 和原始坐标。 |
| OpenRouter（任意视觉模型） | ✅ | ✅ | 支持多部分工具消息。 |
| OpenAI (GPT-4+, GPT-5) | ✅ | ✅ | 与上述相同。 |
| 本地 vLLM / LM Studio（视觉模型） | ✅ | ✅ | 前提是模型支持多部分内容的工具调用。 |
| 纯文本模型 | ❌ | ✅（降级） | 使用 `mode="ax"` 进行仅基于辅助功能树的操作。 |

截图作为 OpenAI 风格的 `image_url` 部分，内联于工具结果中发送。对于 Anthropic，适配器会将其转换为原生的 `tool_result` 图像块。

## 安全性

Hermes 应用了多层安全防护措施：

- 破坏性操作（点击、键入、拖拽、滚动、按键、聚焦应用）需要获得批准——可以通过 CLI 对话框交互式批准，或通过消息平台的审批按钮批准。
- 在工具层面硬性阻止以下快捷键组合：清空废纸篓、强制删除、锁定屏幕、注销、强制注销。
- 硬性阻止以下键入模式：`curl | bash`、`sudo rm -rf /`、Fork 炸弹等。
- 智能体的系统提示会明确告知：不得点击权限对话框，不得输入密码，不得遵循截图中嵌入的指令。

如果您希望确认每一个操作，可在 `~/.hermes/config.yaml` 中设置 `approvals.mode: manual`。

## 令牌效率

截图处理成本高昂。Hermes 应用了四层优化策略：

- **截图驱逐** — Anthropic 适配器仅在上下文中保留最近的 3 张截图；较旧的截图会被替换为 `[screenshot removed to save context]` 占位符。
- **客户端压缩裁剪** — 上下文压缩器会检测多模态工具结果，并剥离旧结果中的图像部分。
- **图像感知的令牌估算** — 每张图像被计为约 1500 个令牌（Anthropic 的固定费率），而非其 base64 编码的字符长度。
- **服务器端上下文编辑（仅限 Anthropic）** — 启用后，适配器会通过 `context_management` 启用 `clear_tool_uses_20250919`，从而允许 Anthropic 的 API 在服务器端清除旧的工具结果。

在 1568×900 分辨率的显示器上，一个包含 20 个操作的会话，其截图上下文通常消耗约 30K 令牌，而非 ~600K 令牌。

## 限制

- **仅限 macOS。** cua-driver 使用了不存在于 Linux 或 Windows 上的 Apple 私有 SPI。如需跨平台 GUI 自动化，请使用 `browser` 工具集。
- **私有 SPI 风险。** Apple 可能在任何系统更新中更改 SkyLight 的符号接口。如果您希望在 macOS 版本更新间保持可复现性，请使用 `HERMES_CUA_DRIVER_VERSION` 环境变量固定驱动版本。
- **性能。** 后台模式比前台模式慢——经由 SkyLight 路由的事件耗时约 5-20 毫秒，而直接 HID 投递更快。对于智能体速度的点击操作不易察觉；但如果您尝试录制速通视频，则可能感觉到差异。
- **无法通过键盘输入密码。** `type` 操作对命令行有效载荷有硬性屏蔽模式；对于密码输入，请使用系统的自动填充功能。

## 配置

覆盖驱动程序二进制文件路径（用于测试/CI）：

```
HERMES_CUA_DRIVER_CMD=/opt/homebrew/bin/cua-driver
HERMES_CUA_DRIVER_VERSION=0.5.0    # 可选，用于固定版本
```

完全替换后端（用于测试）：

```
HERMES_COMPUTER_USE_BACKEND=noop   # 仅记录调用，不产生副作用
```

## 故障排除

**`computer_use backend unavailable: cua-driver is not installed`** — 运行 `hermes computer-use install` 以获取 cua-driver 二进制文件，或运行 `hermes tools` 并启用计算机控制工具集。

**点击似乎无效** — 进行捕获并验证。可能有一个您未注意到的模态对话框正在阻挡输入。使用 `Escape` 键或关闭按钮将其关闭。

**元素索引已过时** — SOM 索引仅在下次 `capture` 操作前有效。在任何改变状态的操作后，请重新捕获。

**"blocked pattern in type text"** — 您尝试键入的文本匹配了危险的 Shell 模式列表。请拆分命令或重新考虑。

## 另请参阅

- [通用技能：`macos-computer-use`](https://github.com/NousResearch/hermes-agent/blob/main/skills/apple/macos-computer-use/SKILL.md)
- [cua-driver 源码 (trycua/cua)](https://github.com/trycua/cua)
- [浏览器自动化](./browser.md) 用于跨平台网络任务。