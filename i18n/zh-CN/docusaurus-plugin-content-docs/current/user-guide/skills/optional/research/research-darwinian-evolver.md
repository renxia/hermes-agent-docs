---
title: "达尔文进化器 — 使用 Imbue 的进化循环优化提示词/正则表达式/SQL/代码"
sidebar_label: "达尔文进化器"
description: "使用 Imbue 的进化循环优化提示词/正则表达式/SQL/代码"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 达尔文进化器

使用 Imbue 的进化循环优化提示词/正则表达式/SQL/代码。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/research/darwinian-evolver` 安装 |
| 路径 | `optional-skills/research/darwinian-evolver` |
| 版本 | `0.1.0` |
| 作者 | Bihruze (Asahi0x), Hermes 智能体 |
| 许可证 | MIT |
| 平台 | linux, macos |
| 标签 | `evolution`, `optimization`, `prompt-engineering`, `research` |
| 相关技能 | [`arxiv`](/user-guide/skills/bundled/research/research-arxiv), [`jupyter-live-kernel`](/user-guide/skills/bundled/data-science/data-science-jupyter-live-kernel) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# 达尔文进化器

运行 Imbue 的 [darwinian_evolver](https://github.com/imbue-ai/darwinian_evolver) —— 一个由 LLM 驱动的进化搜索循环 —— 来针对适应度函数优化一个**提示词、正则表达式、SQL 查询或小型代码片段**。

状态：上游工具的轻量级包装。该技能安装它，指导智能体编写一个 `Problem` 定义（有机体 + 评估器 + 变异器），并通过上游 CLI 或一个小型自定义 Python 驱动器来驱动循环。

**许可证：** 上游工具采用 **AGPL-3.0** 许可。此技能仅通过上游 CLI 或 `subprocess`/`uv run` 调用来使用它（仅是聚合）。**不要**将上游类导入到 Hermes 核心中。

## 何时使用

- 用户说“优化这个提示词”、“为 X 进化一个正则表达式”、“自动改进此代码/SQL”、“搜索更好的指令”。
- 你拥有一个评分器（精确匹配、正则通过率、单元测试、LLM 评审、运行时指标）**和**一个起始候选（有机体）。如果你没有评分器，请先停下来定义一个 —— 这是困难的部分。
- 成本可接受：一次典型运行包含 50–500 次 LLM 调用。使用 gpt-4o-mini 时花费很少；使用 Claude Sonnet 时可能需要几美元。

当以下情况时**不要**使用：
- 优化目标是可微分的（请使用梯度下降 / DSPy）。
- 你只需要尝试 2-3 个变体 —— 手动编写即可。
- 适应度信号纯粹是主观的，没有可衡量的标准。

## 前提条件

- Python ≥3.11
- `git`、`uv`（或 `pip`）
- `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` 或 `OPENAI_API_KEY` 中的任意一个

该技能包含一个小型 `parrot_openrouter.py` 驱动器，它通过 OpenAI SDK 使用 `OPENROUTER_API_KEY`，因此 OpenRouter 上的任何模型都可以工作。上游 CLI 本身硬编码了 Anthropic，需要 `ANTHROPIC_API_KEY`。

## 安装（一次性）

通过 `terminal` 工具运行：

```bash
mkdir -p ~/.hermes/cache/darwinian-evolver && cd ~/.hermes/cache/darwinian-evolver
[ -d darwinian_evolver ] || git clone --depth 1 https://github.com/imbue-ai/darwinian_evolver.git
cd darwinian_evolver && uv sync
```

验证：

```bash
cd ~/.hermes/cache/darwinian-evolver/darwinian_evolver \
  && uv run darwinian_evolver --help | head -5
```

## 快速入门 — 内置的鹦鹉示例

小型冒烟测试（需要 `ANTHROPIC_API_KEY`）：

```bash
cd ~/.hermes/cache/darwinian-evolver/darwinian_evolver
uv run darwinian_evolver parrot \
  --num_iterations 2 \
  --num_parents_per_iteration 2 \
  --mutator_concurrency 2 --evaluator_concurrency 2 \
  --output_dir /tmp/parrot_demo
```

输出：
- `/tmp/parrot_demo/snapshots/iteration_N.pkl` — 每次迭代的序列化种群快照
- `/tmp/parrot_demo/<jsonl>` — 每次迭代的 JSON 日志（路径在最后打印）

在浏览器中打开 `~/.hermes/cache/darwinian-evolver/darwinian_evolver/darwinian_evolver/lineage_visualizer.html` 并加载 JSON 日志以查看进化树。

## 快速入门 — OpenRouter 驱动器（无需 Anthropic 密钥）

该技能包含 `scripts/parrot_openrouter.py` —— 同样的鹦鹉问题，但 LLM 调用通过 OpenRouter 进行，因此任何提供商都适用。

```bash
# 从技能安装的位置开始：
SKILL_DIR=~/.hermes/skills/research/darwinian-evolver
DE_DIR=~/.hermes/cache/darwinian-evolver/darwinian_evolver

cd "$DE_DIR" && \
  EVOLVER_MODEL='openai/gpt-4o-mini' \
  uv run --with openai python "$SKILL_DIR/scripts/parrot_openrouter.py" \
    --num_iterations 3 --num_parents_per_iteration 2 \
    --output_dir /tmp/parrot_or
```

使用 `scripts/show_snapshot.py` 检查结果：

```bash
uv run --with openai python "$SKILL_DIR/scripts/show_snapshot.py" \
  /tmp/parrot_or/snapshots/iteration_3.pkl
```

预期输出：7 个按分数排序的进化提示模板，其中最佳分数大约在 0.6–0.8 之间（种子 `Say {{ phrase }}` 得分为 0.000）。

## 定义自定义问题

该技能包含 `templates/custom_problem_template.py` —— 复制、编辑、运行。你必须定义三件事：

1. **`Organism`（有机体）** —— 一个 Pydantic `BaseModel` 子类，保存正在进化的工件（`prompt_template: str`、`regex_pattern: str`、`sql_query: str`、`code_block: str` 等）。添加一个 `run(*args)` 方法来执行它。

2. **`Evaluator`（评估器）** —— `.evaluate(organism) -> EvaluationResult(score=..., trainable_failure_cases=[...], holdout_failure_cases=[...], is_viable=True)`。
   - **`score`（分数）** 范围是 `[0, 1]`。越高越好。
   - **`trainable_failure_cases`（可训练失败案例）** —— 变异器看到的部分。包含足够的上下文（输入、期望、实际）以便 LLM 诊断。
   - **`holdout_failure_cases`（保留失败案例）** —— 不在变异器的视野内。用这些来检测过拟合。
   - **`is_viable=True`** 除非有机体完全损坏（抛出异常、返回 None 等）。一个得分为 0 的可行有机体是可以的 —— 它只是会在父代选择中被降权。

3. **`Mutator`（变异器）** —— `.mutate(organism, failure_cases, learning_log_entries) -> list[Organism]`。
   通常：构建一个 LLM 提示，包含当前有机体 + 一个失败案例 + 请求提出修复建议；解析 LLM 的响应；返回一个新的 `Organism`。解析失败时返回 `[]` —— 循环会处理它。

然后编写一个驱动器脚本，将 `Problem(initial_organism, evaluator, [mutators])` 连接到 `EvolveProblemLoop`，并迭代 `loop.run(num_iterations=N)` —— 随附的 `scripts/parrot_openrouter.py` 就是参考。

## 真正重要的超参数

| 标志 | 默认值 | 何时更改 |
|---|---|---|
| `--num_iterations` | 5 | 一旦你信任评估器，可以增加到 10–20 |
| `--num_parents_per_iteration` | 4 | 为了廉价探索，降到 2 |
| `--mutator_concurrency` | 10 | 为了规避速率限制，降到 2–4 |
| `--evaluator_concurrency` | 10 | 同上；评估器也会调用 LLM |
| `--batch_size` | 1 | 一旦你的变异器能处理多个失败案例，增加到 3–5 |
| `--verify_mutations` | 关闭 | 一旦变异器效率低下，就打开（根据 Imbue 的数据，后续运行可节省 >10 倍成本） |
| `--midpoint_score` | `p75` | 除非分数聚集，否则保持原样 |
| `--sharpness` | 10 | 保持原样 |

## 陷阱

1. **`初始有机体必须可行`** —— 即使是在一个得分为 0 的种子上，也要在你的 `EvaluationResult` 中设置 `is_viable=True`。循环拒绝不可行的有机体，因为这意味着循环没有进化基础。
2. **内容过滤器会终止运行。** 由 Azure 支持的 OpenRouter 模型会拒绝类似“忽略之前的指令”这样的短语，并返回 HTTP 400 错误。用 `try/except` 包装 LLM 调用并返回 `f"<LLM_ERROR: {e}>"` —— 进化器会给该有机体打 0 分然后继续。
3. **`loop.run()` 是一个生成器** —— 调用它不会运行任何东西，直到你开始迭代。使用 `for snap in loop.run(num_iterations=N):`。
4. **快照是嵌套的 pickle 文件。** `iteration_N.pkl` 包含一个字典，其中有 `population_snapshot`（更多 pickle 字节）。要 unpickle，你必须能在 unpickle 时相同的点路径下导入 `Organism` 类。
5. **并发默认值很激进。** 10/10 在大多数提供商上会触发速率限制。建议从 2/2 开始。
6. **CLI 硬编码为 Anthropic。** `uv run darwinian_evolver <problem>` 会寻找 `ANTHROPIC_API_KEY` 并使用 Claude Sonnet。要使用其他提供商，请编写一个类似 `parrot_openrouter.py` 的驱动器。
7. **AGPL 许可。** 切勿在 Hermes 核心内部使用 `from darwinian_evolver import ...`。`~/.hermes/skills/...` 下的自定义驱动器脚本属于用户端，是可以的。
8. **没有 PyPI 包。** `pip install darwinian-evolver` 会拉取错误的东西。始终从 GitHub 仓库安装。

## 验证

安装并运行鹦鹉示例后，执行以下命令，返回代码 0 即可确认成功：

```bash
DE_DIR=~/.hermes/cache/darwinian-evolver/darwinian_evolver
ls "$DE_DIR/darwinian_evolver/lineage_visualizer.html" >/dev/null && \
cd "$DE_DIR" && uv run darwinian_evolver --help >/dev/null && \
echo "darwinian-evolver: OK"
```

## 参考资料

- [Imbue 研究文章](https://imbue.com/research/2026-02-27-darwinian-evolver/)
- [ARC-AGI-2 结果](https://imbue.com/research/2026-02-27-arc-agi-2-evolution/)
- [imbue-ai/darwinian_evolver](https://github.com/imbue-ai/darwinian_evolver) (AGPL-3.0)
- [Darwin Gödel Machines](https://arxiv.org/abs/2505.22954)
- [PromptBreeder](https://arxiv.org/abs/2309.16797)