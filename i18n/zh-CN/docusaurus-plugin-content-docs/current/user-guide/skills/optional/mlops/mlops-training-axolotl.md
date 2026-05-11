---
title: "Axolotl — Axolotl: YAML LLM 微调（LoRA、DPO、GRPO）"
sidebar_label: "Axolotl"
description: "Axolotl: YAML LLM 微调（LoRA、DPO、GRPO）"
---

{/* 本页面由 website/scripts/generate-skill-docs.py 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Axolotl

Axolotl：使用 YAML 配置进行 LLM 微调（LoRA、DPO、GRPO）。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/mlops/axolotl` 安装 |
| 路径 | `optional-skills/mlops/training/axolotl` |
| 版本 | `1.0.0` |
| 作者 | Orchestra Research |
| 许可证 | MIT |
| 依赖项 | `axolotl`, `torch`, `transformers`, `datasets`, `peft`, `accelerate`, `deepspeed` |
| 平台 | linux, macos |
| 标签 | `微调`, `Axolotl`, `LLM`, `LoRA`, `QLoRA`, `DPO`, `KTO`, `ORPO`, `GRPO`, `YAML`, `HuggingFace`, `DeepSpeed`, `多模态` |

## 参考：完整的 SKILL.md

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Axolotl 技能

## 内容介绍

使用 Axolotl 微调 LLM 的专家指导——YAML 配置、支持100多种模型、LoRA/QLoRA、DPO/KTO/ORPO/GRPO、多模态支持。

基于官方文档生成的全面 axolotl 开发辅助。

## 何时使用此技能

此技能应在以下情况下触发：
- 使用 axolotl 工作时
- 询问 axolotl 功能或 API 时
- 实现 axolotl 解决方案时
- 调试 axolotl 代码时
- 学习 axolotl 最佳实践时

## 快速参考

### 常见模式

**模式 1：** 为了验证训练作业是否存在可接受的数据传输速度，运行 NCCL 测试可以帮助定位瓶颈，例如：

```
./build/all_reduce_perf -b 8 -e 128M -f 2 -g 3
```

**模式 2：** 在 Axolotl YAML 中配置模型使用 FSDP。例如：

```
fsdp_version: 2
fsdp_config:
  offload_params: true
  state_dict_type: FULL_STATE_DICT
  auto_wrap_policy: TRANSFORMER_BASED_WRAP
  transformer_layer_cls_to_wrap: LlamaDecoderLayer
  reshard_after_forward: true
```

**模式 3：** `context_parallel_size` 应该是 GPU 总数的约数。例如：

```
context_parallel_size
```

**模式 4：** 例如：- 使用 8 个 GPU 且没有序列并行：每步处理 8 个不同批次 - 使用 8 个 GPU 且 context_parallel_size=4：每步仅处理 2 个不同批次（每个批次分配在 4 个 GPU 上） - 如果每个 GPU 的 micro_batch_size 为 2，则全局批大小从 16 减少到 4

```
context_parallel_size=4
```

**模式 5：** 在配置中设置 `save_compressed: true` 可以使用压缩格式保存模型，这将： - 减少约 40% 的磁盘空间占用 - 保持与 vLLM 的兼容性以实现加速推理 - 保持与 llmcompressor 的兼容性以进行进一步优化（例如：量化）

```
save_compressed: true
```

**模式 6：** 注意 将你的集成代码放在 `integrations` 文件夹中并非必需。它可以位于任何位置，只要它作为包安装在你的 Python 环境中。示例请参见此仓库：https://github.com/axolotl-ai-cloud/diff-transformer

```
integrations
```

**模式 7：** 同时处理单个样本和批量数据。 - 单个样本：sample['input_ids'] 是一个 list[int] - 批量数据：sample['input_ids'] 是一个 list[list[int]]

```
utils.trainer.drop_long_seq(sample, sequence_len=2048, min_sequence_len=2)
```

### 示例代码模式

**示例 1** (python):
```python
cli.cloud.modal_.ModalCloud(config, app=None)
```

**示例 2** (python):
```python
cli.cloud.modal_.run_cmd(cmd, run_folder, volumes=None)
```

**示例 3** (python):
```python
core.trainers.base.AxolotlTrainer(
    *_args,
    bench_data_collator=None,
    eval_data_collator=None,
    dataset_tags=None,
    **kwargs,
)
```

**示例 4** (python):
```python
core.trainers.base.AxolotlTrainer.log(logs, start_time=None)
```

**示例 5** (python):
```python
prompt_strategies.input_output.RawInputOutputPrompter()
```

## 参考文件

此技能包含 `references/` 目录下的全面文档：

- **api.md** - API 文档
- **dataset-formats.md** - 数据集格式文档
- **other.md** - 其他文档

需要详细信息时，请使用 `view` 命令查看具体的参考文件。

## 使用此技能

### 对于初学者
请从 getting_started 或 tutorials 参考文件开始，了解基础概念。

### 对于特定功能
请使用相应的类别参考文件（api、guides 等）获取详细信息。

### 对于代码示例
上方的快速参考部分包含了从官方文档中提取的常见模式。

## 资源

### references/
从官方来源提取的有组织的文档。这些文件包含：
- 详细解释
- 带语言标注的代码示例
- 原始文档链接
- 便于快速导航的目录

### scripts/
将常见自动化任务的辅助脚本添加到此处。

### assets/
将模板、样板或示例项目添加到此处。

## 注意事项

- 此技能由官方文档自动生成
- 参考文件保留了源文档的结构和示例
- 代码示例包含语言检测以实现更好的语法高亮
- 快速参考模式是从文档中的常见用法示例中提取的

## 更新

要使用更新后的文档刷新此技能：
1. 使用相同的配置重新运行抓取器
2. 技能将使用最新信息重建