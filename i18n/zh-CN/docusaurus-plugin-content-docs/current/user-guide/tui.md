---
sidebar_position: 2
title: "TUI"
description: "启动 Hermes 的现代终端用户界面 —— 支持鼠标操作、丰富的覆盖层以及非阻塞输入。"
---

# TUI

TUI 是 Hermes 的现代前端界面，基于与 [经典 CLI](cli.md) 相同的 Python 运行时构建的终端用户界面。使用同一代理、同一会话、同一斜杠命令；提供更清晰、更响应的交互体验。

它是交互式运行 Hermes 的首选方式。

## 启动

```bash
# 启动 TUI
hermes --tui

# 恢复最新的 TUI 会话（如果不存在则回退到最新的经典会话）
hermes --tui -c
hermes --tui --continue

# 通过 ID 或标题恢复特定会话
hermes --tui -r 20260409_000000_aa11bb
hermes --tui --resume "my t0p session"

# 直接运行源码 —— 跳过预构建步骤（适用于 TUI 贡献者）
hermes --tui --dev
```

您也可以通过环境变量启用：

```bash
export HERMES_TUI=1
hermes          # 现在使用 TUI
hermes chat     # 同样适用
```

经典 CLI 仍作为默认选项。[CLI 接口](cli.md) 中记录的所有功能 —— 斜杠命令、快速命令、技能预加载、人格设定、多行输入、中断操作等，在 TUI 中完全一致。

## 为什么选择 TUI

- **即时首帧显示** —— 横幅图在应用加载完成前就已渲染，因此 Hermes 启动时终端不会卡顿。
- **非阻塞输入** —— 可以在会话就绪前输入并排队消息。第一个提示词会在代理上线后立即发送。
- **丰富的覆盖层** —— 模型选择器、会话选择器、审批和澄清提示均以模态面板形式呈现，而非内联流程。
- **实时会话面板** —— 工具和技能会随着初始化逐步填充。
- **友好的鼠标选择** —— 拖动高亮文本时使用统一背景色，而非 SGR 反显。使用终端正常的复制手势即可复制。
- **备用屏幕渲染** —— 差分更新确保流式传输时不闪烁，退出后不留滚动历史。
- **编辑器辅助功能** —— 长片段内联粘贴折叠、从剪贴板粘贴图像（`Alt+V`）、安全括号粘贴。

[皮肤](features/skins.md) 和 [人格](features/personality.md) 完全兼容。可在会话中随时切换 `/skin ares`、`/personality pirate`，界面会实时重绘。[`example-skin.yaml`](https://github.com/NousResearch/hermes-agent/blob/main/docs/skins/example-skin.yaml) 中标注了皮肤键为 `(both)`、`(classic)` 或 `(tui)`，一目了然地显示其适用范围。TUI 遵循横幅调色板、UI 颜色、提示符号/颜色、会话展示、补全菜单、选中背景、`tool_prefix` 和 `help_header`。

## 要求

- **Node.js** ≥ 20 —— TUI 作为子进程由 Python CLI 启动。`hermes doctor` 可验证此条件。
- **TTY** —— 如同经典 CLI，在非交互式环境中重定向 stdin 或使用管道时会回退到单查询模式。

首次启动时，Hermes 会将 TUI 的 Node 依赖安装到 `ui-tui/node_modules`（一次性操作，几秒钟）。后续启动速度更快。若拉取新版本 Hermes，当源码比 dist 更新时，TUI 包会自动重建。

### 外部预构建

分发版若提供预构建包（Nix、系统包），可指向 Hermes：

```bash
export HERMES_TUI_DIR=/path/to/prebuilt/ui-tui
hermes --tui
```

该目录必须包含 `dist/entry.js` 和最新的 `node_modules`。

## 快捷键

快捷键与 [经典 CLI](cli.md#keybindings) 完全一致。唯一行为差异：

- **鼠标拖拽** 高亮文本时使用统一选择背景。
- **`Ctrl+V`** 直接从剪贴板粘贴文本到编辑器；多行粘贴保持在一行内，直到您展开它们。
- **斜杠自动补全** 以浮动面板形式打开，带描述，而非内联下拉框。

## 斜杠命令

所有斜杠命令均无变化。部分为 TUI 特有 —— 输出更丰富或以内联面板形式渲染：

| 命令 | TUI 行为 |
|---------|--------------|
| `/help` | 带分类命令的覆盖层，可用方向键导航 |
| `/sessions` | 模态会话选择器 —— 预览、标题、令牌总数，内联恢复 |
| `/model` | 按提供商分组的模态模型选择器，含成本提示 |
| `/skin` | 实时预览 —— 主题变更浏览时即生效 |
| `/details` | 在转录中切换详细工具调用信息 |
| `/usage` | 丰富的令牌/成本/上下文面板 |

其余所有斜杠命令（包括已安装技能、快速命令和人格切换）与经典 CLI 完全一致。详见 [斜杠命令参考](../reference/slash-commands.md)。

## 状态栏

TUI 的状态栏实时跟踪代理状态：

| 状态 | 含义 |
|--------|---------|
| `starting agent…` | 会话 ID 已激活；工具和技能仍在上线中。可输入 —— 消息会排队并在就绪后发送。 |
| `ready` | 代理空闲，等待输入。 |
| `thinking…` / `running…` | 代理正在推理或运行工具。 |
| `interrupted` | 当前回合被取消；按 Enter 重新发送。 |
| `forging session…` / `resuming…` | 初始连接或 `--resume` 握手。 |

每套皮肤的 status-bar 颜色和阈值与经典 CLI 共享 —— 详见 [皮肤](features/skins.md) 自定义。

## 配置

TUI 遵循所有标准 Hermes 配置：`~/.hermes/config.yaml`、配置文件、人格、皮肤、快速命令、凭证池、内存提供者、工具/技能启用设置。无专门的 TUI 配置文件。

少数键值专门调整 TUI 界面：

```yaml
display:
  skin: default          # 任意内置或自定义皮肤
  personality: helpful
  details_mode: compact  # 或 "verbose" —— 默认工具调用详情级别
  mouse_tracking: true   # 若终端与鼠标报告冲突则禁用
```

`/details on` / `/details off` / `/details cycle` 可在运行时切换此设置。

## 会话

TUI 和经典 CLI 共享会话 —— 两者都写入同一个 `~/.hermes/state.db`。可在一个界面开始会话，在另一个中恢复。会话选择器会同时显示来自两个来源的会话，并标注来源标签。

详见 [会话](sessions.md) 生命周期、搜索、压缩和导出。

## 回退到经典 CLI

不带 `--tui` 参数启动 `hermes` 将停留在经典 CLI。若要让机器默认使用 TUI，请在 shell 配置文件中设置 `HERMES_TUI=1`。要切换回来，取消该设置即可。

若 TUI 启动失败（无 Node、包缺失、TTY 问题），Hermes 会打印诊断信息并回退 —— 不会让您陷入困境。

## 另见

- [CLI 接口](cli.md) —— 完整的斜杠命令和快捷键参考（共享）
- [会话](sessions.md) —— 恢复、分支和历史
- [皮肤与主题](features/skins.md) —— 定制横幅、状态栏和覆盖层
- [语音模式](features/voice-mode.md) —— 两种界面均支持
- [配置](configuration.md) —— 所有配置项