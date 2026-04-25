---
title: "Obsidian — 读取、搜索并创建 Obsidian 库中的笔记"
sidebar_label: "Obsidian"
description: "读取、搜索并创建 Obsidian 库中的笔记"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Obsidian

读取、搜索并创建 Obsidian 库中的笔记。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/note-taking/obsidian` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。当技能激活时，智能体将看到这些指令。
:::

# Obsidian 库

**位置：** 通过 `OBSIDIAN_VAULT_PATH` 环境变量设置（例如在 `~/.hermes/.env` 中）。

如果未设置，则默认为 `~/Documents/Obsidian Vault`。

注意：库路径可能包含空格，请始终用引号括起来。

## 读取笔记

```bash
VAULT="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian Vault}"
cat "$VAULT/Note Name.md"
```

## 列出笔记

```bash
VAULT="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian Vault}"

# 所有笔记
find "$VAULT" -name "*.md" -type f

# 在特定文件夹中
ls "$VAULT/Subfolder/"
```

## 搜索

```bash
VAULT="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian Vault}"

# 按文件名
find "$VAULT" -name "*.md" -iname "*keyword*"

# 按内容
grep -rli "keyword" "$VAULT" --include="*.md"
```

## 创建笔记

```bash
VAULT="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian Vault}"
cat > "$VAULT/New Note.md" << 'ENDNOTE'
# 标题

此处为内容。
ENDNOTE
```

## 追加到笔记

```bash
VAULT="${OBSIDIAN_VAULT_PATH:-$HOME/Documents/Obsidian Vault}"
echo "
此处为新增内容。" >> "$VAULT/Existing Note.md"
```

## 维基链接

Obsidian 使用 `[[笔记名称]]` 语法链接笔记。创建笔记时，请使用这些语法链接相关内容。