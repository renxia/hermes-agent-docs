---
title: "简化代码 — 对近期代码更改进行并行 3 个智能体的清理"
sidebar_label: "简化代码"
description: "对近期代码更改进行并行 3 个智能体的清理"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# 简化代码

对近期代码更改进行并行 3 个智能体的清理。

## Skill metadata

| | |
|---|---|
| Source | Bundled (installed by default) |
| Path | `skills/software-development/simplify-code` |
| Version | `1.0.0` |
| Author | Hermes 智能体 (受 Claude Code /simplify 的启发) |
| License | MIT |
| Platforms | linux, macos, windows |
| Tags | `code-review`, `cleanup`, `refactor`, `delegation`, `子智能体`, `parallel`, `simplify` |
| Related skills | [`requesting-code-review`](/docs/user-guide/skills/bundled/software-development/software-development-requesting-code-review), [`test-driven-development`](/docs/user-guide/skills/bundled/software-development/software-development-test-driven-development), [`plan`](/docs/user-guide/skills/bundled/software-development/software-development-plan) |

## Reference: full SKILL.md

:::info
以下是 Hermes 在此技能被触发时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# 简化代码 — 并行审查与清理

使用三个专注的审查者并行地审查您的近期代码更改，汇总他们的发现，并应用值得应用的修复。

**核心原则：** 三个狭窄的审查者胜过一个宽泛的审查者。每个智能体都深入搜索代码库中的某一类问题——重用、质量、效率——而不会将注意力分散到所有三个上。它们是并发运行的，因此您只需支付一次审查的延迟，而不是三次。

## 何时使用

当用户说以下任一句话时，请触发此技能：

- "simplify" / "simplify my changes" / "simplify these changes"
- "review my code" / "review my recent changes" / "clean up my changes"
- "/simplify" (如果他们沿用了 Claude Code 的习惯)

用户可能添加的可选修饰语——请予以尊重：

- **焦点（Focus）：** "simplify focus on efficiency" → 只运行效率智能体
  (或将聚合重点放在它上面)。可识别的焦点包括：`reuse`、`quality`、`efficiency`。
- **干运行（Dry run）：** "simplify but don't change anything" / "just report" → 运行三个审查者，展示发现，但什么都不应用。先询问是否应用。
- **范围（Scope）：** "simplify the last commit" / "simplify staged" / "simplify src/foo.py" → 相应地缩小 diff 的来源 (参见第一阶段)。

不要在每次编辑后自动运行此技能。它需要消耗相当于三个子智能体的代币（tokens）——仅当用户明确要求时才调用。

## 流程

### 第一阶段 — 识别更改

捕获用于审查的 diff。根据用户的请求，按照以下默认顺序选择源文件：

```bash
# 1. 默认：未提交的工作树更改 (已跟踪的文件)
git diff

# 2. 如果上一步为空，则包括暂存的更改
git diff HEAD

# 3. 用户可能要求的范围限定变体：
git diff --staged                 # "暂存的更改"
git diff HEAD~1                    # "上次提交"
git diff main...HEAD              # "此分支" / "我的 PR"
git diff -- src/foo.py            # 特定文件(们)
```

如果 `git diff` 和 `git diff HEAD` 都为空，且没有 git 仓库或没有更改，则回退到用户明确命名的文件或本会话中最近创建/编辑的文件。如果你确实找不到任何更改的代码，请说明并停止——没有什么需要简化。

捕获完整的 diff 文本。注意其大小：如果它非常大（例如 >2000 行更改），请警告用户，三个子智能体都承载着完整的 diff 会消耗大量的代币，并提供缩小范围的选项（按目录、按提交）。

### 第二阶段 — 并行启动三个审查者

使用 `delegate_task` **批量模式**——将所有三个任务放入一个 `tasks` 数组中，使它们并发运行。三是这种模式正确的扇出（fan-out）；这在任何默认安装的 `delegation.max_concurrent_children` 预算内。

给**每个**审查者提供**完整的 diff** (而不是片段——跨文件的问题隐藏在空白处)，以及绝对的仓库路径，以便它们可以搜索更广阔的代码库。每个智能体都获得了 `terminal`、`file` 和 `search` 工具集（因此它们可以执行 `git`、`read_file` 和 `search_files`/grep）。

指示每个审查者：
- 搜索现有代码库以寻找证据 (不要仅凭 diff 进行推理)。
- **应用切斯特顿的栅栏 (Chesterton's Fence)：** 在标记任何需要删除的内容之前，对该行运行 `git blame` 以了解它存在的原因。如果你无法确定其原始目的，则将其标记为 `confidence: low`——不要猜测。
- 以包含置信度和风险的结构化输出报告发现：
  ```
  file:line → problem → suggested fix | confidence: high/medium/low | risk: SAFE/CAREFUL/RISKY
  ```
  - **SAFE** = 已证明不会影响行为（未使用的导入、注释掉的代码、直通包装器）。自动应用这些。
  - **CAREFUL** = 改进了但没有改变语义（重命名局部变量、扁平嵌套三元表达式、提取辅助函数）。需经过测试验证后应用。
  - **RISKY** = 可能改变行为或破坏公共契约 (N+1 重构、公共 API 重命名、内存生命周期更改)。标记进行人工审查——不要自动应用。
- 跳过次要（nits）和仅风格的改动。只标记那些实质性地改进代码的内容。

传递这三个目标（丢弃用户焦点排除的部分）：

**审查者 1 — 代码重用 (Code Reuse)**
> 审查此 diff，查找重复功能于现有代码库中的代码。搜索工具模块、共享辅助函数和相邻文件 (使用 search_files / grep)，看新代码是否可以调用现有的函数、常量或模式，而不是重新实现。标记：重复现有功能的新函数；手动实现的逻辑（手动字符串/路径操作、自定义环境检查、临时类型守卫、重新实现的解析）。对于每一项，请命名要使用的现有内容及其位置。

**审查者 2 — 代码质量 (Code Quality)**
> 审查此 diff 中的质量问题。查找：冗余状态（可以从现有状态推导或重复的值；不需要存在的缓存）；参数蔓延（功能本应被重构但却添加了新参数）；带变体的复制粘贴（应该共享抽象的近乎重复的代码块）；泄漏的抽象 (exposing internals, 破坏现有的封装边界)；字符串类型代码 (stringly-typed code，即在现有常量/枚举/注册表存在的情况下仍使用原始字符串——先检查规范的注册表再标记)；AI 生成的草稿模式（例如 `count++` 上方的 `// increment counter` 等重述显而易见的代码注释；对已验证输入的不必要的防御性空值检查；绕过类型系统的 `as any` 强制转换；与文件其余部分不一致的模式）。对于每一项，提供具体的重构方案。

**审查者 3 — 效率 (Efficiency)**
> 审查此 diff 中的效率问题。查找：不必要的开销（冗余计算、重复的文件读取、重复的 API 调用、N+1 访问模式）；错过的并发性（独立操作按顺序执行）；热路径膨胀（启动时或每次请求都存在的重型/阻塞工作）；TOCTOU 反模式（在操作之前进行存在检查，而不是执行操作并处理错误）；内存问题（无界增长、缺少清理、监听器/句柄泄漏）；过于宽泛的读取（本可以切片但却加载了整个文件）；静默失败（空的 catch 块、忽略的错误返回值、`except: pass`、没有处理的 `.catch(() => {})`，错误传播差距——这些会隐藏 Bug，至少应该先记录下来再吞掉）。对于每一项，提供具体的修复方案以及为什么它更快或更安全。

### 第三阶段 — 聚合与应用

等待所有三个审查者返回（批量模式会将它们一起返回）。

1. **合并**发现，将它们放入一个列表中，并消除审查者重叠的部分。
2. **丢弃误报**——您拥有最多的上下文；不必和审查者争论，只需静默地删除弱或错误的建议。
3. **解决冲突。** 审查者可能会意见不合（审查者 1：“使用现有工具 X”；审查者 3：“X 很慢，内联它”）。默认的解决顺序是：
   **正确性 > 用户声明的焦点 > 可读性/重用性 > 微性能。** 不要应用会损害清晰度的性能“修复”，除非该路径确实是热点。当两个建议互斥且都可辩护时，选择修改代码量最少的那个，并记录下另一个替代方案。
4. **按风险等级进行应用：**
   - **SAFE (先自动应用)：** 未使用的导入、注释掉的代码、直通包装器、冗余的类型断言。运行测试后再。
   - **CAREFUL (其次，逐文件进行验证后应用)：** 重命名局部变量、扁平三元表达式、提取辅助函数、合并重复项。对每个文件都运行测试。如果任何一个失败了，则回滚该修复。
   - **RISKY (最后，标记进行审查——不要自动应用)：** N+1 重构、公共 API 更改、并发性修复、错误处理更改。附上风险描述和测试覆盖状态来展示每一项。
   如果用户选择了干运行，则展示所有三个等级的内容，但不应用任何内容。
5. **验证**您是否破坏了任何东西：运行项目针对受影响文件的目标测试（而不是完整的套件），并重新运行仓库使用的任何 linter/类型检查器。如果一个修复破坏了测试，请回滚该修复并报告它。
6. **总结**所做的更改：一份简短的已应用修复列表，按审查者类别和风险等级分组，以及您故意跳过的所有发现及其原因。

## 潜在陷阱 (Pitfalls)

- **不要过度扩展到超过约 3 个。** 更多的审查者意味着更高的成本和需要协调更多的冲突建议，而不是更好的覆盖范围。这三个类别已经涵盖了所需空间。
- **给每个审查者提供完整的 diff。** 将 diff 分割到不同的审查者身上会违背设计——跨文件的重复和 N+1 只在拥有完整图景时才会显现。
- **审查者进行搜索，而不是猜测。** 一个没有指向现有工具的重用发现（“可能有一个辅助函数”）是噪音。要求提供 `file:line` 证据；缺乏证据的发现应被丢弃。
- **应用 ≠ 重写。** 这是对用户近期更改的清理，而不是许可去重构整个模块。将编辑范围限制在 diff 所触及的部分以及修复所需的最小周围更改内。
- **尊重项目约定。** 如果仓库中有 AGENTS.md / CLAUDE.md / HERMES.md 或 linter 配置，请将这些规则融入到审查者提示中，以确保建议符合内部风格而不是与之对抗。
- **大 diff 会冲垮上下文。** 如果 diff 非常大，请在委托之前缩小范围——三个智能体各承载一个 5000 行的 diff 是昂贵的，并且可能会被截断。
- **过度信任死代码工具。** `knip`、`ts-prune` 和 `depcheck` 会标记那些被动态使用的导出（基于字符串的导入、反射）。在删除之前务必进行 grep 搜索符号名称——一个干净的工具报告并非证明。
- **重命名时未检查公共契约。** 导出的名称、API 路由路径、数据库列名和配置键都是契约——即使名称不好，重命名也会破坏消费者。将公共契约更改标记为 RISKY；绝不要自动重命名它们。
- **移除“不必要的”错误处理。** 一个空的 catch 块或被忽略的错误可能是故意的——这个错误是预期的且良性的。请标记它，而不是移除它；让人工来决定。

## 相关 (Related)

如果您的安装包含 `subagent-driven-development` 技能（可选），它则涵盖了互补的情况：在实现过程中、针对每个任务进行并行审查。此技能是独立执行的“事后清理”过程。对于提交前的安全/质量门控，请使用 `requesting-code-review`。