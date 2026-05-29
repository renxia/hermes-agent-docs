---
title: "达尔文进化器 —— 使用 Imbue 的进化循环来优化提示词/正则表达式/SQL/代码"
sidebar_label: "达尔文进化器"
description: "使用 Imbue 的进化循环来优化提示词/正则表达式/SQL/代码"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 达尔文进化器

使用 Imbue 的进化循环来优化提示词/正则表达式/SQL/代码。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 —— 通过 `hermes skills install official/research/darwinian-evolver` 安装 |
| 路径 | `optional-skills/research/darwinian-evolver` |
| 版本 | `0.1.0` |
| 作者 | Bihruze (Asahi0x), Hermes 智能体 |
| 许可 | MIT |
| 平台 | linux, macos |
| 标签 | `evolution`, `optimization`, `prompt-engineering`, `research` |
| 相关技能 | [`arxiv`](/docs/user-guide/skills/bundled/research/research-arxiv), [`jupyter-live-kernel`](/docs/user-guide/skills/bundled/data-science/data-science-jupyter-live-kernel) |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是技能激活时智能体所看到的指令。
:::

# 达尔文进化器

运行 Imbue 的 [darwinian_evolver](https://github.com/imbue-ai/darwinian_evolver) —— 一个由 LLM 驱动的进化搜索循环 —— 来针对一个适应度函数优化一个 **提示词、正则表达式、SQL 查询或小段代码**。

状态：围绕上游工具的轻量包装。该技能安装它，引导智能体编写一个 `Problem` 定义（生物体 + 评估器 + 变异器），并通过上游 CLI 或一个小型自定义 Python 驱动程序来驱动循环。

**许可：** 上游工具为 **AGPL-3.0**。该技能仅通过上游 CLI 或 `subprocess`/`uv run` 调用它（仅为聚合）。请勿将上游类导入 Hermes 核心。

## 何时使用

- 用户说“优化这个提示词”、“为 X 进化一个正则表达式”、“自动改进这段代码/SQL”、“搜索一个更好的指令”。
- 你拥有一个评分器（精确匹配、正则表达式通过率、单元测试、LLM 评判、运行时指标）和一个初始候选（生物体）。如果你没有评分器，请停止并首先定义一个——这是困难的部分。
- 成本可以接受：典型运行需要 50–500 次 LLM 调用。使用 gpt-4o-mini 只需几美分；使用 Claude Sonnet 可能需要几美元。

**不要**在以下情况使用：
- 优化目标是可微分的（使用梯度下降 / DSPy）。
- 你只需要尝试 2–3 个变体——直接手动编写。
- 适应度信号完全主观，没有可衡量的标准。

## 前提条件

- Python ≥3.11
- `git`, `uv` (或 `pip`)
- 以下之一：`OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, 或 `OPENAI_API_KEY`

该技能附带一个小型 `parrot_openrouter.py` 驱动程序，它通过 OpenAI SDK 使用 `OPENROUTER_API_KEY`，因此 OpenRouter 上的任何模型都可以工作。上游 CLI 本身硬编码了 Anthropic，需要 `ANTHROPIC_API_KEY`。

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

## 快速开始 —— 内置的鹦鹉示例

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
- `/tmp/parrot_demo/snapshots/iteration_N.pkl` —— 每个迭代的种群 pickle 文件
- `/tmp/parrot_demo/<jsonl>` —— 每个迭代的 JSON 日志（路径在末尾打印）

在浏览器中打开 `~/.hermes/cache/darwinian-evolver/darwinian_evolver/darwinian_evolver/lineage_visualizer.html` 并加载 JSON 日志以查看进化树。

## 快速开始 —— OpenRouter 驱动程序（无需 Anthropic 密钥）

该技能附带 `scripts/parrot_openrouter.py` —— 相同的鹦鹉问题，但 LLM 调用通过 OpenRouter 进行，因此任何提供者都可以工作。

```bash
# 从技能安装位置开始：
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

预期输出：7 个进化后的提示词模板按分数排序，最佳分数在 0.6–0.8 左右（种子 `Say {{ phrase }}` 得分为 0.000）。

## 定义自定义问题

该技能附带 `templates/custom_problem_template.py` —— 复制、编辑、运行。
你必须定义三样东西：

1. **`Organism`** —— 一个 Pydantic `BaseModel` 子类，持有正在进化的制品（`prompt_template: str`, `regex_pattern: str`, `sql_query: str`, `code_block: str` 等）。添加一个 `run(*args)` 方法来执行它。

2. **`Evaluator`** —— `.evaluate(organism) -> EvaluationResult(score=..., trainable_failure_cases=[...], holdout_failure_cases=[...], is_viable=True)`。
   - **`score`** 在 `[0, 1]` 之间。越高越好。
   - **`trainable_failure_cases`** —— 变异器看到的内容。包含足够的上下文（输入、预期、实际）以供 LLM 诊断。
   - **`holdout_failure_cases`** —— 不包含在变异器的视图中。用于检测过拟合。
   - **`is_viable=True`** 除非生物体完全损坏（抛出异常、返回 None 等）。一个得分为 0 但可行的生物体是可以的——它只是在父代选择中权重降低。

3. **`Mutator`** —— `.mutate(organism, failure_cases, learning_log_entries) -> list[Organism]`。
   通常做法：构建一个 LLM 提示，包含当前生物体 + 一个失败案例 + 一个提出修复建议的请求；解析 LLM 的响应；返回一个新的 `Organism`。解析失败时返回 `[]` —— 循环会处理它。

然后编写一个驱动脚本，将 `Problem(initial_organism, evaluator, [mutators])` 接入 `EvolveProblemLoop`，并通过 `loop.run(num_iterations=N)` 进行迭代 —— 附带的 `scripts/parrot_openrouter.py` 是参考。

## 真正重要的超参数

| 标志 | 默认值 | 何时更改 |
|---|---|---|
| `--num_iterations` | 5 | 一旦你信任评估器，就增加到 10–20 |
| `--num_parents_per_iteration` | 4 | 对于廉价探索，降低到 2 |
| `--mutator_concurrency` | 10 | 降低到 2–4 以避免速率限制 |
| `--evaluator_concurrency` | 10 | 同上；评估器也调用 LLM |
| `--batch_size` | 1 | 一旦你的变异器能处理多个失败案例，就提高到 3–5 |
| `--verify_mutations` | 关闭 | 一旦变异器浪费严重就打开（根据 Imbue，在后期运行中可节省 >10 倍成本） |
| `--midpoint_score` | `p75` | 除非分数聚集，否则保持原样 |
| `--sharpness` | 10 | 保持原样 |

## 陷阱

1. **`初始生物体必须是可行的`** —— 即使是一个得分为 0 的种子，也要在 `EvaluationResult` 中设置 `is_viable=True`。循环拒绝不可行的生物体，因为它们意味着循环没有东西可以进化。
2. **提供者的内容过滤器会终止运行。** 支持 Azure 的 OpenRouter 模型会以 HTTP 400 拒绝诸如“忽略之前的指令”之类的短语。将 LLM 调用包裹在 `try/except` 中并返回 `f"<LLM_ERROR: {e}>"` —— 进化器将直接给该生物体打 0 分并继续。
3. **`loop.run()` 是一个生成器** —— 调用它不会执行任何操作，直到你迭代它。使用 `for snap in loop.run(num_iterations=N):`。
4. **快照是嵌套的 pickle 文件。** `iteration_N.pkl` 包含一个字典，其中 `population_snapshot` 是更多的 pickle 字节。要解 pickle，你必须拥有在 pickle 时相同的点分路径下可导入的 `Organism` 类。
5. **并发默认值很激进。** 10/10 在大多数提供者上都会触发速率限制。从 2/2 开始。
6. **CLI 硬编码为 Anthropic。** `uv run darwinian_evolver <problem>` 会寻找 `ANTHROPIC_API_KEY` 并使用 Claude Sonnet。要使用其他任何提供者，请编写一个类似 `parrot_openrouter.py` 的驱动程序。
7. **AGPL。** 切勿在 Hermes 核心中使用 `from darwinian_evolver import ...`。位于 `~/.hermes/skills/...` 下的自定义驱动脚本是用户端的，没问题。
8. **没有 PyPI 包。** `pip install darwinian-evolver` 会拉取错误的东西。始终从 GitHub 仓库安装。

## 验证

在安装 + 一次鹦鹉运行后，以下命令的退出码 0 就足够了：

```bash
DE_DIR=~/.hermes/cache/darwinian-evolver/darwinian_evolver
ls "$DE_DIR/darwinian_evolver/lineage_visualizer.html" >/dev/null && \
cd "$DE_DIR" && uv run darwinian_evolver --help >/dev/null && \
echo "darwinian-evolver: OK"
```

## 参考

- [Imbue 研究文章](https://imbue.com/research/2026-02-27-darwinian-evolver/)
- [ARC-AGI-2 结果](https://imbue.com/research/2026-02-27-arc-agi-2-evolution/)
- [imbue-ai/darwinian_evolver](https://github.com/imbue-ai/darwinian_evolver) (AGPL-3.0)
- [Darwin Gödel Machines](https://arxiv.org/abs/2505.22954)
- [PromptBreeder](https://arxiv.org/abs/2309.16797)