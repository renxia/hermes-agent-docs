---
sidebar_position: 7
title: "Mixture of Agents"
description: "Create named MoA presets that appear as selectable models under the Mixture of Agents provider"
---

# 智能体混合（Mixture of Agents）

智能体混合是一个虚拟模型提供者。每个命名的MoA预设都会作为`moa`提供者下的一个可选模型显示。

当你选择一个MoA预设时，该预设的聚合器（aggregator）即为执行模型。它是编写助手响应和发出工具调用的模型。参考模型（Reference models）会先运行，并为聚合器提供分析数据。

当一项硬性任务受益于多个模型的视角，但仍需要Hermes正常的智能体循环（agent loop）——包括工具调用、后续迭代、中断、对话记录持久化以及与任何其他消息相同的会话上下文时，请使用MoA。

## 选择一个MoA预设作为模型

你可以通过常规的模型选择界面来选择一个预设：

```bash
/model default --provider moa
/model review --provider moa
```

仪表板（Dashboard）、TUI和桌面版模型选择器也显示了一个“智能体混合”提供者行。该行的模型即是你配置的预设名称。

## 斜杠命令快捷方式

`/moa`是对模型选择的一种便捷糖衣：

```bash
/moa
```

它将当前会话切换到默认的MoA预设。

```bash
/moa review
```

如果`review`与某个预设名称完全匹配，则会将当前会话切换到提供者`moa`、模型`review`。

```bash
/moa design and implement a migration plan for this flaky test cluster
```

如果文本与任何预设名称都不完全匹配，Hermes则将其视为一次性提示（one-shot prompt）。它会暂时切换到该轮次的默认MoA预设，发送提示，然后随后恢复之前的模型。

预设的匹配是严格精确的。Hermes不会模糊匹配预设名称，因此常规提示不会意外地成为模型切换指令。

## 在智能体循环中的工作原理

当选择`moa`提供者时，对于每一次主模型调用，Hermes会执行以下操作：

1.  根据名称解析所选定的预设；
2.  运行配置的参考模型（这些模型不会接收工具模式，它们只接收对话的用户/助手文本——而不是Hermes系统提示或工具调用记录——因此参考调用保持廉价并避免严格提供者的拒绝）；
3.  将参考模型的输出附加为聚合器的私有上下文；
4.  使用配置的聚合器和正常的Hermes工具模式进行调用；
5.  将聚合器的响应视为真实的模型响应；
6.  如果聚合器调用了工具，Hermes会正常执行这些工具；
7.  在下一次模型迭代中，相同的MoA流程会再次运行，覆盖更新后的对话内容，包括工具结果。

由于MoA是通过常规的模型系统选择的，它会自动与`/goal`、网关会话、TUI会话和桌面聊天功能组合使用。

## 配置预设

你可以从以下位置配置命名的MoA预设：

- 仪表板 → 模型 → 模型设置 → 智能体混合
- 桌面应用 → 设置 → 模型 → 智能体混合
- `hermes moa configure [名称]`
- `config.yaml`

配置文件存储显式的提供者/模型对，因此你可以混合使用不同的提供者并使用同一提供者下的多个模型：

```yaml
moa:
  default_preset: default
  presets:
    default:
      reference_models:
        - provider: openai-codex
          model: gpt-5.5
        - provider: openrouter
          model: deepseek/deepseek-v4-pro
      aggregator:
        provider: openrouter
        model: anthropic/claude-opus-4.8
      reference_temperature: 0.6
      aggregator_temperature: 0.4
      max_tokens: 4096
      enabled: true
```

默认预设：

- 参考模型：`openai-codex:gpt-5.5`
- 参考模型：`openrouter:deepseek/deepseek-v4-pro`
- 聚合器/执行模型：`openrouter:anthropic/claude-opus-4.8`

## 终端预设管理

```bash
hermes moa list
hermes moa configure              # 更新默认预设
hermes moa configure review       # 创建或更新一个命名的预设
hermes moa delete review
```

## 注意事项

- MoA已不再列在`hermes tools`下；没有`moa`工具集可以启用。
- 在某个预设上设置`enabled: false`会禁用该预设的参考模型扇出（reference fan-out）：聚合器将单独行动，这与你将其选择为一个普通模型是完全一样的。这是在仪表板和桌面设置中提供的按预设划分的关闭开关。
- 一个预设的聚合器不能是另一个MoA预设。故意阻止递归的MoA树结构。
- 单个参考模型的凭证失败不会中止该轮次。Hermes会将此失败包含在参考上下文中，并继续使用所有模型返回的结果。
- MoA会增加模型调用次数。一次模型迭代可能涉及多个参考调用加上一个聚合器调用。