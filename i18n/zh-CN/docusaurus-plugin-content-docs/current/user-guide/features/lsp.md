---
sidebar_position: 16
title: "LSP — 语义诊断"
description: "真实的语言服务器（pyright、gopls、rust-analyzer 等）已集成到 write_file 和 patch 使用的写入后语法检查流程中。"
---

# 语言服务器协议 (LSP)

Hermes 将完整的语言服务器 — pyright、gopls、rust-analyzer、typescript-language-server、clangd 以及约 20 多种其他服务器 — 作为后台子进程运行，并将其语义诊断信息输入到 `write_file` 和 `patch` 使用的写入后语法检查中。当智能体编辑文件时，它能准确看到该编辑引入的错误 — 不仅仅是语法错误，还包括语言服务器检测到的**类型错误、未定义的名称、缺失的导入以及项目范围的语义问题**。

这与顶级编码智能体使用的架构相同。Hermes 将其完整集成：无需编辑器宿主，无需安装插件，无需管理独立的守护进程。

## LSP 运行时机

LSP 的启用取决于 **git 工作区检测**。当智能体的工作目录（或正在编辑的文件）位于 git 仓库内时，LSP 会针对该工作区运行。当两者都不在 git 仓库中时，LSP 将保持休眠 — 这对于消息网关等场景很有用，因为其当前工作目录是用户主目录且没有可诊断的项目。

检查是分层的：首先进行进程内语法检查（微秒级），当语法无误时再运行 LSP 诊断。不稳定或缺失的语言服务器绝不会中断写入操作 — 每个 LSP 故障路径都会静默回退到仅语法检查的结果。

具体来说，每次成功的 `write_file` 或 `patch` 操作后：

1.  Hermes 会捕获该文件当前诊断信息的基线。
2.  执行写入。
3.  重新查询语言服务器，过滤掉基线中已存在的诊断信息，并仅显示新增的部分。

智能体看到的输出类似于：

```json
{
  "bytes_written": 42,
  "dirs_created": false,
  "lint": {"status": "ok", "output": ""},
  "lsp_diagnostics": "本次编辑引入的 LSP 诊断信息：\n<diagnostics file=\"/path/to/foo.py\">\n错误 [42:5] 无法找到名称 'foo' [reportUndefinedVariable] (Pyright)\n错误 [50:1] 类型为 \"str\" 的参数无法赋值给 \"int\" [reportArgumentType] (Pyright)\n</diagnostics>"
}
```

`lint` 字段承载语法检查结果（通过 `ast.parse`、`json.loads` 等进行的微秒级进程内解析）；`lsp_diagnostics` 字段承载来自真实语言服务器的语义诊断信息。两个通道，独立的信号 — 智能体看到的是语法干净但存在语义问题的文件，表现为 `lint: ok` 加上非空的 `lsp_diagnostics`。

## 支持的语言

| 语言 | 服务器 | 自动安装方式 |
|------|--------|--------------|
| Python | `pyright-langserver` | npm |
| TypeScript / JavaScript / JSX / TSX | `typescript-language-server` | npm |
| Vue | `@vue/language-server` | npm |
| Svelte | `svelte-language-server` | npm |
| Astro | `@astrojs/language-server` | npm |
| Go | `gopls` | `go install` |
| Rust | `rust-analyzer` | 手动 (rustup) |
| C / C++ | `clangd` | 手动 (LLVM) |
| Bash / Zsh | `bash-language-server` | npm |
| YAML | `yaml-language-server` | npm |
| Lua | `lua-language-server` | 手动 (GitHub releases) |
| PHP | `intelephense` | npm |
| OCaml | `ocaml-lsp` | 手动 (opam) |
| Dockerfile | `dockerfile-language-server-nodejs` | npm |
| Terraform | `terraform-ls` | 手动 |
| Dart | `dart language-server` | 手动 (dart sdk) |
| Haskell | `haskell-language-server` | 手动 (ghcup) |
| Julia | `julia` + LanguageServer.jl | 手动 |
| Clojure | `clojure-lsp` | 手动 |
| Nix | `nixd` | 手动 |
| Zig | `zls` | 手动 |
| Gleam | `gleam lsp` | 手动 (gleam install) |
| Elixir | `elixir-ls` | 手动 |
| Prisma | `prisma language-server` | 手动 |
| Kotlin | `kotlin-language-server` | 手动 |
| Java | `jdtls` | 手动 |

对于标记为“手动”的条目，请通过适用于该语言的相应工具链管理器（如 rustup、ghcup、opam、brew 等）安装服务器。Hermes 会自动检测 PATH 或 `<HERMES_HOME>/lsp/bin/` 目录中的二进制文件。

少数服务器在安装时会附带 npm 不会自动拉取的对等依赖项。当前的情况是 `typescript-language-server`，它需要 `typescript` SDK 可以从同一 `node_modules` 树中导入 — 当您运行 `hermes lsp install typescript` 或首次使用自动安装触发时，Hermes 会同时安装这两个包。

## 命令行接口 (CLI)

```
hermes lsp status          # 服务状态及每个服务器的安装状态
hermes lsp list            # 注册表，可选 --installed-only
hermes lsp install <id>    # 立即安装一个服务器
hermes lsp install-all     # 尝试所有已知配方的服务器
hermes lsp restart         # 终止正在运行的客户端
hermes lsp which <id>      # 打印解析后的二进制路径
```

`hermes lsp status` 是最佳的起点 — 它显示了今天哪些语言将获得语义诊断，以及哪些需要安装二进制文件。

## 配置

默认设置适用于典型配置；如果二进制文件已在 PATH 上，则无需任何设置。

```yaml
# config.yaml
lsp:
  # 主开关。禁用后将跳过整个子系统 — 不会启动服务器，也不会运行后台事件循环。
  enabled: true

  # 每次写入后等待诊断结果的时间。
  wait_mode: document      # "document" 或 "full"
  wait_timeout: 5.0

  # 如何处理缺失的服务器二进制文件。
  #   auto   — 通过 npm/pip/go install 安装到 <HERMES_HOME>/lsp/bin
  #   manual — 仅使用已在 PATH 上的二进制文件
  install_strategy: auto

  # 每个服务器的覆盖配置（均为可选）。
  servers:
    pyright:
      disabled: false
      command: ["/abs/path/to/pyright-langserver", "--stdio"]
      env: { PYRIGHT_LOG_LEVEL: "info" }
      initialization_options:
        python:
          analysis:
            typeCheckingMode: "strict"
    typescript:
      disabled: true       # 即使扩展名匹配也跳过 TypeScript
```

### 每个服务器的键

*   `disabled: true` — 即使扩展名匹配，也完全跳过此服务器。
*   `command: [bin, ...args]` — 指定自定义二进制路径。绕过自动安装。
*   `env: {KEY: value}` — 传递给衍生进程的额外环境变量。
*   `initialization_options: {...}` — 合并到 `initialize` 握手期间发送的 LSP `initializationOptions` 载荷中。特定于服务器；请查阅语言服务器的文档。

## 安装位置

当 `install_strategy: auto` 时，Hermes 将二进制文件安装到 `<HERMES_HOME>/lsp/bin/`。NPM 包位于 `<HERMES_HOME>/lsp/node_modules/`，其 bin 链接位于上一级目录。Go 二进制文件来自 `go install`，并将 `GOBIN` 指向暂存目录。

没有任何内容会安装到 `/usr/local/`、`~/.local/` 或任何其他共享位置 — 暂存目录完全由 Hermes 管理，当您重置配置文件时会被移除。

## 性能特点

LSP 服务器是**惰性启动**的，首次使用时才会启动。在一个从未处理过 `.py` 文件的项目中编辑 Python 文件会启动 pyright；对于大多数服务器来说，启动需要 1-3 秒（rust-analyzer 在冷启动项目上可能需要 10 秒以上）。在同一工作区中的后续编辑将重用正在运行的服务器。

当没有发出诊断信息时，LSP 层会为干净的写入增加几毫秒的开销。当发出诊断信息时，等待时间预算是 `wait_timeout` 秒 — 通常，pyright/tsserver 的响应时间在几十毫秒，而 rust-analyzer 在索引中期可能需要几秒钟。

服务器在 Hermes 进程的整个生命周期内保持活跃。没有空闲超时清除器 — 在每次写入时重新启动服务器的索引成本远高于保持守护进程运行。

## 禁用

在 `config.yaml` 中设置 `lsp.enabled: false` 可以禁用整个子系统。写入后检查将回退到进程内语法检查（Python 使用 `ast.parse`，JSON 使用 `json.loads` 等），这与早期版本的实现方式相同。

要在不禁用整个层的情况下禁用单个语言：

```yaml
lsp:
  servers:
    rust-analyzer:
      disabled: true
```

## 故障排除

**`hermes lsp status` 显示服务器为 "missing"（缺失）**

二进制文件不在 PATH 上，也不在 `<HERMES_HOME>/lsp/bin/` 中。运行 `hermes lsp install <server_id>` 尝试自动安装，或通过该语言的正常工具链手动安装二进制文件。

**`hermes lsp status` 中的 `Backend warnings`（后端警告）部分**

某些服务器是围绕外部 CLI 的薄包装，用于进行实际诊断 — 它们能正常启动并接受请求，但当伴随的二进制文件缺失时永远不会发出错误。最常见的情况是 `bash-language-server`，它将诊断委托给 `shellcheck`。当 `hermes lsp status` 显示 `Backend warnings` 部分时，请通过您的操作系统包管理器安装所命名的工具：

```
apt install shellcheck      # Debian / Ubuntu
brew install shellcheck     # macOS
scoop install shellcheck    # Windows
```

在服务器启动时，相同的警告会在 `~/.hermes/logs/agent.log` 中记录一次。

**服务器启动但从不返回诊断信息**

检查 `~/.hermes/logs/agent.log` 中的 `[agent.lsp.client]` 条目 — 来自语言服务器的 stderr 和协议错误都会记录在那里。某些服务器（尤其是 rust-analyzer）需要在发出每文件诊断信息之前完成项目范围的索引；服务器启动后的第一次编辑可能在没有诊断信息的情况下完成，后续编辑才会检测到它们。

**服务器崩溃**

崩溃的服务器会被添加到故障集中，并且在会话的其余部分不会被重试。运行 `hermes lsp restart` 以清除该集合；下一次编辑将重新启动服务器。

**编辑任何 git 仓库之外的文件**

根据设计，LSP 仅在 git 仓库内部运行。如果项目尚未初始化，请运行 `git init` 以启用 LSP 诊断。否则，将应用仅语法的进程内回退。