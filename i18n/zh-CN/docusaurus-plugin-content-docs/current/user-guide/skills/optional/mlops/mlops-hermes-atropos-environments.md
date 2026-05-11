---
title: "Hermes Atropos 环境 — 为 Atropos 训练构建、测试与调试 Hermes 智能体强化学习环境"
sidebar_label: "Hermes Atropos 环境"
description: "为 Atropos 训练构建、测试与调试 Hermes 智能体强化学习环境"
---

{/* 此页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能文件 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Hermes Atropos 环境

为 Atropos 训练构建、测试与调试 Hermes 智能体强化学习环境。涵盖 HermesAgentBaseEnv 接口、奖励函数、智能体循环集成、带工具的评估、wandb 日志记录，以及三种 CLI 模式（serve/process/evaluate）。适用于在 hermes-agent 仓库中创建、审查或修复强化学习环境。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/mlops/hermes-atropos-environments` 安装 |
| 路径 | `optional-skills/mlops/hermes-atropos-environments` |
| 版本 | `1.1.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `atropos`, `rl`, `environments`, `training`, `reinforcement-learning`, `reward-functions` |
| 相关技能 | [`axolotl`](/docs/user-guide/skills/bundled/mlops/mlops-training-axolotl), [`fine-tuning-with-trl`](/docs/user-guide/skills/bundled/mlops/mlops-training-trl-fine-tuning), `lm-evaluation-harness` |

# Hermes 智能体 Atropos 环境

在 hermes-agent 仓库中构建与 Atropos 训练框架集成的 RL 环境指南。

## 架构概述

<!-- ascii-guard-ignore -->
```
Atropos BaseEnv (atroposlib/envs/base.py)
    └── HermesAgentBaseEnv (environments/hermes_base_env.py)
            ├── 处理智能体循环编排
            ├── 处理每组的工具解析
            ├── 处理用于奖励验证的 ToolContext
            └── 您的环境 (environments/your_env.py)
                    仅实现: setup, get_next_item, format_prompt,
                           compute_reward, evaluate, wandb_log
```
<!-- ascii-guard-ignore-end -->

Hermes 环境之所以特殊，是因为它们运行的是**带工具调用的多轮智能体循环**——而不仅仅是单轮补全。基础环境处理循环；您只需实现任务和评分。

## 文件位置

| 文件 | 用途 |
|------|------|
| `environments/hermes_base_env.py` | 包含智能体循环 + 工具解析的基类 |
| `environments/agent_loop.py` | `HermesAgentLoop` + `AgentResult` 数据类 |
| `environments/tool_context.py` | 用于奖励验证的 `ToolContext` |
| `environments/tool_call_parsers.py` | 第2阶段工具调用解析器 (hermes, mistral 等) |
| `environments/your_env.py` | 您的环境实现 |

## 推理设置 — 先询问用户

**重要：** 在运行任何测试、评估或数据生成命令之前，务必先询问用户他们想如何处理推理。**不要**假设使用 OpenRouter 或任何特定端点。请提供以下选项：

1.  **OpenRouter** — 询问他们想使用的模型（例如 `anthropic/claude-sonnet-4.5`, `google/gemini-2.5-pro`, `meta-llama/llama-3.3-70b-instruct` 等）。环境中需要设置 `OPENROUTER_API_KEY`。
2.  **自托管 VLLM 端点** — 询问他们的基础 URL（例如 `http://localhost:8000/v1`）和模型名称。设置 `--openai.server_type vllm`。
3.  **其他兼容 OpenAI 的 API** — 询问基础 URL、模型名称以及任何所需的 API 密钥。设置 `--openai.server_type openai` 和 `--openai.health_check false`。
4.  **本地 Atropos 训练服务器** — 用于 `serve` 模式下的实时训练循环。默认 `http://localhost:8000/v1`。

一旦用户告知他们的设置，请在该会话的所有 CLI 命令中使用这些值。示例提示：

> "在我运行之前，您想如何处理推理？
> 1.  OpenRouter（我需要您偏好的模型，例如 claude-sonnet-4.5）
> 2.  自托管的 VLLM 端点（给我 URL 和模型名称）
> 3.  其他兼容 OpenAI 的 API（给我 URL、模型和任何认证详情）
> 4.  本地 Atropos 训练服务器（serve 模式）"

### 按提供商划分的关键标志：

| 提供商 | `--openai.server_type` | `--openai.health_check` | `--openai.api_key` |
|--------|----------------------|------------------------|-------------------|
| OpenRouter | `openai` | `false` | `$OPENROUTER_API_KEY` |
| VLLM (自托管) | `vllm` | (默认) | (不需要) |
| 其他兼容 OpenAI | `openai` | `false` | 按需 |
| 本地 Atropos | (默认) | (默认) | (不需要) |

## 必需方法

### 1. `setup()` — 加载数据集并初始化状态

```python
async def setup(self) -> None:
    """在启动时调用一次。加载数据集，初始化状态。"""
    # 优先尝试 HuggingFace，如果失败则回退到内置样本
    try:
        from datasets import load_dataset
        ds = load_dataset("your/dataset", split="test")
        self._items = [...]
    except Exception:
        self._items = BUILTIN_SAMPLES

    # 始终拆分为训练/评估集
    random.shuffle(self._items)
    eval_size = max(20, int(len(self._items) * 0.1))
    self._eval_items = self._items[:eval_size]
    self._items = self._items[eval_size:]
```

### 2. `get_next_item()` — 返回下一个训练项

```python
async def get_next_item(self) -> dict:
    """返回下一项，循环遍历数据集。"""
    item = self._items[self._index % len(self._items)]
    self._index += 1
    return item
```

### 3. `format_prompt(item)` — 将项目转换为用户消息

```python
def format_prompt(self, item: dict) -> str:
    """将数据集项转换为用户可见的提示。"""
    return f"研究这个问题：{item['question']}"
```

### 4. `compute_reward(item, result, ctx)` — 对 rollout 进行评分

**关键**：`result` 是一个 `AgentResult`，**不是**字典。它具有以下属性：
- `result.messages` — 消息字典列表（OpenAI 格式）
- `result.turns_used` — 进行的 LLM 调用次数
- `result.finished_naturally` — 如果模型自愿停止则为 True
- `result.tool_errors` — ToolError 对象列表

**AgentResult 没有**: `final_response`, `tool_calls`, `tools_used`。
您必须从 `result.messages` 中提取这些信息：

```python
async def compute_reward(self, item, result: AgentResult, ctx: ToolContext) -> float:
    # 提取最终响应（最后一条有内容的助手消息）
    final_response = ""
    tools_used = []
    for msg in reversed(result.messages):
        if msg.get("role") == "assistant" and msg.get("content") and not final_response:
            final_response = msg["content"]
        if msg.get("role") == "assistant" and msg.get("tool_calls"):
            for tc in msg["tool_calls"]:
                fn = tc.get("function", {}) if isinstance(tc, dict) else {}
                name = fn.get("name", "")
                if name:
                    tools_used.append(name)

    # 使用 LLM 评判、启发式方法或 ToolContext 验证进行评分
    correctness = await self._llm_judge(item, final_response)
    return correctness
```

`ctx` (ToolContext) 让您可以访问智能体沙盒中的终端/文件以进行验证：
```python
# 在智能体的沙盒中运行测试
result = ctx.terminal("pytest /workspace/test.py")
return 1.0 if result["exit_code"] == 0 else 0.0
```

### 5. `evaluate()` — 使用完整智能体循环进行定期评估

**必须使用带工具的完整智能体循环**，而不是单轮的 `chat_completion`。
hermes-agent 环境的全部意义就在于基于智能体的评估：

```python
async def evaluate(self, *args, **kwargs) -> None:
    import time, uuid
    from environments.agent_loop import HermesAgentLoop
    from environments.tool_context import ToolContext

    start_time = time.time()
    tools, valid_names = self._resolve_tools_for_group()
    samples = []

    for item in self._eval_items[:self.config.eval_size]:
        task_id = str(uuid.uuid4())
        messages = []
        if self.config.system_prompt:
            messages.append({"role": "system", "content": self.config.system_prompt})
        messages.append({"role": "user", "content": self.format_prompt(item)})

        agent = HermesAgentLoop(
            server=self.server,
            tool_schemas=tools,
            valid_tool_names=valid_names,
            max_turns=self.config.max_agent_turns,
            task_id=task_id,
            temperature=0.0,  # 评估时使用确定性温度
            max_tokens=self.config.max_token_length,
            extra_body=self.config.extra_body,
        )
        result = await agent.run(messages)

        ctx = ToolContext(task_id)
        try:
            reward = await self.compute_reward(item, result, ctx)
        finally:
            ctx.cleanup()

        samples.append({"prompt": ..., "response": ..., "reward": reward})

    eval_metrics = {"eval/mean_reward": ...}
    await self.evaluate_log(metrics=eval_metrics, samples=samples,
                            start_time=start_time, end_time=time.time())
```

### 6. `wandb_log()` — 自定义指标记录

始终在最后调用 `super().wandb_log()`：

```python
async def wandb_log(self, wandb_metrics=None):
    if wandb_metrics is None:
        wandb_metrics = {}
    if self._reward_buffer:
        n = len(self._reward_buffer)
        wandb_metrics["train/mean_reward"] = sum(self._reward_buffer) / n
        self._reward_buffer.clear()
    await super().wandb_log(wandb_metrics)  # 必须调用 super
```

**陷阱**：`compute_reward` 会向指标缓冲区追加数据。在评估期间，这会污染训练指标。请回滚在评估期间添加的缓冲区条目。

## Config 类

始终创建一个带有 Pydantic Field 描述符的自定义配置子类。您可以调整的关键继承字段有：`enabled_toolsets`, `max_agent_turns`, `agent_temperature`, `system_prompt`, `terminal_backend`, `group_size`, `steps_per_eval`, `total_steps`。

## config_init() — 默认配置

返回 `(YourEnvConfig, [APIServerConfig(...)])` 的类方法。对于 OpenRouter/外部 API，将 `server_type` 设置为 `"openai"`。从环境变量加载 API 密钥。

## 三种CLI模式

```bash
# SERVE — 完整训练循环（连接Atropos API服务器）
python environments/my_env.py serve --openai.base_url http://localhost:8000/v1

# PROCESS — 离线数据生成（保存为JSONL格式）
python environments/my_env.py process --env.total_steps 10 --env.group_size 1 \
    --env.use_wandb false --env.data_path_to_save_groups output.jsonl \
    --openai.base_url "<USER_BASE_URL>" \
    --openai.model_name "<USER_MODEL>" \
    --openai.server_type <USER_SERVER_TYPE> --openai.health_check false

# EVALUATE — 独立评估（仅运行设置与评估）
python environments/my_env.py evaluate --env.eval_size 20 \
    --env.data_dir_to_save_evals /tmp/eval_results \
    --openai.base_url "<USER_BASE_URL>" \
    --openai.model_name "<USER_MODEL>" \
    --openai.server_type <USER_SERVER_TYPE> --openai.health_check false
```

配置优先级：CLI参数 > YAML文件 > config_init()默认值。

## 常见陷阱

1. **AgentResult包含.messages而非.final_response** — 通过反向遍历`result.messages`并查找最后一个包含内容的助手消息来提取最终响应。

2. **evaluate()必须使用HermesAgentLoop而非chat_completion** — 单轮chat_completion不支持工具。hermes-agent基准测试的核心是使用工具进行智能体评估。

3. **不要两次调用_llm_judge** — 如果`compute_reward`已调用它，请从缓冲区提取分数，而不是在`evaluate()`中单独调用judge。

4. **评估会污染训练缓冲区** — `compute_reward`会向指标缓冲区追加数据。评估期间，需回滚缓冲区条目以保持训练指标的纯净。

5. **为OpenRouter始终设置health_check=false** — OpenRouter没有`/health`端点。

6. **在evaluate模式下设置data_dir_to_save_evals** — 否则结果不会被保存。

7. **default_toolsets类变量 vs enabled_toolsets配置** — 类变量仅作为提示；配置字段才是实际控制工具解析的依据。

8. **消息中的工具调用解析** — 工具调用是字典，格式为`{"function": {"name": ..., "arguments": ...}}`。始终检查`isinstance(tc, dict)`。

9. **ToolContext.cleanup()** — 始终在`finally`代码块中调用以释放沙箱资源。

10. **对于外部API，server_type必须设置为"openai"** — 否则Atropos会假设使用本地VLLM服务器。

11. **始终询问用户的推理设置** — 切勿硬编码或假设特定的提供商/模型。请参阅上方的"推理设置"部分。

## 奖励函数模式

### LLM评判（适用于开放式任务）
使用`self.server.chat_completion()`配合评分提示。解析JSON响应以获取浮点分数。始终包含启发式回退机制（例如关键词重叠度），以在judge调用失败时使用。

### 二元验证（适用于代码/终端任务）
使用`ctx.terminal("pytest test.py -q")`在智能体的沙箱中运行测试。通过返回1.0表示通过，0.0表示失败。

### 多信号（组合多个指标）
对正确性（0.6）、工具使用（0.2）、效率（0.2）进行加权，可加上可选加分项。将分数限制在[0, 1]范围内。

## 测试您的环境

1. **导入测试**：`python -c "from environments.my_env import MyEnv; print('OK')"`
2. **询问用户的推理设置**（参见上方"推理设置"部分）
3. **Process模式**（1个数据项）：验证JSONL输出包含有效的token、掩码和分数
4. **Evaluate模式**：验证完整的智能体循环（带工具）能正常运行，且指标已正确记录
5. **检查奖励范围**：分数应在[0, 1]之间，且不应完全相同

## 最小实现检查清单

```python
class MyEnv(HermesAgentBaseEnv):
    name = "my-env"
    env_config_cls = MyEnvConfig

    @classmethod
    def config_init(cls): ...          # 默认服务器与环境配置
    async def setup(self): ...         # 加载数据集并进行训练/评估划分
    async def get_next_item(self): ... # 循环处理训练数据项
    def format_prompt(self, item): ... # 将数据项转换为用户消息字符串
    async def compute_reward(self, item, result, ctx): ...  # 为一次rollout评分
    async def evaluate(self, *args, **kwargs): ...  # 完整的智能体循环评估
    async def wandb_log(self, metrics=None): ...    # 自定义指标 + super()

if __name__ == "__main__":
    MyEnv.cli()
```