---
title: "Unsloth"
sidebar_label: "Unsloth"
description: "Unsloth 快速微调专家指南 - 训练速度提升 2-5 倍，内存占用减少 50-80%，支持 LoRA/QLoRA 优化"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Unsloth

Unsloth 快速微调专家指南 - 训练速度提升 2-5 倍，内存占用减少 50-80%，支持 LoRA/QLoRA 优化

## 技能元数据

| | |
|---|---|
| 来源 | 捆绑（默认安装） |
| 路径 | `skills/mlops/training/unsloth` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `unsloth`, `torch`, `transformers`, `trl`, `datasets`, `peft` |
| 标签 | `微调`, `Unsloth`, `快速训练`, `LoRA`, `QLoRA`, `内存高效`, `优化`, `Llama`, `Mistral`, `Gemma`, `Qwen` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Unsloth 技能

根据官方文档生成的 unsloth 开发综合辅助。

## 何时使用此技能

在以下情况应触发此技能：
- 使用 unsloth 时
- 询问 unsloth 功能或 API 时
- 实施 unsloth 解决方案时
- 调试 unsloth 代码时
- 学习 unsloth 最佳实践时

## 快速参考

### 常见模式

*快速参考模式将随着您使用技能而添加。*

## 参考文件

此技能在 `references/` 中包含综合文档：

- **llms-txt.md** - Llms-Txt 文档

当需要详细信息时，使用 `view` 读取特定参考文件。

## 使用此技能

### 初学者
从 getting_started 或 tutorials 参考文件开始，了解基础概念。

### 特定功能
使用适当的类别参考文件（api、guides 等）获取详细信息。

### 代码示例
上面的快速参考部分包含从官方文档中提取的常见模式。

## 资源

### references/
从官方来源提取的有组织文档。这些文件包含：
- 详细解释
- 带有语言注释的代码示例
- 原始文档链接
- 目录，便于快速导航

### scripts/
在此处添加用于常见自动化任务的辅助脚本。

### assets/
在此处添加模板、样板或示例项目。

## 注意事项

- 此技能根据官方文档自动生成
- 参考文件保留了源文档的结构和示例
- 代码示例包含语言检测，以实现更好的语法高亮
- 快速参考模式是从文档中的常见用法示例中提取的

## 更新

要使用更新的文档刷新此技能：
1. 使用相同的配置重新运行抓取器
2. 技能将使用最新信息重建

<!-- Trigger re-upload 1763621536 -->