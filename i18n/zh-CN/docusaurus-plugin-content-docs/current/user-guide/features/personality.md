---
sidebar_position: 9
title: "Personality & SOUL.md.md"
description: "使用全局 SOUL.md、内置个性或自定义角色定义来定制 Hermes Agent 的个性"
---

# 个性与 SOUL.md

Hermes Agent 的个性是完全可定制的。`SOUL.md` 是**主要身份**——它是系统提示（system prompt）中的第一部分，定义了代理（agent）的身份。

- `SOUL.md` — 一个持久化的角色文件，存储在 `HERMES_HOME` 中，作为代理的身份（系统提示中的第 1 个槽位）
- 内置或自定义的 `/personality` 预设 — 会话级别的系统提示覆盖层

如果你想改变 Hermes 的身份——或者用一个完全不同的代理角色替换它——请编辑 `SOUL.md`。

## SOUL.md 的工作原理

现在，Hermes 会自动在以下位置为默认 `SOUL.md` 进行初始化：

```text
~/.hermes/SOUL.md
```

更准确地说，它使用当前实例的 `HERMES_HOME`，因此如果你使用自定义的家目录运行 Hermes，它将使用：

```text
$HERMES_HOME/SOUL.md
```

### 重要行为

- **SOUL.md 是代理的主要身份。** 它占据系统提示中的第 1 个槽位，取代了硬编码的默认身份。
- 如果不存在，Hermes 会自动创建一个起始的 `SOUL.md`。
- 现有的用户 `SOUL.md` 文件绝不会被覆盖。
- Hermes 仅从 `HERMES_HOME` 加载 `SOUL.md`。
- Hermes 不会在当前工作目录中查找 `SOUL.md`。
- 如果 `SOUL.md` 存在但为空，或无法加载，Hermes 将回退到内置的默认身份。
- 如果 `SOUL.md` 有内容，该内容将在安全扫描和截断后原样注入。
- SOUL.md **不会**在上下文文件部分重复 — 它只作为身份出现一次。

这使得 `SOUL.md` 成为一个真正的用户级或实例级的身份，而不仅仅是一个附加层。

## 为什么采用这种设计

这使得个性具有可预测性。

如果 Hermes 从你偶然启动它的任何目录加载 `SOUL.md`，那么你的个性可能会在不同的项目之间意外改变。通过仅从 `HERMES_HOME` 加载，个性就属于 Hermes 实例本身。

这也使得教会用户更容易：
- “编辑 `~/.hermes/SOUL.md` 来更改 Hermes 的默认个性。”

## 如何编辑它

对于大多数用户：

```bash
~/.hermes/SOUL.md
```

如果你使用自定义家目录：

```bash
$HERMES_HOME/SOUL.md
```

## SOUL.md 中应该放什么？

用它来指导持久的语气和个性，例如：
- 语气
- 沟通风格
- 直接程度
- 默认交互风格
- 风格上应避免的内容
- Hermes 应如何处理不确定性、分歧或模糊性

不适合用它来放置：
- 一次性的项目指令
- 文件路径
- 仓库约定
- 临时工作流细节

这些内容应该放在 `AGENTS.md` 中，而不是 `SOUL.md`。

## 好的 SOUL.md 内容

一个好的 SOUL 文件应该具备：
- 在不同上下文之间稳定
- 足够广泛，适用于许多对话
- 足够具体，能够实质性地塑造语气
- 侧重于沟通和身份，而非任务特定的指令

### 示例

```markdown
# Personality

你是一位务实的资深工程师，拥有良好的品味。
你优先考虑真相、清晰度和实用性，而不是客套话。

## Style
- 直接，但不过于冷漠
- 偏爱实质内容而非填充词
- 当某事是坏主意时提出异议
- 坦诚承认不确定性
- 除非深度有用，否则保持解释简洁

## What to avoid
- 奉承
- 炒作语言
- 如果用户框架错误，不要重复其框架
- 过度解释显而易见的事情

## Technical posture
- 偏爱简单的系统而非花哨的系统
- 关注操作现实，而非理想化的架构
- 将边缘情况视为设计的一部分，而非需要清理的残留物
```

## Hermes 如何注入提示词

`SOUL.md` 的内容直接进入系统提示的第 1 个槽位——代理身份位置。不会在它周围添加任何包装语言。

内容会经过：
- 提示词注入扫描
- 如果内容过大，则进行截断

如果文件为空、仅包含空白字符或无法读取，Hermes 将回退到内置的默认身份（“你是一位 Hermes Agent，一个由 Nous Research 创建的智能 AI 助手……”）。当设置了 `skip_context_files` 时（例如，在子代理/委托上下文中），也会应用此回退机制。

## 安全扫描

`SOUL.md` 在包含之前，会像其他携带上下文的文件一样，接受提示词注入模式的扫描。

这意味着你仍然应该将其重点放在角色/语气上，而不是试图偷偷塞入奇怪的元指令。

## SOUL.md 与 AGENTS.md

这是最重要的区别。

### SOUL.md
用于：
- 身份
- 语气
- 风格
- 沟通默认值
- 个性层面的行为

### AGENTS.md
用于：
- 项目架构
- 编码约定
- 工具偏好
- 仓库特定的工作流
- 命令、端口、路径、部署说明

一个有用的规则是：
- 如果它应该随你走到任何地方，它就属于 `SOUL.md`
- 如果它属于某个项目，它就属于 `AGENTS.md`

## SOUL.md 与 `/personality`

`SOUL.md` 是你持久的默认个性。

`/personality` 是一个会话级别的覆盖层，用于更改或补充当前的系统提示。

因此：
- `SOUL.md` = 基线语气
- `/personality` = 临时模式切换

示例：
- 保持一个务实的默认 SOUL，然后使用 `/personality teacher` 进行辅导对话。
- 保持一个简洁的 SOUL，然后使用 `/personality creative` 进行头脑风暴。

## 内置个性

Hermes 预装了内置个性，你可以使用 `/personality` 切换它们。

| 名称 | 描述 |
|------|-------------|
| **helpful** | 友好、通用助手 |
| **concise** | 简短、切题的回复 |
| **technical** | 详细、准确的技术专家 |
| **creative** | 创新、跳出固有思维 |
| **teacher** | 耐心教育者，提供清晰示例 |
| **kawaii** | 可爱表情、闪光和热情 ★ |
| **catgirl** | 带有猫科表情的 Neko-chan，喵~ |
| **pirate** | 海盗船长 Hermes，技术精湛的海盗 |
| **shakespeare** | 带有戏剧风格的吟游诗人散文 |
| **surfer** | 超级放松的兄弟氛围 |
| **noir** | 硬汉侦探叙事 |
| **uwu** | 极度可爱，使用 uwu 语调 |
| **philosopher** | 对每个查询进行深刻的沉思 |
| **hype** | 极度能量和热情！！！ |

## 使用命令切换个性

### CLI

```text
/personality
/personality concise
/personality technical
```

### 消息平台

```text
/personality teacher
```

这些是方便的覆盖层，但除非覆盖层有意义地改变它，否则你的全局 `SOUL.md` 仍然赋予 Hermes 其持久的默认个性。

## 配置中的自定义个性

你还可以在 `~/.hermes/config.yaml` 的 `agent.personalities` 下定义命名的自定义个性。

```yaml
agent:
  personalities:
    codereviewer: >
      你是一位一丝不苟的代码审查员。识别错误、安全问题、
      性能问题和不清晰的设计选择。要精确且具有建设性。
```

然后使用以下命令切换到它：

```text
/personality codereviewer
```

## 推荐工作流程

一个强大的默认设置是：

1. 在 `~/.hermes/SOUL.md` 中保留一个深思熟虑的全局 `SOUL.md`。
2. 将项目指令放入 `AGENTS.md`。
3. 仅在需要临时模式切换时使用 `/personality`。

这样能为你提供：
- 一个稳定的语气
- 属于项目特定的行为
- 需要时临时的控制权

## 个性如何与完整提示词互动

从高层次来看，提示词堆栈包括：
1. **SOUL.md**（代理身份——如果 SOUL.md 不可用，则使用内置回退）
2. 工具感知行为指导
3. 记忆/用户上下文
4. 技能指导
5. 上下文文件（`AGENTS.md`、`.cursorrules`）
6. 时间戳
7. 平台特定的格式提示
8. 可选的系统提示覆盖层，例如 `/personality`

`SOUL.md` 是基础——其他所有内容都建立在它之上。

## 相关文档

- [Context Files](/docs/user-guide/features/context-files)
- [Configuration](/docs/user-guide/configuration)
- [Tips & Best Practices](/docs/guides/tips)
- [SOUL.md Guide](/docs/guides/use-soul-with-hermes)

## CLI 外观与对话个性

对话个性与 CLI 外观是分开的：

- `SOUL.md`、`agent.system_prompt` 和 `/personality` 影响 Hermes 的说话方式
- `display.skin` 和 `/skin` 影响 Hermes 在终端中的外观

有关终端外观，请参阅 [Skins & Themes](./skins.md)。