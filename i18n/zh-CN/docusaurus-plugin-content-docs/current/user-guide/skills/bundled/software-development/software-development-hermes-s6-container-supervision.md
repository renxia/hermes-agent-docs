---
title: "赫尔墨斯 S6 容器监督"
sidebar_label: "赫尔墨斯 S6 容器监督"
description: "修改、调试或扩展赫尔墨斯智能体 Docker 镜像内的 s6-overlay 监督树 —— 添加新服务、调试配置文件网关、理解架构 B 主程序模式..."
---

{/* 此页面由网站脚本 `scripts/generate-skill-docs.py` 根据技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# 赫尔墨斯 S6 容器监督

修改、调试或扩展赫尔墨斯智能体 Docker 镜像内的 s6-overlay 监督树 —— 添加新服务、调试配置文件网关、理解架构 B 主程序模式。

## 技能元数据

| | |
|---|---|
| 来源 | 内置（默认安装） |
| 路径 | `skills/software-development/hermes-s6-container-supervision` |
| 版本 | `1.0.0` |
| 作者 | 赫尔墨斯智能体 |
| 许可证 | MIT |
| 标签 | `docker`, `s6`, `监督`, `网关`, `配置文件` |
| 相关技能 | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent), `hermes-agent-dev` |

:::info
以下是触发此技能时 Hermes 加载的完整技能定义。这是技能激活时智能体看到的指令。
:::

# Hermes s6-overlay 容器监管

## 何时使用此技能

当您正在处理以下工作时加载此技能：
- 在 Hermes Docker 镜像中添加或移除一个静态服务（应在每次容器启动时进行监管的内容，如仪表盘）
- 诊断按配置文件的网关为何未启动、重启或在 `docker restart` 后存活
- 理解容器的 CMD 为何是 `/opt/hermes/docker/main-wrapper.sh` 以及前导短划线参数如何到达用户程序
- 修改 `cont-init.d` 启动脚本（UID 重映射、卷初始化、配置文件协调）
- 更改按配置文件网关的渲染运行脚本（第 4 阶段）

如果您只是运行 Hermes 智能体并想使用 Docker，请参阅 `website/docs/user-guide/docker.md`。

## 架构概览

<!-- ascii-guard-ignore -->
```
/init                                  ← PID 1 (s6-overlay v3.2.3.0)
├── cont-init.d                        ← 一次性设置，以 root 身份运行
│   ├── 01-hermes-setup                ← docker/stage2-hook.sh
│   │   ├── UID/GID 重映射
│   │   ├── chown /opt/data
│   │   ├── chown /opt/data/profiles (每次启动时)
│   │   ├── 初始化 .env / config.yaml / SOUL.md
│   │   └── skills_sync.py
│   └── 02-reconcile-profiles          ← hermes_cli.container_boot
│       ├── chown /run/service (hermes-writable 用于运行时注册)
│       └── 遍历 $HERMES_HOME/profiles/<name>/gateway_state.json
│           → 重建 /run/service/gateway-<name>/
│           → 仅自动启动 prior_state == "running" 的网关
│
├── s6-rc.d (静态服务，位于 /etc/s6-overlay/s6-rc.d/)
│   ├── main-hermes/run                ← exec sleep infinity (空操作插槽)
│   └── dashboard/run                  ← 若 HERMES_DASHBOARD=1，则运行 `hermes dashboard`
│
├── /run/service (s6-svscan 监控；tmpfs)
│   ├── gateway-coder/                 ← 运行时注册的按配置文件网关
│   │   ├── type        ("longrun")
│   │   ├── run         ("#!/command/with-contenv sh ... exec s6-setuidgid hermes hermes -p coder gateway run")
│   │   ├── down        (标记文件 — 存在表示“已注册但不自动启动”)
│   │   └── log/run     (s6-log → $HERMES_HOME/logs/gateways/coder/current)
│   └── ...
│
└── CMD ("主程序")               ← /opt/hermes/docker/main-wrapper.sh
    └── 路由用户参数：裸执行 | hermes 子命令 | hermes (无参数)
        — 由 /init 执行，继承 stdin/stdout/stderr (TTY 用于 --tui)
```
<!-- ascii-guard-ignore-end -->

## 关键文件

| 路径 | 作用 |
|---|---|
| `Dockerfile` | s6-overlay 安装 + cont-init.d 连接 + `ENTRYPOINT ["/init", "/opt/hermes/docker/main-wrapper.sh"]` |
| `docker/stage2-hook.sh` | “旧的入口点逻辑” — UID 重映射，chown，初始化，技能同步。作为 cont-init.d/01-hermes-setup 运行。 |
| `docker/cont-init.d/02-reconcile-profiles` | 在每次启动时调用 `hermes_cli.container_boot` 以从持久卷恢复配置文件网关插槽。 |
| `docker/main-wrapper.sh` | 容器的 CMD。路由用户参数，通过 `s6-setuidgid` 切换到 hermes，exec 选择的程序。 |
| `docker/s6-rc.d/main-hermes/run` | 空操作 `sleep infinity` — 插槽存在是为了使 s6-rc 用户捆绑包有效；主 hermes 作为 CMD 运行，而非作为受监管的服务。 |
| `docker/s6-rc.d/dashboard/run` | 条件服务 — 除非 `HERMES_DASHBOARD` 为真值，否则 `exec sleep infinity`。 |
| `docker/entrypoint.sh` | 向后兼容的垫片，用于 `exec` stage2 钩子。硬编码旧入口点路径的外部脚本仍可工作。 |
| `hermes_cli/service_manager.py` | `S6ServiceManager`: `register_profile_gateway`, `unregister_profile_gateway`, `start/stop/restart/is_running`, `list_profile_gateways`。 |
| `hermes_cli/container_boot.py` | `reconcile_profile_gateways()` — 遍历持久配置文件，重建 s6 插槽，输出 `container-boot.log`。 |
| `hermes_cli/gateway.py::_dispatch_via_service_manager_if_s6` | 当在容器中运行时，拦截 `hermes gateway start/stop/restart` 并路由到 s6。 |

## 为什么采用架构 B（CMD 作为主程序，而非 s6 监管）

最初的计划（v1-v3）要求主 hermes 作为受监管的 s6-rc 服务运行。两个真实的 s6-overlay v3 机制阻止了这一点：

1.  **cont-init.d 脚本不接收 CMD 参数** — 因此 stage2 钩子无法解析 `docker run <image> chat -q "hi"` 来设置 `HERMES_ARGS` 供服务 `run` 脚本使用。
2.  **`/run/s6/basedir/bin/halt` 不会传播写入 `/run/s6-linux-init-container-results/exitcode` 的退出码**。容器无论输入什么退出码，总是以 143 (SIGTERM) 退出。由 skarnet (s6 作者) 在 [issue #477](https://github.com/just-containers/s6-overlay/issues/477) 中确认：*“如果你想要容器关闭，你需要让你的 CMD 退出，或者，如果你没有 CMD，就写入你想要的容器退出码然后调用 halt”*。

因此我们使用 s6-overlay 原生的 CMD 模式：`ENTRYPOINT ["/init", "/opt/hermes/docker/main-wrapper.sh"]`。/init 会自动将包装器前置到用户参数 — 因此 `docker run <image> --version` 变成 `/init main-wrapper.sh --version`，并且 `--version` 不会被 /init 的 POSIX shell 拦截。包装器通过 `s6-setuidgid` 切换到 hermes，然后 exec 选择的程序。程序的退出码成为容器的退出码，完全匹配 pre-s6 tini 契约。

权衡：主 hermes 在 s6 下是不受监管的。这恰好匹配了它在 tini（pre-s6 镜像）下的行为。仪表盘监管是唯一的**新**保证 — 位于 `/run/service/` 下的按配置文件网关则获得完整的监管。

## 快速指南

### 验证正在运行的容器中 s6 是否为 PID 1

```sh
docker exec <c> sh -c 'cat /proc/1/comm; readlink /proc/1/exe'
# 期望：s6-svscan 或 init / /package/admin/s6/.../s6-svscan
```

### 检查一个配置文件网关服务

```sh
# /command/ 不在 docker-exec 的 PATH 上 — 使用绝对路径
docker exec <c> /command/s6-svstat /run/service/gateway-<name>
# "up (pid …) … seconds"            → 正在运行
# "down (exitcode N) … seconds, normally up, want up, …" → s6 希望它启动，但进程持续退出（崩溃循环）
# "down … normally up, ready …"     → 用户已停止它
```

### 手动启动/停止服务

```sh
docker exec <c> /command/s6-svc -u /run/service/gateway-<name>   # 启动
docker exec <c> /command/s6-svc -d /run/service/gateway-<name>   # 停止
docker exec <c> /command/s6-svc -t /run/service/gateway-<name>   # 发送 SIGTERM (重启)
```

### 查看 cont-init 协调器日志

```sh
docker exec <c> tail -n 50 /opt/data/logs/container-boot.log
# 2026-05-21T06:18:05+0000 profile=coder prior_state=running action=started
# 2026-05-21T06:18:05+0000 profile=writer prior_state=stopped action=registered
```

### 添加一个新的静态服务

1.  创建 `docker/s6-rc.d/<name>/type`，内容为 `longrun\n`，以及 `docker/s6-rc.d/<name>/run`（使用 `#!/command/with-contenv sh` + `# shellcheck shell=sh`）。
2.  在 run 脚本顶部通过 `s6-setuidgid hermes` 切换到 hermes（除非您特别需要 root 权限）。
3.  创建空的 `docker/s6-rc.d/<name>/dependencies.d/base`，以便它等待 base 捆绑包。
4.  创建空的 `docker/s6-rc.d/user/contents.d/<name>`，以便它加入用户捆绑包。
5.  Dockerfile 中的 `COPY docker/s6-rc.d/` 会自动拾取它 — 无需其他更改。

### 更改按配置文件网关的运行命令

编辑 `hermes_cli/service_manager.py` 中的 `S6ServiceManager._render_run_script` 函数。该函数在启动协调期间也会被 `hermes_cli/container_boot.py::_register_service` 调用，因此它是唯一的事实来源。更新 `tests/hermes_cli/test_service_manager.py::test_s6_register_creates_service_dir_and_triggers_scan` 中相应的断言。

### 运行 docker 测试套件

```sh
docker build -t hermes-agent-harness:latest .
HERMES_TEST_IMAGE=hermes-agent-harness:latest scripts/run_tests.sh tests/docker/ -v
# 期望 19 通过，0 个针对 s6 镜像的预期失败
```

测试套件位于 `tests/docker/`，当 Docker 不可用时会跳过。每个测试的超时时间被提高到 180 秒（参见 `tests/docker/conftest.py`）。

## 常见陷阱

### 通过 `docker exec` 报错 "command not found"

`/command/`（s6-overlay 放置其二进制文件的地方）仅在监管树生成的进程（服务、cont-init.d、main-wrapper.sh）的 PATH 上。`docker exec <c> s6-svstat …` 将失败并显示 "command not found"；始终使用绝对路径 `/command/s6-svstat`。`hermes` 二进制文件之所以可用，是因为 Dockerfile 将 `/opt/hermes/.venv/bin` 添加到了运行时的 `ENV PATH`。

### 配置文件目录的所有权

cont-init 协调器以 hermes 身份运行（在 `02-reconcile-profiles` 中通过 `s6-setuidgid hermes`）。如果一个配置文件目录最终被 root 所有（例如，因为 `docker exec <c> hermes profile create …` 默认以 root 身份运行），协调器将无法读取 SOUL.md 并失败，报 `PermissionError`。缓解措施：`stage2-hook.sh` 在**每次**启动时都将 `$HERMES_HOME/profiles` 递归地 chown 给 hermes。不要移除该代码块。

### `docker exec` 写入的文件由 root 所有

`docker exec` 默认以 root 身份运行。要么传递 `--user hermes`，要么依赖下次重启时的 stage2 chown 清理。不要手动以 root 身份在 `$HERMES_HOME/profiles/<name>/` 下写入文件 — 下一次协调过程会清理它们，但进行中的操作可能会遇到权限错误。

### 服务插槽存在但 s6-svstat 显示 "s6-supervise not running"

服务目录位于 tmpfs 上，并在容器重启时被清除。要么 cont-init 协调器尚未运行（在 `docker restart` 后等一会儿），要么它失败了。检查 `docker logs <c> | grep '02-reconcile'`。

### 网关启动后立即退出（svstat 中显示 `down (exitcode 1)`）

很可能该配置文件没有配置模型或认证。服务插槽是正确的 — 网关本身未配置。请先运行 `hermes -p <profile> setup`。s6 监管器将持续重启它；这是期望的行为（当您修复配置后，下一次尝试将成功并保持运行）。

### 协调器跳过了一个配置文件

协调器以**存在 `SOUL.md`** 作为“真实配置文件”的标记。`hermes profile create` 总是会初始化它。如果一个配置文件目录缺少 SOUL.md（杂散目录、部分恢复、备份中），协调器会故意跳过它。添加一个 `SOUL.md`（即使是空的）以重新加入。

### “救命，容器退出码是 143！”

检查是否有东西调用了 `s6-svscanctl -t` 或 `/run/s6/basedir/bin/halt` — 两者都会导致 /init 开始第 3 阶段关闭，但返回 143 (SIGTERM) 而非期望的退出码。这是第 2 阶段架构从 A 到 B 的转变。要以真实退出码关闭容器，您必须让 CMD (main-wrapper.sh) 正常退出；**不要**尝试从 finish 脚本控制退出。

## 相关技能

- `hermes-agent-dev`：通用 hermes-agent 代码库导航
- `hermes-tool-quirks`：Hermes 工具的具体解决方法（sed/grep 等）——在调试 s6 栈与 hermes 内置工具的交互问题时加载。