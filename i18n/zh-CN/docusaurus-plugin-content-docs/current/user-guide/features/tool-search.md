---
title: Tool Search
sidebar_position: 95
---

# Tool Search

当你为会话挂载了许多 MCP 服务器或非核心插件工具时，它们的 JSON 架构可能会在每一轮中消耗上下文窗口的很大一部分——即使其中只有少数工具与用户实际提出的问题相关。

**工具搜索**（Tool Search）是 Hermes 针对该问题的可选渐进式信息披露层。激活后，MCP 工具和插件工具在模型可见的工具数组中被三个桥接工具替代，模型按需加载每个具体工具的架构。

:::info Hermes 内置工具永不延迟加载
构成 Hermes 核心能力集的工具（`terminal`、`read_file`、`write_file`、`patch`、`search_files`、`todo`、`memory`、`browser_*`、`web_search`、`web_extract`、`clarify`、`execute_code`、`delegate_task`、`session_search`、`send_message` 以及其余的 `_HERMES_CORE_TOOLS`）*始终*直接加载。只有 MCP 工具和非核心插件工具才符合延迟加载的条件。
:::

## 工作原理

当工具搜索在某一轮激活时，模型会看到三个新工具来替代被延迟加载的工具：

```
tool_search(query, limit?)     — 搜索延迟加载工具的目录
tool_describe(name)            — 加载某个工具的完整架构
tool_call(name, arguments)     — 调用一个延迟加载的工具
```

一个典型的交互过程如下：

```
模型: tool_search("create a github issue")
  → { matches: [{ name: "mcp_github_create_issue", ... }, ...] }
模型: tool_describe("mcp_github_create_issue")
  → { parameters: { type: "object", properties: { ... } } }
模型: tool_call("mcp_github_create_issue", { title: "...", body: "..." })
  → { ok: true, issue_number: 42 }
```

当模型调用 `tool_call` 时，Hermes **解开桥接层**并调度底层工具，就像模型直接调用它一样。工具调用前钩子、护栏、审批提示和工具调用后钩子都针对真实的工具名称运行——而非针对 `tool_call`。CLI 和网关中的活动流也会解开桥接层，因此你看到的是底层工具，而非桥接工具。

## 何时激活？

默认情况下，工具搜索以 `auto` 模式运行：仅当可延迟加载的工具架构将消耗活跃模型上下文窗口的至少 10% 时才激活。低于该阈值时，工具数组的组装是直接透传的，你不会产生任何开销。

每次构建工具数组时都会重新评估这一决策，因此：

- 仅有少量 MCP 工具且上下文模型较长的会话永远不会激活工具搜索。
- 挂载了许多 MCP 服务器（通常 15+ 个工具）的会话会开始激活它。
- 在会话中途移除 MCP 服务器会在下一次组装时正确恢复直接暴露。

## 配置

```yaml
tools:
  tool_search:
    enabled: auto       # auto（默认）、on 或 off
    threshold_pct: 10   # 上下文百分比——仅在 auto 模式下使用
    search_default_limit: 5
    max_search_limit: 20
```

| 键 | 默认值 | 含义 |
| --- | --- | --- |
| `enabled` | `auto` | `auto` 在超过阈值时激活；`on` 在存在至少一个可延迟加载的工具时始终激活；`off` 完全禁用。 |
| `threshold_pct` | `10` | `auto` 模式启动时的上下文长度百分比。范围 0–100。 |
| `search_default_limit` | `5` | 模型在未指定 `limit` 的情况下调用 `tool_search` 时返回的命中数。 |
| `max_search_limit` | `20` | 模型可通过 `limit` 请求的硬上限。范围 1–50。 |

你也可以使用旧的布尔值形式：

```yaml
tools:
  tool_search: true   # 等价于 {enabled: auto}
```

## 不应使用的情况

工具搜索用固定的每轮 token 开销（三个桥接工具架构，约 300 个 token）和至少一次额外的往返（搜索 → 描述 → 调用）来换取延迟加载架构的节省。当你拥有大量工具但每轮只使用少数几个时，这是明显的收益；而当你总共只有少量工具时，它反而是额外开销。

`auto` 默认值会为你处理这一问题。如果你无条件设置 `enabled: on`，预计在小型工具集上会有轻微的每轮开销。

## 无法消除的权衡

这些权衡源于提示缓存完整性不变量——它们是任何渐进式信息披露设计所固有的，并非本实现所特有：

- **冷工具多一次往返。** 模型首次需要某个延迟加载的工具时，会花费一到两次额外的模型调用来查找并加载架构。静态端的 token 节省是实实在在的，但其中一部分会在运行时被偿还。
- **延迟加载的架构无法获得缓存收益。** 已加载的 `tool_describe` 结果会进入对话历史（因此在后续轮次中确实会被缓存），但它永远不会受益于系统提示缓存前缀。
- **依赖模型质量。** 工具搜索假设模型能够为其想要的工具编写合理的搜索查询。较小的模型在这方面表现较差；Anthropic 发布的公开数据（Opus 4 在使用与不使用工具搜索的情况下从 49% → 74%）既展示了优势，也表明仍有约 26 个百分点的准确率属于检索失败。
- **工具集编辑会使缓存失效。** 在会话中途添加或移除工具会改变桥接工具的描述（其中包含延迟加载工具的数量）和目录，因此提示缓存会失效。这与任何工具集编辑的权衡相同。

## 实现细节

- **检索：** 基于 BM25，对经过分词的工具名称 + 描述 + 参数名称进行检索。当 BM25 未返回任何正分时，回退到工具名称的字面子串匹配，以防止零 IDF 退化情况（例如在每个工具名称都包含 "github" 的目录中搜索 `"github"`）。
- **目录在跨轮次时无状态。** 每次组装时从当前工具定义列表重新构建——不使用会话键控的 `Map`。这避免了存储的目录与实时工具注册表不同步的那类 bug。
- **目录范围限定为会话的工具集。** `tool_search`、`tool_describe` 和 `tool_call` 只能看到和调用会话实际被授予的工具。被限制在工具集子集中的子智能体、看板工作器或网关会话无法使用桥接层来发现或调用该子集之外的工具——延迟加载目录是会话自身已启用/已禁用工具集中可延迟加载的切片，而非整个进程注册表。
- **无 JS 沙箱。** Hermes 使用更简单的"结构化工具"模式（搜索/描述/调用作为普通函数）。其他一些实现提供的 JS 沙箱"代码模式"是一个很大的攻击面；我们跳过了它。

## 参见

- `tools/tool_search.py` — 实现代码
- `tests/tools/test_tool_search.py` — 回归测试套件
- 原始实现 PR 中的 `openclaw-tool-search-report` PDF，包含塑造该设计的研究