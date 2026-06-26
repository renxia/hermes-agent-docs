---
title: "Obsidian — 在 Obsidian 存储库中读取、搜索、创建和编辑笔记"
sidebar_label: "Obsidian"
description: "在 Obsidian 存储库中读取、搜索、创建和编辑笔记"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Obsidian

在 Obsidian 存储库中读取、搜索、创建和编辑笔记。

## 技能元数据

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/note-taking/obsidian` |
| Platforms | linux, macos, windows |

## 参考：完整的SKILL.md

:::info
以下是当此技能被触发时，Hermes 所加载的完整技能定义。这是该智能体在技能激活时所看到的指令。
:::

# Obsidian 存储库

使用此技能进行以文件系统为基础的 Obsidian 存储库工作：读取笔记、列出笔记、搜索笔记文件、创建笔记、追加内容和添加维基链接。

## 存储库路径

在调用文件工具之前，请使用已知的或已解析的存储库路径。

文档中定义的存储库路径约定是 `OBSIDIAN_VAULT_PATH` 环境变量，例如来自 `${HERMES_HOME:-~/.hermes}/.env`。如果它未设置，则使用 `~/Documents/Obsidian Vault`。

文件工具不会扩展 Shell 变量。请勿将包含 `$OBSIDIAN_VAULT_PATH` 的路径传递给 `read_file`、`write_file`、`patch` 或 `search_files`；请先解析存储库路径，然后传递一个具体的绝对路径。存储库路径可能包含空格，这也是优先使用文件工具而非 Shell 命令的另一个原因。

如果存储库路径未知，可以使用 `terminal` 来解析 `OBSIDIAN_VAULT_PATH` 或检查备用路径是否存在。一旦知道该路径，就切换回使用文件工具。

## 读取笔记

使用已解析的绝对路径和 `read_file`。这优于使用 `cat`，因为它提供了行号和分页信息。

## 列出笔记

使用 `search_files`，设置 `target: "files"` 和已解析的存储库路径。这优于使用 `find` 或 `ls`。

- 要列出所有 Markdown 笔记，请在存储库路径下使用 `pattern: "*.md"`。
- 要列出一个子文件夹，请在该子文件夹的绝对路径下进行搜索。

## 搜索

使用 `search_files` 进行文件名和内容搜索。这优于使用 `grep`、`find` 或 `ls`。

- 对于文件名，请使用 `search_files`，设置 `target: "files"` 和文件名 `pattern`。
- 对于笔记内容，请使用 `search_files`，设置 `target: "content"`，将内容正则表达式作为 `pattern`，并在希望限制匹配为 Markdown 笔记时设置 `file_glob: "*.md"`。

## 创建笔记

使用已解析的绝对路径和完整的 Markdown 内容，并调用 `write_file`。这优于使用 Shell here-docs 或 `echo`，因为它避免了 Shell 引用问题并返回结构化结果。

## 追加到笔记

当不感到别扭时，请优先使用原生文件工具工作流程：

- 使用 `read_file` 读取目标笔记。
- 当存在稳定上下文时（例如在现有标题后添加一个部分或在已知尾部块之前追加内容），请使用 `patch` 进行锚定追加。
- 当重写整个笔记比构建脆弱的补丁更清晰时，请使用 `write_file`。

对于使用 `patch` 进行锚定追加，请用锚点加上新内容来替换原锚点。

对于没有稳定上下文的简单追加，如果它是最清晰安全的选项，则可以使用 `terminal`。

## 定向编辑

当当前内容提供稳定的上下文时，请使用 `patch` 进行集中的笔记更改。这优于 Shell 文本重写。

## 维基链接

Obsidian 使用 `[[笔记名称]]` 语法来链接笔记。在创建笔记时，请使用这些链接来关联相关内容。