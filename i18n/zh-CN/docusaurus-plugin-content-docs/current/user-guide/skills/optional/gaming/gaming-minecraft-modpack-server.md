---
title: Minecraft Modpack Server — 托管模组化 Minecraft 服务器 (CurseForge, Modrinth)
sidebar_label: Minecraft Modpack Server
description: 托管模组化 Minecraft 服务器 (CurseForge, Modrinth)
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Minecraft Modpack Server

托管模组化 Minecraft 服务器 (CurseForge, Modrinth)。

## Skill metadata

| | |
|---|---|
| Source | 可选 — 使用 `hermes skills install official/gaming/minecraft-modpack-server` 安装 |
| Path | `optional-skills/gaming/minecraft-modpack-server` |
| Platforms | linux, macos |

## Reference: full SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时所看到的指令。
:::

# Minecraft Modpack Server Setup

## When to use
- 用户需要从服务器包 zip 文件设置模组化 Minecraft 服务器
- 用户需要 NeoForge/Forge 服务器配置方面的帮助
- 用户询问 Minecraft 服务器性能调优或备份

## Gather User Preferences First
在开始设置之前，先向用户询问以下信息：
- **Server name / MOTD** — 服务器列表上应该显示什么？
- **Seed** — 特定种子还是随机的？
- **Difficulty** — 和平/简单/普通/困难？
- **Gamemode** — 生存/创造/冒险？
- **Online mode** — true (Mojang 认证，合法账号) 或 false (LAN/破解友好)?
- **Player count** — 预计有多少玩家？(影响 RAM 和视距调优)
- **RAM allocation** — 还是让智能体根据模组数量和可用 RAM 来决定？
- **View distance / simulation distance** — 还是让智能体根据玩家数量和硬件来选择？
- **PvP** — 开或关？
- **Whitelist** — 公开服务器还是仅限白名单？
- **Backups** — 是否需要自动备份？多久一次？

如果用户不关心，请使用合理的默认值，但在生成配置之前务必询问。

## Steps

### 1. Download & Inspect the Pack
```bash
mkdir -p ~/minecraft-server
cd ~/minecraft-server
wget -O serverpack.zip "<URL>"
unzip -o serverpack.zip -d server
ls server/
```
查找：`startserver.sh`、安装器 jar (neoforge/forge)、`user_jvm_args.txt`、`mods/` 文件夹。
检查脚本以确定：模组加载器类型、版本和所需的 Java 版本。

### 2. Install Java
- Minecraft 1.21+ → Java 21: `sudo apt install openjdk-21-jre-headless`
- Minecraft 1.18-1.20 → Java 17: `sudo apt install openjdk-17-jre-headless`
- Minecraft 1.16 及更早版本 → Java 8: `sudo apt install openjdk-8-jre-headless`
- 验证：`java -version`

### 3. Install the Mod Loader
大多数服务器包都包含一个安装脚本。使用 INSTALL_ONLY 环境变量进行安装，而不是直接启动：
```bash
cd ~/minecraft-server/server
ATM10_INSTALL_ONLY=true bash startserver.sh
# 或对于通用的 Forge 包:
# java -jar forge-*-installer.jar --installServer
```
这会下载库、打补丁到服务器 jar 等。

### 4. Accept EULA
```bash
echo "eula=true" > ~/minecraft-server/server/eula.txt
```

### 5. Configure server.properties
模组化/LAN 的关键设置：
```properties
motd=\u00a7b\u00a7lServer Name \u00a7r\u00a78| \u00a7aModpack Name
server-port=25565
online-mode=true          # false for LAN without Mojang auth (非Mojang认证的LAN)
enforce-secure-profile=true  # match online-mode
difficulty=hard            # 大多数模组包都以困难为基准
allow-flight=true          # 模组化必需 (飞行坐骑/物品)
spawn-protection=0         # 让所有人都能在出生点建造
max-tick-time=180000       # 模组化需要更长的 tick 超时时间
enable-command-block=true
```

性能设置（根据硬件进行缩放）：
```properties
# 2 名玩家，配置强大的机器:
view-distance=16
simulation-distance=10

# 4-6 名玩家，中等配置的机器:
view-distance=10
simulation-distance=6

# 8+ 名玩家或较弱的硬件:
view-distance=8
simulation-distance=4
```

### 6. Tune JVM Args (user_jvm_args.txt)
根据玩家数量和模组数量来调整 RAM。模组化的一般经验法则是：
- 100-200 个模组: 6-12GB
- 200-350+ 个模组: 12-24GB
- 为操作系统/其他任务至少保留 8GB 自由内存

```
-Xms12G
-Xmx24G
-XX:+UseG1GC
-XX:+ParallelRefProcEnabled
-XX:MaxGCPauseMillis=200
-XX:+UnlockExperimentalVMOptions
-XX:+DisableExplicitGC
-XX:+AlwaysPreTouch
-XX:G1NewSizePercent=30
-XX:G1MaxNewSizePercent=40
-XX:G1HeapRegionSize=8M
-XX:G1ReservePercent=20
-XX:G1HeapWastePercent=5
-XX:G1MixedGCCountTarget=4
-XX:InitiatingHeapOccupancyPercent=15
-XX:G1MixedGCLiveThresholdPercent=90
-XX:G1RSetUpdatingPauseTimePercent=5
-XX:SurvivorRatio=32
-XX:+PerfDisableSharedMem
-XX:MaxTenuringThreshold=1
```

### 7. Open Firewall
```bash
sudo ufw allow 25565/tcp comment "Minecraft Server"
```
使用 `sudo ufw status | grep 25565` 检查。

### 8. Create Launch Script
```bash
cat > ~/start-minecraft.sh << 'EOF'
#!/bin/bash
cd ~/minecraft-server/server
java @user_jvm_args.txt @libraries/net/neoforged/neoforge/<VERSION>/unix_args.txt nogui
EOF
chmod +x ~/start-minecraft.sh
```
注意：对于 Forge (非 NeoForge)，参数文件的路径是不同的。请检查 `startserver.sh` 以获取确切路径。

### 9. Set Up Automated Backups
创建备份脚本：
```bash
cat > ~/minecraft-server/backup.sh << 'SCRIPT'
#!/bin/bash
SERVER_DIR="$HOME/minecraft-server/server"
BACKUP_DIR="$HOME/minecraft-server/backups"
WORLD_DIR="$SERVER_DIR/world"
MAX_BACKUPS=24
mkdir -p "$BACKUP_DIR"
[ ! -d "$WORLD_DIR" ] && echo "[BACKUP] No world folder" && exit 0
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/world_${TIMESTAMP}.tar.gz"
echo "[BACKUP] Starting at $(date)"
tar -czf "$BACKUP_FILE" -C "$SERVER_DIR" world
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[BACKUP] Saved: $BACKUP_FILE ($SIZE)"
BACKUP_COUNT=$(ls -1t "$BACKUP_DIR"/world_*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE=$((BACKUP_COUNT - MAX_BACKUPS))
    ls -1t "$BACKUP_DIR"/world_*.tar.gz | tail -n "$REMOVE" | xargs rm -f
    echo "[BACKUP] Pruned $REMOVE old backup(s)"
fi
echo "[BACKUP] Done at $(date)"
SCRIPT
chmod +x ~/minecraft-server/backup.sh
```

添加小时级 cron 任务：
```bash
(crontab -l 2>/dev/null | grep -v "minecraft/backup.sh"; echo "0 * * * * $HOME/minecraft-server/backup.sh >> $HOME/minecraft-server/backups/backup.log 2>&1") | crontab -
```

## Pitfalls
- 对于模组化服务器，务必设置 `allow-flight=true` — 否则带有喷气背包/飞行的模组会踢掉玩家。
- `max-tick-time=180000` 或更高 — 模组服务器在世界生成期间经常有长时间的 tick。
- 首次启动速度慢 (大型包可能需要几分钟) — 不要惊慌。
- 首次启动时的“无法跟上！”警告是正常的，初始区块生成后会稳定下来。
- 如果 online-mode=false，也请设置 enforce-secure-profile=false，否则客户端会被拒绝。
- 包中的 startserver.sh 通常包含一个自动重启循环 — 请创建一个不含该循环的干净启动脚本。
- 要重新生成新种子，请删除 world/ 文件夹。
- 有些包有环境变量来控制行为 (例如，ATM10 使用 ATM10_JAVA, ATM10_RESTART, ATM10_INSTALL_ONLY)。

## Verification
- 使用 `pgrep -fa neoforge` 或 `pgrep -fa minecraft` 检查是否正在运行。
- 检查日志：`tail -f ~/minecraft-server/server/logs/latest.log`
- 在日志中查找 "Done (Xs)!" = 服务器已准备就绪。
- 测试连接：玩家在多人游戏 (Multiplayer) 中添加服务器 IP。