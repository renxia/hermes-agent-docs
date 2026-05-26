---
sidebar_position: 12
title: "使用技能"
description: "查找、安装、使用和创建技能——按需加载的知识，教会赫尔墨斯新的工作流程"
---

# 使用技能

技能是按需加载的知识文档，教会赫尔墨斯如何处理特定任务——从生成 ASCII 艺术到管理 GitHub PR。本指南将引导您日常使用它们。

完整的技术参考，请查阅[技能系统](/user-guide/features/skills)。

---

## 查找技能

每个赫尔墨斯安装都附带捆绑的技能。查看可用内容：

```bash
# 在任何聊天会话中：
/skills

# 或从 CLI：
hermes skills list
```

这将显示一个包含名称和描述的紧凑列表：

```
ascii-art         使用 pyfiglet, cowsay, boxes... 生成 ASCII 艺术
arxiv             从 arXiv 搜索和检索学术论文...
github-pr-workflow 完整 PR 生命周期——创建分支、提交...
plan              计划模式——检查上下文，编写 markdown...
excalidraw        使用 Excalidraw 创建手绘风格图表...
```

### 搜索技能

```bash
# 按关键词搜索
/skills search docker
/skills search music
```

### 技能中心

官方可选技能（默认未激活的较重或小众技能）可通过中心获取：

```bash
# 浏览官方可选技能
/skills browse

# 搜索中心
/skills search blockchain
```

---

## 使用技能

每个已安装的技能自动成为斜杠命令。只需输入其名称：

```bash
# 加载技能并给出任务
/ascii-art 制作一个写着 "HELLO WORLD" 的横幅
/plan 为一个待办事项应用设计 REST API
/github-pr-workflow 为认证重构创建 PR

# 仅输入技能名称（不带任务）会加载它，并允许您描述所需内容
/excalidraw
```

您也可以通过自然对话触发技能——要求赫尔墨斯使用特定技能，它将通过 `skill_view` 工具加载它。

### 渐进式披露

技能使用节省令牌的加载模式。智能体不会一次性加载所有内容：

1. **`skills_list()`** — 所有技能的紧凑列表（约 3k 令牌）。会话开始时加载。
2. **`skill_view(name)`** — 一个技能的完整 SKILL.md 内容。当智能体决定需要该技能时加载。
3. **`skill_view(name, file_path)`** — 技能中的特定参考文件。仅在需要时加载。

这意味着技能在实际使用前不会消耗令牌。

---

## 从中心安装

官方可选技能随赫尔墨斯附带，但默认未激活。请显式安装它们：

```bash
# 安装官方可选技能
hermes skills install official/research/arxiv

# 在聊天会话中从中心安装
/skills install official/creative/songwriting-and-ai-music

# 从任何 HTTP(S) URL 直接安装单文件 SKILL.md
hermes skills install https://sharethis.chat/SKILL.md
/skills install https://example.com/SKILL.md --name my-skill
```

发生情况：
1. 技能目录被复制到 `~/.hermes/skills/`
2. 它会出现在您的 `skills_list` 输出中
3. 它作为斜杠命令变得可用。

:::tip
已安装的技能在新会话中生效。如果您希望它在当前会话中可用，请使用 `/reset` 重新开始，或添加 `--now` 以立即使提示缓存失效（下一轮将消耗更多令牌）。
:::

### 验证安装

```bash
# 检查它是否存在
hermes skills list | grep arxiv

# 或在聊天中
/skills search arxiv
```

---

## 插件提供的技能

插件可以使用带命名空间的名称（`plugin:skill`）捆绑自己的技能。这可以防止与内置技能的名称冲突。

```bash
# 通过其限定名加载插件技能
skill_view("superpowers:writing-plans")

# 具有相同基础名称的内置技能不受影响
skill_view("writing-plans")
```

插件技能**未**在系统提示中列出，也不会出现在 `skills_list` 中。它们是可选的——当您知道插件提供了某个技能时，请显式加载它。加载时，智能体会看到一个横幅，列出同一插件中的同级技能。

关于如何在您自己的插件中提供技能，请参阅[构建赫尔墨斯插件 → 捆绑技能](/guides/build-a-hermes-plugin#bundle-skills)。

---

## 配置技能设置

某些技能在其前置信息中声明所需的配置：

```yaml
metadata:
  hermes:
    config:
      - key: tenor.api_key
        description: "用于 GIF 搜索的 Tenor API 密钥"
        prompt: "请输入您的 Tenor API 密钥"
        url: "https://developers.google.com/tenor/guides/quickstart"
```

当带有配置的技能首次加载时，赫尔墨斯会提示您输入这些值。它们存储在 `config.yaml` 的 `skills.config.*` 下。

从 CLI 管理技能配置：

```bash
# 特定技能的交互式配置
hermes skills config gif-search

# 查看所有技能配置
hermes config get skills.config
```

---

## 创建您自己的技能

技能只是带有 YAML 前置信息的 Markdown 文件。创建一个只需不到五分钟。

### 1. 创建目录

```bash
mkdir -p ~/.hermes/skills/my-category/my-skill
```

### 2. 编写 SKILL.md

```markdown title="~/.hermes/skills/my-category/my-skill/SKILL.md"
---
name: my-skill
description: 此技能功能的简要描述
version: 1.0.0
metadata:
  hermes:
    tags: [my-tag, automation]
    category: my-category
---

# 我的技能

## 何时使用
当用户询问 [特定主题] 或需要 [特定任务] 时使用此技能。

## 流程
1. 首先，检查 [前提条件] 是否可用
2. 运行 `command --with-flags`
3. 解析输出并呈现结果

## 注意事项
- 常见故障：[描述]。修复方法：[解决方案]
- 注意 [边缘情况]

## 验证
运行 `check-command` 以确认结果正确。
```

### 3. 添加参考文件（可选）

技能可以包含智能体按需加载的支持文件：

```
my-skill/
├── SKILL.md                    # 主技能文档
├── references/
│   ├── api-docs.md             # 智能体可以查阅的 API 参考
│   └── examples.md             # 示例输入/输出
├── templates/
│   └── config.yaml             # 智能体可以使用的模板文件
└── scripts/
    └── setup.sh                # 智能体可以执行的脚本
```

在您的 SKILL.md 中引用它们：

```markdown
有关 API 详情，请加载参考：`skill_view("my-skill", "references/api-docs.md")`
```

### 4. 测试

开始一个新会话并尝试您的技能：

```bash
hermes chat -q "/my-skill 帮我处理那个事情"
```

技能会自动出现——无需注册。将其放入 `~/.hermes/skills/`，它就生效了。

:::info
智能体也可以使用 `skill_manage` 自己创建和更新技能。在解决复杂问题后，赫尔墨斯可能会主动提出将方法保存为技能以备后用。
:::

---

## 按平台技能管理

控制哪些技能在哪些平台上可用：

```bash
hermes skills
```

这将打开一个交互式 TUI，您可以在其中按平台（CLI、Telegram、Discord 等）启用或禁用技能。当您希望某些技能仅在特定上下文中可用时非常有用——例如，将开发技能从 Telegram 上移除。

---

## 技能 vs 记忆

两者在会话间都是持久的，但服务于不同目的：

| | 技能 | 记忆 |
|---|---|---|
| **是什么** | 程序性知识——如何做事 | 事实性知识——事物是什么 |
| **何时** | 按需加载，仅在相关时 | 自动注入每个会话 |
| **大小** | 可以很大（数百行） | 应该紧凑（仅关键事实） |
| **成本** | 加载前零令牌 | 小但恒定的令牌成本 |
| **示例** | "如何部署到 Kubernetes" | "用户偏好深色模式，居住在 PST 时区" |
| **谁创建** | 您、智能体或从中心安装 | 智能体，基于对话 |

**经验法则：** 如果您会将其放入参考文档，它就是技能。如果您会将其写在便利贴上，它就是记忆。

---

## 提示

**保持技能专注。** 试图涵盖 "所有 DevOps" 的技能会过长且过于模糊。涵盖 "将 Python 应用部署到 Fly.io" 的技能足够具体，真正有用。

**让智能体创建技能。** 经过复杂的多步骤任务后，赫尔墨斯经常会主动提出将方法保存为技能。答应吧——这些智能体编写的技能精确捕捉了整个工作流程，包括沿途发现的注意事项。

**使用类别。** 将技能组织到子目录中（`~/.hermes/skills/devops/`、`~/.hermes/skills/research/` 等）。这使列表易于管理，并帮助智能体更快找到相关技能。

**当技能过时时更新它们。** 如果您使用技能时遇到未涵盖的问题，请告诉赫尔墨斯用您学到的内容更新该技能。未维护的技能会成为负担。

---

*有关完整的技能参考——前置信息字段、条件激活、外部目录等，请参阅[技能系统](/user-guide/features/skills)。*