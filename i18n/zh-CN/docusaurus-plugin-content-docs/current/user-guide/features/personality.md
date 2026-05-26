---
sidebar_position: 9
title: "个性化与 SOUL.md"
description: "通过全局 SOUL.md、内置个性和自定义角色定义来定制 Hermes 智能体的个性"
---

# 个性化与 SOUL.md

Hermes 智能体的个性是完全可定制的。`SOUL.md` 是**主要的身份标识**——它位于系统提示词的最开始，定义了智能体是谁。

- `SOUL.md` —— 一个持久化的角色文件，存在于 `HERMES_HOME` 中，充当智能体的身份（系统提示词中的第 1 个插槽）
- 内置或自定义的 `/personality` 预设 —— 会话级别的系统提示词覆盖层

如果你想改变 Hermes 是谁——或者用一个完全不同的智能体角色替换它——编辑 `SOUL.md` 即可。

## SOUL.md 当前如何工作

Hermes 现在会自动在以下位置生成一个默认的 `SOUL.md`：

```text
~/.hermes/SOUL.md
```

更准确地说，它使用当前实例的 `HERMES_HOME`，因此如果你使用自定义主目录运行 Hermes，它将使用：

```text
$HERMES_HOME/SOUL.md
```

### 重要行为

- **SOUL.md 是智能体的主要身份。** 它占据系统提示词的第 1 个插槽，替换了硬编码的默认身份。
- 如果尚不存在，Hermes 会自动创建一个初始的 `SOUL.md`
- 已有的用户 `SOUL.md` 文件绝不会被覆盖
- Hermes 仅从 `HERMES_HOME` 加载 `SOUL.md`
- Hermes 不会在当前工作目录中查找 `SOUL.md`
- 如果 `SOUL.md` 存在但为空，或无法加载，Hermes 会回退到内置的默认身份
- 如果 `SOUL.md` 有内容，该内容在安全扫描和截断后会被原样注入
- SOUL.md **不会**在上下文文件部分重复——它只出现一次，作为身份标识

这使得 `SOUL.md` 成为真正的每用户或每实例的身份，而不仅仅是一个附加层。

## 为何如此设计

这种设计保持了个性的可预测性。

如果 Hermes 从你启动它的任意目录加载 `SOUL.md`，你的个性可能会在项目之间意外变化。通过仅从 `HERMES_HOME` 加载，个性属于 Hermes 实例本身。

这也使得更容易教导用户：
- "编辑 `~/.hermes/SOUL.md` 来改变 Hermes 的默认个性。"

## 在哪里编辑

对于大多数用户：

```bash
~/.hermes/SOUL.md
```

如果你使用自定义主目录：

```bash
$HERMES_HOME/SOUL.md
```

## SOUL.md 里应该写什么？

用它来存放持久的语音和个性指导，例如：
- 语调
- 沟通风格
- 直接程度
- 默认交互方式
- 在风格上应避免什么
- Hermes 应如何处理不确定性、分歧或模糊性

较少用于：
- 一次性项目指令
- 文件路径
- 仓库规范
- 临时工作流细节

这些属于 `AGENTS.md`，而非 `SOUL.md`。

## 优质的 SOUL.md 内容

一个好的 SOUL 文件是：
- 在不同上下文中稳定
- 足够广泛，适用于多种对话
- 足够具体，能实质性地塑造语音风格
- 专注于沟通和身份，而非任务特定的指令

### 示例

```markdown
# 个性

你是一位务实的资深工程师，品味出众。
你为追求真相、清晰和实用性而优化，而非礼貌表演。

## 风格
- 直率但不冷淡
- 偏好实质内容而非填充物
- 当想法糟糕时敢于反对
- 坦率地承认不确定性
- 保持解释简洁，除非深度有用

## 应避免的事项
- 谄媚
- 炒作语言
- 如果用户的框架有误，不要重复
- 对显而易见的事情过度解释

## 技术姿态
- 偏好简单系统而非聪明系统
- 关注操作现实，而非理想化的架构
- 将边缘情况视为设计的一部分，而非清理工作
```

## Hermes 注入提示词的内容

`SOUL.md` 的内容直接进入系统提示词的第 1 个插槽——智能体身份位置。其周围不会添加任何包装语言。

该内容会经过：
- 提示词注入扫描
- 如果过大则进行截断

如果文件为空、仅含空白或无法读取，Hermes 会回退到内置的默认身份（"你是 Hermes 智能体，一个由 Nous Research 创建的智能 AI 助手..."）。当设置 `skip_context_files` 时（例如在子智能体/委派上下文中），此回退同样适用。

## 安全扫描

`SOUL.md` 与其他承载上下文的文件一样，在包含前会进行提示词注入模式扫描。

这意味着你仍然应该将其保持在角色/语音风格上，而不是试图塞入奇怪的元指令。

## SOUL.md 与 AGENTS.md

这是最重要的区别。

### SOUL.md
用于：
- 身份
- 语调
- 风格
- 沟通默认值
- 个性层面的行为

### AGENTS.md
用于：
- 项目架构
- 编码规范
- 工具偏好
- 仓库特定的工作流
- 命令、端口、路径、部署说明

一个实用规则：
- 如果它应该跟随你到任何地方，它属于 `SOUL.md`
- 如果它属于某个项目，它属于 `AGENTS.md`

## SOUL.md 与 `/personality`

`SOUL.md` 是你持久的默认个性。

`/personality` 是一个会话级别的覆盖层，用于更改或补充当前的系统提示词。

所以：
- `SOUL.md` = 基础语音
- `/personality` = 临时模式切换

示例：
- 保持一个务实的默认 SOUL，然后使用 `/personality teacher` 进行辅导对话
- 保持一个简洁的 SOUL，然后使用 `/personality creative` 进行头脑风暴

## 内置个性

Hermes 附带了你可以通过 `/personality` 切换的内置个性。

| 名称 | 描述 |
|------|-------------|
| **helpful** | 友好、通用的助手 |
| **concise** | 简洁、切中要点的回应 |
| **technical** | 详细、准确的技术专家 |
| **creative** | 创新、跳出框框思考 |
| **teacher** | 耐心的教育者，提供清晰示例 |
| **kawaii** | 可爱的表达、闪光和热情 ★ |
| **catgirl** | 带有猫样表达的 Neko-chan，喵~ |
| **pirate** | 海尔密斯船长，精通技术的海盗 |
| **shakespeare** | 带有戏剧性风格的吟游散文 |
| **surfer** | 完全放松的兄弟氛围 |
| **noir** | 硬汉侦探的叙述 |
| **uwu** | 最大可爱的 uwu 用语 |
| **philosopher** | 对每个查询进行深度思考 |
| **hype** | 最大能量和热情！！！ |

## 使用命令切换个性

### 命令行界面

```text
/personality
/personality concise
/personality technical
```

### 消息平台

```text
/personality teacher
```

这些是便捷的覆盖层，但你的全局 `SOUL.md` 仍然赋予 Hermes 持久的默认个性，除非覆盖层对其进行了实质性的更改。

## 配置中的自定义个性

你也可以在 `~/.hermes/config.yaml` 的 `agent.personalities` 下定义命名的自定义个性。

```yaml
agent:
  personalities:
    codereviewer: >
      你是一位一丝不苟的代码审查员。识别 bug、安全问题、性能问题和不清晰的设计选择。做到精确且具有建设性。
```

然后通过以下方式切换到它：

```text
/personality codereviewer
```

## 推荐的工作流

一个强大的默认设置是：

1. 在 `~/.hermes/SOUL.md` 中保留一个经过深思熟虑的全局 `SOUL.md`
2. 将项目指令放在 `AGENTS.md` 中
3. 仅在需要临时模式切换时使用 `/personality`

这将为你提供：
- 一个稳定的语音
- 项目特定的行为放在其所属之处
- 需要时拥有临时控制权

## 个性如何与完整提示词交互

在高层次上，提示词栈包括：
1. **SOUL.md**（智能体身份——如果 SOUL.md 不可用则为内置回退）
2. 工具感知的行为指导
3. 记忆/用户上下文
4. 技能指导
5. 上下文文件（`AGENTS.md`、`.cursorrules`）
6. 时间戳
7. 平台特定的格式提示
8. 可选的系统提示词覆盖层，如 `/personality`

`SOUL.md` 是基础——其他一切都建立在它之上。

## 相关文档

- [上下文文件](/user-guide/features/context-files)
- [配置](/user-guide/configuration)
- [技巧与最佳实践](/guides/tips)
- [SOUL.md 指南](/guides/use-soul-with-hermes)

## 命令行界面外观与对话个性

对话个性和命令行界面外观是分开的：
- `SOUL.md`、`agent.system_prompt` 和 `/personality` 影响 Hermes 如何说话
- `display.skin` 和 `/skin` 影响 Hermes 在终端中的外观

关于终端外观，请参阅[皮肤与主题](./skins.md)。