---
title: "Jupyter 实时内核 — 通过 hamelnb 使用实时 Jupyter 内核进行有状态的迭代式 Python 执行"
sidebar_label: "Jupyter 实时内核"
description: "通过 hamelnb 使用实时 Jupyter 内核进行有状态的迭代式 Python 执行"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Jupyter 实时内核

通过 hamelnb 使用实时 Jupyter 内核进行有状态的迭代式 Python 执行。当任务涉及探索、迭代或检查中间结果时（例如数据科学、机器学习实验、API 探索或逐步构建复杂代码），请加载此技能。使用终端对实时 Jupyter 内核运行 CLI 命令。无需新工具。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/data-science/jupyter-live-kernel` |
| 版本 | `1.0.0` |
| 作者 | Hermes 智能体 |
| 许可证 | MIT |
| 标签 | `jupyter`, `notebook`, `repl`, `data-science`, `exploration`, `iterative` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Jupyter 实时内核 (hamelnb)

通过实时 Jupyter 内核为您提供**有状态的 Python REPL**。变量在执行之间保持持久化。当您需逐步构建状态、探索 API、检查 DataFrame 或迭代复杂代码时，请使用此技能而非 `execute_code`。

## 何时使用此技能 vs 其他工具

| 工具 | 使用场景 |
|------|----------|
| **此技能** | 迭代式探索、跨步骤保持状态、数据科学、机器学习、“让我试试这个并检查一下” |
| `execute_code` | 需要 hermes 工具访问权限（web_search、文件操作）的一次性脚本。无状态。 |
| `terminal` | Shell 命令、构建、安装、git、进程管理 |

**经验法则：** 如果任务适合使用 Jupyter 笔记本，则使用此技能。

## 先决条件

1. 必须安装 **uv**（检查：`which uv`）
2. 必须安装 **JupyterLab**：`uv tool install jupyterlab`
3. 必须运行 Jupyter 服务器（参见下方“设置”）

## 设置

hamelnb 脚本位置：
```
SCRIPT="$HOME/.agent-skills/hamelnb/skills/jupyter-live-kernel/scripts/jupyter_live_kernel.py"
```

如果尚未克隆：
```
git clone https://github.com/hamelsmu/hamelnb.git ~/.agent-skills/hamelnb
```

### 启动 JupyterLab

检查是否已有服务器在运行：
```
uv run "$SCRIPT" servers
```

如果未找到服务器，请启动一个：
```
jupyter-lab --no-browser --port=8888 --notebook-dir=$HOME/notebooks \
  --IdentityProvider.token='' --ServerApp.password='' > /tmp/jupyter.log 2>&1 &
sleep 3
```

注意：为本地智能体访问禁用了令牌/密码。服务器以无头模式运行。

### 创建用于 REPL 的笔记本

如果您只需要一个 REPL（无现有笔记本），请创建一个最小化的笔记本文件：
```
mkdir -p ~/notebooks
```
编写一个包含一个空代码单元格的最小化 .ipynb JSON 文件，然后通过 Jupyter REST API 启动内核会话：
```
curl -s -X POST http://127.0.0.1:8888/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"path":"scratch.ipynb","type":"notebook","name":"scratch.ipynb","kernel":{"name":"python3"}}'
```

## 核心工作流

所有命令均返回结构化的 JSON。始终使用 `--compact` 以节省令牌。

### 1. 发现服务器和笔记本

```
uv run "$SCRIPT" servers --compact
uv run "$SCRIPT" notebooks --compact
```

### 2. 执行代码（主要操作）

```
uv run "$SCRIPT" execute --path <notebook.ipynb> --code '<python code>' --compact
```

状态在执行调用之间保持持久化。变量、导入、对象均会保留。

多行代码可使用 $'...' 引用：
```
uv run "$SCRIPT" execute --path scratch.ipynb --code $'import os\nfiles = os.listdir(".")\nprint(f"Found {len(files)} files")' --compact
```

### 3. 检查实时变量

```
uv run "$SCRIPT" variables --path <notebook.ipynb> list --compact
uv run "$SCRIPT" variables --path <notebook.ipynb> preview --name <varname> --compact
```

### 4. 编辑笔记本单元格

```
# 查看当前单元格
uv run "$SCRIPT" contents --path <notebook.ipynb> --compact

# 插入新单元格
uv run "$SCRIPT" edit --path <notebook.ipynb> insert \
  --at-index <N> --cell-type code --source '<code>' --compact

# 替换单元格源码（使用 contents 输出中的 cell-id）
uv run "$SCRIPT" edit --path <notebook.ipynb> replace-source \
  --cell-id <id> --source '<new code>' --compact

# 删除单元格
uv run "$SCRIPT" edit --path <notebook.ipynb> delete --cell-id <id> --compact
```

### 5. 验证（重启 + 运行全部）

仅当用户要求干净验证或您需要确认笔记本从头到尾可运行时才使用此命令：

```
uv run "$SCRIPT" restart-run-all --path <notebook.ipynb> --save-outputs --compact
```

## 实践经验提示

1. **服务器启动后的首次执行可能超时** — 内核需要片刻初始化。如果遇到超时，请重试。

2. **内核的 Python 是 JupyterLab 的 Python** — 包必须安装在该环境中。如果您需要额外包，请先将它们安装到 JupyterLab 工具环境中。

3. **--compact 标志可显著节省令牌** — 请始终使用它。不使用该标志时 JSON 输出可能非常冗长。

4. **对于纯 REPL 用途**，请创建 scratch.ipynb 并无需操心单元格编辑。只需重复使用 `execute`。

5. **参数顺序很重要** — 子命令标志（如 `--path`）必须位于子子命令之前。例如：`variables --path nb.ipynb list` 而非 `variables list --path nb.ipynb`。

6. **如果会话尚不存在**，您需要通过 REST API 启动一个（参见“设置”部分）。没有实时内核会话，工具无法执行。

7. **错误以包含 traceback 的 JSON 形式返回** — 请阅读 `ename` 和 `evalue` 字段以了解出错原因。

8. **偶尔的 websocket 超时** — 某些操作在首次尝试时可能超时，尤其是在内核重启后。在升级问题前请重试一次。

## 超时默认值

脚本每次执行默认超时为 30 秒。对于长时间运行的操作，请传递 `--timeout 120`。初始设置或 heavy 计算请使用 generous 超时（60+）。