---
sidebar_position: 12
title: "使用技能"
description: "查找、安装、使用和创建技能——按需知识，可为 Hermes 学习新的工作流程"
---

# 使用技能

技能是按需知识文档，它们教会 Hermes 如何处理特定任务——从生成 ASCII 艺术到管理 GitHub PR。本指南将带您了解日常使用技能的方法。

有关完整的技术参考，请参阅 [技能系统](/docs/user-guide/features/skills)。

---

## 查找技能

每个 Hermes 安装都自带了一组技能。查看当前可用的技能：

```bash
# 在任何聊天会话中：
/skills

# 或从 CLI 中：
hermes skills list
```

这会显示一个包含名称和描述的简洁列表：

```
ascii-art         使用 pyfiglet、cowsay、boxes 等生成 ASCII 艺术...
arxiv             搜索和检索来自 arXiv 的学术论文...
github-pr-workflow 完整的 PR 生命周期——创建分支、提交...
plan              规划模式——检查上下文，撰写 Markdown...
excalidraw        使用 Excalidraw 创建手绘风格的图表...
```

### 搜索技能

```bash
# 按关键词搜索
/skills search docker
/skills search music
```

### 技能中心 (Skills Hub)

官方可选技能（默认不激活的较重或小众技能）可通过“技能中心”获取：

```bash
# 浏览官方可选技能
/skills browse

# 在中心搜索
/skills search blockchain
```

---

## 使用技能

每个已安装的技能都会自动成为一个斜杠命令。只需输入其名称即可：

```bash
# 加载技能并给它分配任务
/ascii-art 创建一个显示“HELLO WORLD”的横幅
/plan 为一个待办事项应用设计 REST API
/github-pr-workflow 为认证重构创建 PR

# 只输入技能名称（无任务）会加载它，并允许您描述所需内容
/excalidraw
```

您也可以通过自然对话触发技能——要求 Hermes 使用特定技能，它将通过 `skill_view` 工具加载该技能。

### 渐进式披露 (Progressive Disclosure)

技能使用了一种高效的令牌加载模式。代理不会一次性加载所有内容：

1. **`skills_list()`** — 所有技能的简洁列表（约 3k 词元）。在会话开始时加载。
2. **`skill_view(name)`** — 单个技能完整的 SKILL.md 内容。当代理决定需要该技能时加载。
3. **`skill_view(name, file_path)`** — 技能内部的特定参考文件。仅在需要时加载。

这意味着，技能只有在实际使用时才会消耗令牌。

---

## 从中心安装技能

官方可选技能随 Hermes 一起提供，但默认不激活。您需要显式安装它们：

```bash
# 安装一个官方可选技能
hermes skills install official/research/arxiv

# 在聊天会话中从中心安装
/skills install official/creative/songwriting-and-ai-music
```

发生了什么：
1. 技能目录被复制到 `~/.hermes/skills/`
2. 它会出现在您的 `skills_list` 输出中
3. 它作为一个斜杠命令可用

:::tip
已安装的技能在新会话中生效。如果您希望它在当前会话中可用，请使用 `/reset` 重新开始，或添加 `--now` 来立即使提示缓存失效（在下一轮中会消耗更多词元）。
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

插件可以使用命名空间名称（`plugin:skill`）来打包自己的技能。这可以防止与内置技能发生名称冲突。

```bash
# 通过其限定名称加载插件技能
skill_view("superpowers:writing-plans")

# 具有相同基础名称的内置技能不受影响
skill_view("writing-plans")
```

插件技能**不会**列在系统提示中，也不会出现在 `skills_list` 中。它们是可选激活的——当您知道某个插件提供了技能时，才显式加载它们。加载后，代理会显示一个列出来自同一插件的兄弟技能的横幅。

有关如何在自己的插件中打包技能，请参阅 [构建 Hermes 插件 → 打包技能](/docs/guides/build-a-hermes-plugin#bundle-skills)。

---

## 配置技能设置

某些技能会在其前置元数据中声明所需的配置：

```yaml
metadata:
  hermes:
    config:
      - key: tenor.api_key
        description: "用于 GIF 搜索的 Tenor API 密钥"
        prompt: "请输入您的 Tenor API 密钥"
        url: "https://developers.google.com/tenor/guides/quickstart"
```

当首次加载带有配置的技能时，Hermes 会提示您输入所需的值。它们存储在 `config.yaml` 的 `skills.config.*` 下。

通过 CLI 管理技能配置：

```bash
# 为特定技能进行交互式配置
hermes skills config gif-search

# 查看所有技能配置
hermes config get skills.config
```

---

## 创建自己的技能

技能本质上只是带有 YAML 前置元数据的 Markdown 文件。创建一个技能不到五分钟。

### 1. 创建目录

```bash
mkdir -p ~/.hermes/skills/my-category/my-skill
```

### 2. 编写 SKILL.md

```markdown title="~/.hermes/skills/my-category/my-skill/SKILL.md"
---
name: my-skill
description: 简要描述此技能的功能
version: 1.0.0
metadata:
  hermes:
    tags: [my-tag, automation]
    category: my-category
---

# 我的技能

## 使用时机
当用户询问 [特定主题] 或需要 [特定任务] 时，请使用此技能。

## 流程
1. 首先，检查 [先决条件] 是否可用
2. 运行 `command --with-flags`
3. 解析输出并展示结果

## 陷阱
- 常见失败：[描述]。修复方法：[解决方案]
- 注意 [边缘情况]

## 验证
运行 `check-command` 以确认结果是否正确。
```

### 3. 添加参考文件（可选）

技能可以包含代理按需加载的支持文件：

```
my-skill/
├── SKILL.md                    # 主技能文档
├── references/
│   ├── api-docs.md             # 代理可查阅的 API 参考
│   └── examples.md             # 示例输入/输出
├── templates/
│   └── config.yaml             # 代理可使用的模板文件
└── scripts/
    └── setup.sh                # 代理可执行的脚本
```

在 SKILL.md 中引用它们：

```markdown
有关 API 详情，加载参考文件：`skill_view("my-skill", "references/api-docs.md")`
```

### 4. 测试它

启动一个新的会话并尝试您的技能：

```bash
hermes chat -q "/my-skill help me with the thing"
```

该技能会自动出现——无需注册。只需将其放入 `~/.hermes/skills/` 即可投入使用。

:::info
代理也可以使用 `skill_manage` 自己创建和更新技能。在解决复杂问题后，Hermes 可能会提议将该方法保存为技能以备下次使用。
:::

---

## 按平台管理技能

控制哪些技能在哪些平台上可用：

```bash
hermes skills
```

这将打开一个交互式 TUI，您可以在其中按平台（CLI、Telegram、Discord 等）启用或禁用技能。当您希望某些技能仅在特定上下文中使用时非常有用——例如，将开发技能排除在 Telegram 之外。

---

## 技能 vs 记忆

两者都可以在会话间持久化，但它们服务于不同的目的：

| | 技能 (Skills) | 记忆 (Memory) |
|---|---|---|
| **是什么** | 流程知识——如何做事 | 事实知识——事物是什么 |
| **何时** | 按需加载，仅在相关时加载 | 自动注入到每个会话中 |
| **大小** | 可以很大（数百行） | 应保持紧凑（仅关键事实） |
| **成本** | 直到加载为零词元 | 较小但恒定的词元成本 |
| **示例** | “如何部署到 Kubernetes” | “用户偏好深色模式，居住在 PST” |
| **谁创建** | 您、代理，或从中心安装 | 代理，基于对话内容 |

**经验法则：** 如果您会把它放在参考文档中，它就是技能。如果您会把它放在便利贴上，它就是记忆。

---

## 提示

**保持技能的聚焦性。** 一个试图涵盖“所有 DevOps”的技能会过于冗长和模糊。一个涵盖“将 Python 应用部署到 Fly.io”的技能则足够具体，具有真正的实用价值。

**让代理创建技能。** 在完成复杂的多个步骤任务后，Hermes 经常会提议将该方法保存为技能。说“是”——这些由代理撰写的技能捕获了包括过程中发现的陷阱在内的确切工作流程。

**使用分类。** 将技能组织到子目录中（`~/.hermes/skills/devops/`、`~/.hermes/skills/research/` 等）。这保持了列表的可管理性，并帮助代理更快地找到相关的技能。

**及时更新过时的技能。** 如果您使用了一个技能，但遇到了它没有覆盖的问题，请告诉 Hermes 使用您学到的内容来更新该技能。未维护的技能会成为负担。

---

*有关完整的技能参考——前置元数据字段、条件激活、外部目录等——请参阅 [技能系统](/docs/user-guide/features/skills)。*