---
title: "Docker管理"
sidebar_label: "Docker管理"
description: "管理Docker容器、镜像、卷、网络和Compose栈 — 生命周期操作、调试、清理与Dockerfile优化"
---

{/* 本页面由网站脚本 `website/scripts/generate-skill-docs.py` 根据技能的 `SKILL.md` 自动生成。请编辑源文件 `SKILL.md`，而非此页面。 */}

# Docker管理

管理Docker容器、镜像、卷、网络和Compose栈 — 生命周期操作、调试、清理与Dockerfile优化。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/devops/docker-management` 安装 |
| 路径 | `optional-skills/devops/docker-management` |
| 版本 | `1.0.0` |
| 作者 | sprmn24 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `docker`, `containers`, `devops`, `infrastructure`, `compose`, `images`, `volumes`, `networks`, `debugging` |

:::info
以下是当此技能被触发时，Hermes 加载的完整技能定义。这就是当技能激活时，智能体看到的指令。
:::

# Docker 管理

使用标准的 Docker CLI 命令管理 Docker 容器、镜像、卷、网络和 Compose 栈。除 Docker 自身外，无需其他额外依赖。

## 使用场景

- 运行、停止、重启、移除或检查容器
- 构建、拉取、推送、标记或清理 Docker 镜像
- 使用 Docker Compose (多服务栈)
- 管理卷或网络
- 调试崩溃的容器或分析日志
- 检查 Docker 磁盘使用情况或释放空间
- 审查或优化 Dockerfile

## 先决条件

- 已安装并运行 Docker Engine
- 用户已添加到 `docker` 组（或使用 `sudo`）
- Docker Compose v2 (包含在现代 Docker 安装中)

快速检查：

```bash
docker --version && docker compose version
```

## 快速参考

| 任务 | 命令 |
|------|---------|
| 运行容器 (后台) | `docker run -d --name NAME IMAGE` |
| 停止并移除 | `docker stop NAME && docker rm NAME` |
| 查看日志 (跟踪) | `docker logs --tail 50 -f NAME` |
| 进入容器 shell | `docker exec -it NAME /bin/sh` |
| 列出所有容器 | `docker ps -a` |
| 构建镜像 | `docker build -t TAG .` |
| Compose 启动 | `docker compose up -d` |
| Compose 关闭 | `docker compose down` |
| 磁盘使用情况 | `docker system df` |
| 清理悬空项 | `docker image prune && docker container prune` |

## 步骤

### 1. 确定领域

判断请求属于哪个方面：

- **容器生命周期** → run, stop, start, restart, rm, pause/unpause
- **容器交互** → exec, cp, logs, inspect, stats
- **镜像管理** → build, pull, push, tag, rmi, save/load
- **Docker Compose** → up, down, ps, logs, exec, build, config
- **卷和网络** → create, inspect, rm, prune, connect
- **故障排除** → 日志分析、退出码、资源问题

### 2. 容器操作

**运行新容器：**

```bash
# 分离服务并进行端口映射
docker run -d --name web -p 8080:80 nginx

# 带环境变量
docker run -d -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=mydb --name db postgres:16

# 带持久化数据 (命名卷)
docker run -d -v pgdata:/var/lib/postgresql/data --name db postgres:16

# 用于开发 (绑定挂载源代码)
docker run -d -v $(pwd)/src:/app/src -p 3000:3000 --name dev my-app

# 交互式调试 (退出时自动移除)
docker run -it --rm ubuntu:22.04 /bin/bash

# 带资源限制和重启策略
docker run -d --memory=512m --cpus=1.5 --restart=unless-stopped --name app my-app
```

关键标志：`-d` 分离模式，`-it` 交互+终端，`--rm` 自动移除，`-p` 端口 (宿主机:容器)，`-e` 环境变量，`-v` 卷，`--name` 名称，`--restart` 重启策略。

**管理正在运行的容器：**

```bash
docker ps                        # 正在运行的容器
docker ps -a                     # 所有容器 (包括已停止的)
docker stop NAME                 # 优雅停止
docker start NAME                # 启动已停止的容器
docker restart NAME              # 停止并启动
docker rm NAME                   # 移除已停止的容器
docker rm -f NAME                # 强制移除正在运行的容器
docker container prune           # 移除所有已停止的容器
```

**与容器交互：**

```bash
docker exec -it NAME /bin/sh          # shell 访问 (如果可用，使用 /bin/bash)
docker exec NAME env                   # 查看环境变量
docker exec -u root NAME apt update    # 以特定用户运行
docker logs --tail 100 -f NAME         # 跟踪最后 100 行日志
docker logs --since 2h NAME            # 过去 2 小时的日志
docker cp NAME:/path/file ./local      # 从容器复制文件
docker cp ./file NAME:/path/           # 复制文件到容器
docker inspect NAME                    # 完整容器详情 (JSON)
docker stats --no-stream               # 资源使用快照
docker top NAME                        # 正在运行的进程
```

### 3. 镜像管理

```bash
# 构建
docker build -t my-app:latest .
docker build -t my-app:prod -f Dockerfile.prod .
docker build --no-cache -t my-app .              # 干净重建
DOCKER_BUILDKIT=1 docker build -t my-app .       # 使用 BuildKit 更快

# 拉取和推送
docker pull node:20-alpine
docker login ghcr.io
docker tag my-app:latest registry/my-app:v1.0
docker push registry/my-app:v1.0

# 检查
docker images                          # 列出本地镜像
docker history IMAGE                   # 查看层
docker inspect IMAGE                   # 完整详情

# 清理
docker image prune                     # 移除悬空 (未标记) 镜像
docker image prune -a                  # 移除所有未使用的镜像 (谨慎使用!)
docker image prune -a --filter "until=168h"   # 移除超过 7 天的未使用镜像
```

### 4. Docker Compose

```bash
# 启动/停止
docker compose up -d                   # 分离模式启动所有服务
docker compose up -d --build           # 启动前重建镜像
docker compose down                    # 停止并移除容器
docker compose down -v                 # 同时移除卷 (销毁数据)

# 监控
docker compose ps                      # 列出服务
docker compose logs -f api             # 跟踪特定服务的日志
docker compose logs --tail 50          # 所有服务最后 50 行日志

# 交互
docker compose exec api /bin/sh        # 进入运行中服务的 shell
docker compose run --rm api npm test   # 一次性命令 (新容器)
docker compose restart api             # 重启特定服务

# 验证
docker compose config                  # 验证并查看解析后的配置
```

**最小的 compose.yml 示例：**

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### 5. 卷和网络

```bash
# 卷
docker volume ls                       # 列出卷
docker volume create mydata            # 创建命名卷
docker volume inspect mydata           # 详情 (挂载点等)
docker volume rm mydata                # 移除 (如果正在使用则失败)
docker volume prune                    # 移除未使用的卷

# 网络
docker network ls                      # 列出网络
docker network create mynet            # 创建桥接网络
docker network inspect mynet           # 详情 (连接的容器)
docker network connect mynet NAME      # 将容器连接到网络
docker network disconnect mynet NAME   # 断开容器连接
docker network rm mynet                # 移除网络
docker network prune                   # 移除未使用的网络
```

### 6. 磁盘使用和清理

清理前务必先进行诊断：

```bash
# 检查什么在占用空间
docker system df                       # 摘要
docker system df -v                    # 详细分解

# 有针对性的清理 (安全)
docker container prune                 # 已停止的容器
docker image prune                     # 悬空镜像
docker volume prune                    # 未使用的卷
docker network prune                   # 未使用的网络

# 激进清理 (请先与用户确认!)
docker system prune                    # 容器 + 镜像 + 网络
docker system prune -a                 # 同时包含未使用的镜像
docker system prune -a --volumes       # 所有内容——包括命名卷
```

**警告：** 永远不要在不确认用户的情况下运行 `docker system prune -a --volumes`。这会移除可能包含重要数据的命名卷。

## 常见陷阱

| 问题 | 原因 | 修复 |
|---------|-------|-----|
| 容器立即退出 | 主进程已完成或崩溃 | 检查 `docker logs NAME`，尝试 `docker run -it --entrypoint /bin/sh IMAGE` |
| "端口已被占用" | 另一个进程正在使用该端口 | `docker ps` 或 `lsof -i :PORT` 查找它 |
| "设备上没有剩余空间" | Docker 磁盘已满 | `docker system df` 然后进行有针对性的清理 |
| 无法连接到容器 | 应用程序在容器内绑定到 127.0.0.1 | 应用程序必须绑定到 `0.0.0.0`，检查 `-p` 映射 |
| 卷上权限被拒绝 | 主机与容器 UID/GID 不匹配 | 使用 `--user $(id -u):$(id -g)` 或修复权限 |
| Compose 服务无法互相访问 | 网络或服务名称错误 | 服务使用服务名称作为主机名，检查 `docker compose config` |
| 构建缓存不起作用 | Dockerfile 中层顺序错误 | 将不常变化的层放在前面 (先依赖项后源代码) |
| 镜像过大 | 无多阶段构建，无 .dockerignore | 使用多阶段构建，添加 `.dockerignore` |

## 验证

任何 Docker 操作后，验证结果：

- **容器已启动？** → `docker ps` (检查状态为 "Up")
- **日志干净？** → `docker logs --tail 20 NAME` (无错误)
- **端口可访问？** → `curl -s http://localhost:PORT` 或 `docker port NAME`
- **镜像已构建？** → `docker images | grep TAG`
- **Compose 栈健康？** → `docker compose ps` (所有服务为 "running" 或 "healthy")
- **磁盘已释放？** → `docker system df` (比较前后)

## Dockerfile 优化建议

在审查或创建 Dockerfile 时，可参考以下优化建议：

1. **使用多阶段构建** — 将构建环境与运行时环境分离，以减小最终镜像体积
2. **合理安排指令顺序** — 将依赖项声明置于源代码之前，避免因代码变更导致缓存层失效
3. **合并 RUN 指令** — 减少镜像层数，缩小镜像体积
4. **善用 .dockerignore 文件** — 排除 `node_modules`、`.git`、`__pycache__` 等非必要文件
5. **固定基础镜像版本** — 使用 `node:20-alpine` 而非 `node:latest`
6. **以非 root 用户运行** — 通过 `USER` 指令提升安全性
7. **选择精简/Alpine 版基础镜像** — 使用 `python:3.12-slim` 而非 `python:3.12`