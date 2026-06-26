---
title: "Hermes S6 Container Supervision"
sidebar_label: "Hermes S6 Container Supervision"
description: "修改、调试或扩展 Hermes 智能体 Docker 镜像内部的 s6-overlay 监督树——添加新服务、调试配置文件网关、理解..."
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Hermes S6 容器监督管理

修改、调试或扩展 Hermes 智能体 Docker 镜像内部的 s6-overlay 监督树——添加新服务、调试配置文件网关、理解架构 B 主程序模式。

## Skill metadata

| | |
|---|---|
| Source | Optional — install with `hermes skills install official/devops/hermes-s6-container-supervision` |
| Path | `optional-skills/devops/hermes-s6-container-supervision` |
| Version | `1.0.0` |
| Author | Hermes 智能体 |
| License | MIT |
| Platforms | linux |
| Tags | `docker`, `s6`, `supervision`, `gateway`, `profiles` |
| Related skills | [`hermes-agent`](/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-hermes-agent), `hermes-agent-dev` |

## 关键路径和配置

```
~/.hermes/config.yaml       主配置文件
~/.hermes/.env              API 密钥和秘密信息（如果设置了 $HERMES_HOME）
$HERMES_HOME
```

# Hermes s6-overlay 容器监督管理

## 何时使用此技能

当您正在处理以下情况时，请加载此技能：
*   在 Hermes Docker 镜像中添加或移除静态服务（例如仪表板，这类需要在每次容器启动时进行监督）。
*   诊断为什么某个配置文件的网关没有启动、重启或能抵御 `docker restart`。
*   了解容器的 CMD 是 `/opt/hermes/docker/main-wrapper.sh` 以及前导破折号参数是如何到达用户程序的。
*   修改 `cont-init.d` 启动脚本（UID 重映射、卷初始化、配置文件协调）。
*   更改针对每个配置文件的网关渲染运行脚本（第四阶段）。

如果您只是在运行 Hermes **智能体** 并想使用 Docker，请参考 `website/docs/user-guide/docker.md`。

## 架构概览

<!-- ascii-guard-ignore -->
```
/init                                  ← PID 1 (s6-overlay v3.2.3.0)
├── cont-init.d                        ← 一次性设置，以 root 身份运行
│   ├── 01-hermes-setup                ← docker/stage2-hook.sh
│   │   ├── UID/GID 重映射
│   │   ├── chown /opt/data
│   │   ├── chown /opt/data/profiles (每次启动)
│   │   ├── seed .env / config.yaml / SOUL.md
│   │   └── skills_sync.py
│   └── 02-reconcile-profiles          ← hermes_cli.container_boot
│       ├── chown /run/service (运行时注册的 hermes 可写权限)
│       └── walk $HERMES_HOME/profiles/<name>/gateway_state.json
│           → recreate /run/service/gateway-<name>/
│           → 仅自动启动 prior_state == "running" 的服务
│
├── s6-rc.d (静态服务，位于 /etc/s6-overlay/s6-rc.d/)
│   ├── main-hermes/run                ← exec sleep infinity (无操作槽位)
│   └── dashboard/run                  ← 如果 HERMES_DASHBOARD=1，则运行 `hermes dashboard`
│
├── /run/service (s6-svscan 监控；tmpfs)
│   ├── gateway-coder/                 ← 运行时注册的每个配置文件服务
│   │   ├── type        ("longrun")
│   │   ├── run         ("#!/command/with-contenv sh ... exec s6-setuidgid hermes hermes -p coder gateway run")
│   │   ├── down        (标记 — 存在表示“已注册但不要自动启动”)
│   │   └── log/run     (s6-log → $HERMES_HOME/logs/gateways/coder/current)
│   └── ...
│
└── CMD ("主程序")               ← /opt/hermes/docker/main-wrapper.sh
    └── 路由用户参数: bare exec | hermes 子命令 | hermes (无参数)
        — 由 /init 以继承 stdin/stdout/stderr 的方式执行（TTY 用于 --tui）
```
<!-- ascii-guard-ignore-end -->

## 关键文件

| 路径 | 作用 |
|---|---|
| `Dockerfile` | s6-overlay 安装 + cont-init.d 接线 + `ENTRYPOINT ["/init", "/opt/hermes/docker/main-wrapper.sh"]` |
| `docker/stage2-hook.sh` | “旧的入口点逻辑” — UID 重映射、chown、初始化、技能同步。作为 cont-init.d/01-hermes-setup 运行。 |
| `docker/cont-init.d/02-reconcile-profiles` | 在每次启动时调用 `hermes_cli.container_boot`，从持久化卷中恢复配置文件网关槽位。 |
| `docker/main-wrapper.sh` | 容器的 CMD。路由用户参数，通过 `s6-setuidgid` 降级到 hermes，然后执行选定的程序。 |
| `docker/s6-rc.d/main-hermes/run` | 无操作的 `sleep infinity` — 槽位存在以使 s6-rc 用户捆绑有效；主 hermes 作为 CMD 运行，而不是作为被监督的服务。 |
| `docker/s6-rc.d/dashboard/run` | 条件服务 — 如果 `HERMES_DASHBOARD` 为真值，则执行 `exec sleep infinity`。 |
| `docker/entrypoint.sh` | 执行 stage2 hook 的向后兼容 shim。硬编码旧入口点路径的外部脚本仍然有效。 |
| `hermes_cli/service_manager.py` | `S6ServiceManager`: `register_profile_gateway`, `unregister_profile_gateway`, `start/stop/restart/is_running`, `list_profile_gateways`。 |
| `hermes_cli/container_boot.py` | `reconcile_profile_gateways()` — 遍历持久化配置文件，重新生成 s6 槽位，发出 `container-boot.log`。 |
| `hermes_cli/gateway.py::_dispatch_via_service_manager_if_s6` | 拦截 `hermes gateway start/stop/restart` 并路由到 s6（当在容器中运行时）。 |

## 为什么选择架构 B (CMD 作为主程序，而不是由 s6 监督)

原始计划（v1–v3）要求主 hermes 以被监督的 s6-rc 服务形式运行。但有两个实际的 s6-overlay v3 机制阻止了这一点：

1.  **cont-init.d 脚本无法接收 CMD 参数** — 因此 stage2 hook 无法解析 `docker run <image> chat -q "hi"` 来为服务 `run` 脚本设置 `HERMES_ARGS`。
2.  **`/run/s6/basedir/bin/halt` 不会传播写入 `/run/s6-linux-init-container-results/exitcode` 的退出代码**。容器总是以 143 (SIGTERM) 退出，无论如何。Skarnet（s6 作者）在 [issue #477](https://github.com/just-containers/s6-overlay/issues/477) 中确认了这一点：_“如果你想让容器关闭，你必须让你的 CMD 退出，或者，如果没有 CMD，则写入你想要的容器退出代码然后调用 halt”_。

因此我们使用了 s6-overlay 原生的 CMD 模式：`ENTRYPOINT ["/init", "/opt/hermes/docker/main-wrapper.sh"]`。`/init` 会自动将包装器前置到用户参数之前 — 因此 `docker run <image> --version` 会变成 `/init main-wrapper.sh --version`，而 `--version` 不会被 /init 的 POSIX shell 拦截。包装器通过 `s6-setuidgid` 降级到 hermes，然后执行选定的程序。程序的退出代码成为容器的退出代码，这完全符合 pre-s6 tini 的契约。

权衡：主 hermes 在 s6 下是未被监督的。这与它在 tini（pre-s6 镜像）下的行为完全一致。仪表板的监督管理是**新的**保证——而 `/run/service/` 下的每个配置文件网关则获得了完整的监督管理。

## 快速食谱

### 验证 s6 是否为运行容器中的 PID 1

```sh
docker exec <c> sh -c 'cat /proc/1/comm; readlink /proc/1/exe'
# 预期结果: s6-svscan 或 init / /package/admin/s6/.../s6-svscan
```

### 检查一个配置文件网关服务

```sh
# /command/ 不在 docker-exec 的 PATH 中 — 请使用绝对路径
docker exec <c> /command/s6-svstat /run/service/gateway-<name>
# "up (pid …) … seconds"            → 正在运行
# "down (exitcode N) … seconds, normally up, want up, …" → s6 希望它运行但进程持续退出（崩溃循环）
# "down … normally up, ready …"     → 用户停止了它
```

### 手动启动/停止一个服务

```sh
docker exec <c> /command/s6-svc -u /run/service/gateway-<name>   # 启动
docker exec <c> /command/s6-svc -d /run/service/gateway-<name>   # 停止
docker exec <c> /command/s6-svc -t /run/service/gateway-<name>   # SIGTERM (重启)
```

### 监控 cont-init 重协调器的日志

```sh
docker exec <c> tail -n 50 /opt/data/logs/container-boot.log
# 2026-05-21T06:18:05+0000 profile=coder prior_state=running action=started
# 2026-05-21T06:18:05+0000 profile=writer prior_state=stopped action=registered
```

### 添加一个新的静态服务

1.  创建 `docker/s6-rc.d/<name>/type`，内容为 `longrun\n`，并创建 `docker/s6-rc.d/<name>/run`（使用 `#!/command/with-contenv sh` + `# shellcheck shell=sh`）。
2.  在 run 脚本顶部通过 `s6-setuidgid hermes` 降级到 hermes（除非您特别需要 root 权限）。
3.  创建空的 `docker/s6-rc.d/<name>/dependencies.d/base`，使其等待基础捆绑。
4.  创建空的 `docker/s6-rc.d/user/contents.d/<name>`，使其加入用户捆绑。
5.  Dockerfile 中的 `COPY docker/s6-rc.d/` 会自动拾取 — 不需要其他更改。

### 更改每个配置文件的运行命令

编辑 `hermes_cli/service_manager.py` 中的 `S6ServiceManager._render_run_script`。此函数还被 `hermes_cli/container_boot.py::_register_service` 在启动重协调过程中调用，因此它是单一的真相来源。更新 `tests/hermes_cli/test_service_manager.py::test_s6_register_creates_service_dir_and_triggers_scan` 中的相应断言。

### 运行 Docker 测试套件

```sh
docker build -t hermes-agent-harness:latest .
HERMES_TEST_IMAGE=hermes-agent-harness:latest scripts/run_tests.sh tests/docker/ -v
# 预期结果：19 个通过，0 个 xfailed（针对 s6 镜像）
```

该套件位于 `tests/docker/` 中，如果 Docker 不可用则跳过。每个测试的超时时间已增加到 180 秒（参见 `tests/docker/conftest.py`）。

## 常见陷阱

### 使用 `docker exec` 时“command not found”

`/command/`（s6-overlay 放置其二进制文件的位置）仅对由监督树启动的进程（服务、cont-init.d、main-wrapper.sh）有效，而不是对于普通 shell。`docker exec <c> s6-svstat …` 将会失败并显示“command not found”；请始终使用绝对路径 `/command/s6-svstat`。`hermes` 二进制文件之所以有效，是因为 Dockerfile 将 `/opt/hermes/.venv/bin` 添加到了运行时的 `ENV PATH` 中。

### 配置文件目录的所有权

Cont-init 重协调器以 hermes 的身份运行（即 `02-reconcile-profiles` 中的 `s6-setuidgid hermes`）。如果一个配置文件目录最终被 root 所有（例如，因为 `docker exec <c> hermes profile create …` 默认以 root 身份运行），则重协调器无法读取 SOUL.md 并会抛出 `PermissionError`。缓解措施：`stage2-hook.sh` 在**每次**启动时都将 `$HERMES_HOME/profiles` 的所有权更改为 hermes，并做到幂等性。不要移除该代码块。

### 由 `docker exec` 写入的文件被 root 所有

`docker exec` 默认以 root 身份运行。请传递 `--user hermes` 或依赖下一次重启时的 stage2 chown 清扫。不要手动将文件写入 `$HERMES_HOME/profiles/<name>/` 下并让其归 root 所有——下一次协调过程会清扫它们，但正在进行的操作可能会遇到权限错误。

### 服务槽位存在但 s6-svstat 显示“s6-supervise not running”

服务目录位于 tmpfs 上，在容器重启时被清除。这要么是因为 cont-init 重协调器尚未运行（`docker restart` 后请稍等片刻），要么是它失败了。检查 `docker logs <c> | grep '02-reconcile'`。

### 网关立即退出（svstat 中的“down (exitcode 1)”）

最可能的原因是配置文件中没有配置模型或身份验证。服务槽位是正确的——网关本身未配置。请先运行 `hermes -p <profile> setup`。s6 监督器会持续重启它；这是期望的行为（当你修复了配置，下一次尝试就会成功并保持运行）。

### 重协调器跳过一个配置文件

重协调器以 **`SOUL.md` 的存在**为依据来判断“真实配置文件”。`hermes profile create` 总是会初始化它。如果一个配置文件目录缺少 SOUL.md（是游荡的目录、部分恢复或正在进行备份），重协调器会故意跳过它。请添加一个 `SOUL.md`（即使是空的）以重新启用。

### “救命，容器退出了 143！”

检查是否有程序调用了 `s6-svscanctl -t` 或 `/run/s6/basedir/bin/halt` — 两者都会导致 /init 开始第三阶段关机，但返回 143 (SIGTERM) 而不是期望的退出代码。这是从 A 到 B 的第二阶段架构转变。对于带有真实退出代码的容器关闭，你必须让 CMD (main-wrapper.sh) 正常退出；**不要**尝试从 finish 脚本控制退出。

## 相关技能

- `hermes-agent-dev`: 通用的 hermes-agent 代码库导航
- `hermes-tool-quirks`: 特定于 Hermes 工具的变通方法（sed/grep 等）— 当调试 s6 堆栈与 hermes 内置工具的交互时加载。