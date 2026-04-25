---
title: "Oss Forensics — 针对 GitHub 仓库的供应链调查、证据恢复与取证分析"
sidebar_label: "Oss Forensics"
description: "针对 GitHub 仓库的供应链调查、证据恢复与取证分析"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 文件自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Oss Forensics

针对 GitHub 仓库的供应链调查、证据恢复与取证分析。
涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集、假设形成/验证以及结构化取证报告。
灵感来源于 RAPTOR 的 1800 余行开源软件取证系统。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/security/oss-forensics` 安装 |
| 路径 | `optional-skills/security/oss-forensics` |

## 参考：完整的 SKILL.md

:::info
以下是 Hermes 在触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# 开源软件安全取证技能

一个用于研究开源供应链攻击的 7 阶段多智能体调查框架。
改编自 RAPTOR 的取证系统。涵盖 GitHub 存档、Wayback Machine、GitHub API、
本地 Git 分析、IOC 提取、基于证据的假设形成与验证，
以及最终取证报告的生成。

---

## ⚠️ 反幻觉防护措施

在每一步调查之前阅读这些内容。违反这些规则将使报告无效。

1. **证据优先规则**：任何报告、假设或摘要中的每一项声明都必须引用至少一个证据 ID（`EV-XXXX`）。无引用的断言是禁止的。
2. **各司其职**：每个子智能体（调查员）只能访问单一数据源。不得混合使用数据源。GH 存档调查员不得查询 GitHub API，反之亦然。角色边界是严格的。
3. **事实与假设分离**：所有未经证实的推断必须标记为 `[HYPOTHESIS]`。只有经过原始来源验证的陈述才能作为事实陈述。
4. **禁止伪造证据**：假设验证器必须在接受假设之前，机械地检查每个引用的证据 ID 是否实际存在于证据存储中。
5. **需要证据的反驳**：不能在没有具体、基于证据的反驳论点的情况下驳回假设。“未找到证据”不足以反驳——它只能使假设变为不确定。
6. **SHA/URL 双重验证**：任何作为证据引用的提交 SHA、URL 或外部标识符，在被标记为已验证之前，必须从至少两个来源独立确认。
7. **可疑代码规则**：切勿在本地运行被调查仓库中找到的代码。仅进行静态分析，或在沙盒环境中使用 `execute_code`。
8. **密钥脱敏**：在调查过程中发现的任何 API 密钥、令牌或凭据，必须在最终报告中脱敏。仅在内部日志中记录它们。

---

## 示例场景

- **场景 A：依赖混淆**：一个恶意包 `internal-lib-v2` 被上传到 NPM，其版本高于内部版本。调查员必须追踪该包首次出现的时间，以及目标仓库中的任何 PushEvent 是否将 `package.json` 更新为此版本。
- **场景 B：维护者接管**：一个长期贡献者的账户被用来推送一个带有后门的 `.github/workflows/build.yml`。调查员需要查找该用户在长时间不活动后或从新 IP/位置（如果可通过 BigQuery 检测到）发起的 PushEvent。
- **场景 C：强制推送隐藏**：一个开发者意外提交了一个生产密钥，然后通过强制推送来“修复”它。调查员使用 `git fsck` 和 GH 存档来恢复原始提交 SHA，并验证泄露了哪些内容。

---

> **路径约定**：在整个技能中，`SKILL_DIR` 指的是此技能安装目录的根目录（包含此 `SKILL.md` 的文件夹）。当技能被加载时，将 `SKILL_DIR` 解析为实际路径 —— 例如 `~/.hermes/skills/security/oss-forensics/` 或 `optional-skills/` 的等效路径。所有脚本和模板引用都是相对于它的。

## 阶段 0：初始化

1. 创建调查工作目录：
   ```bash
   mkdir investigation_$(echo "REPO_NAME" | tr '/' '_')
   cd investigation_$(echo "REPO_NAME" | tr '/' '_')
   ```
2. 初始化证据存储：
   ```bash
   python3 SKILL_DIR/scripts/evidence-store.py --store evidence.json list
   ```
3. 复制取证报告模板：
   ```bash
   cp SKILL_DIR/templates/forensic-report.md ./investigation-report.md
   ```
4. 创建一个 `iocs.md` 文件，用于跟踪发现的可疑指标（IOC）。
5. 记录调查开始时间、目标仓库和所述调查目标。

---

## 阶段 1：提示解析与 IOC 提取

**目标**：从用户的请求中提取所有结构化的调查目标。

**操作**：
- 解析用户提示并提取：
  - 目标仓库 (`owner/repo`)
  - 目标参与者（GitHub 用户名、电子邮件地址）
  - 关注的时间窗口（提交日期范围、PR 时间戳）
  - 提供的可疑指标（IOC）：提交 SHA、文件路径、包名、IP 地址、域名、API 密钥/令牌、恶意 URL
  - 任何链接的供应商安全报告或博客文章

**工具**：仅推理，或对大文本块使用 `execute_code` 进行正则表达式提取。

**输出**：将提取的 IOC 填充到 `iocs.md` 中。每个 IOC 必须包含：
- 类型（来自：COMMIT_SHA, FILE_PATH, API_KEY, SECRET, IP_ADDRESS, DOMAIN, PACKAGE_NAME, ACTOR_USERNAME, MALICIOUS_URL, OTHER）
- 值
- 来源（用户提供、推断）

**参考**：请参阅 [evidence-types.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/evidence-types.md) 了解 IOC 分类法。

---

## 阶段 2：并行证据收集

使用 `delegate_task`（批处理模式，最多 3 个并发）生成最多 5 个专家调查员子智能体。每个调查员只能访问**单一数据源**，并且不得混合使用数据源。

> **协调器说明**：将阶段 1 的 IOC 列表和调查时间窗口传递给每个委派任务的 `context` 字段。

---

### 调查员 1：本地 Git 调查员

**角色边界**：您只能查询**本地 Git 仓库**。不得调用任何外部 API。

**操作**：
```bash
# 克隆仓库
git clone https://github.com/OWNER/REPO.git target_repo && cd target_repo

# 完整的提交日志（含统计信息）
git log --all --full-history --stat --format="%H|%ae|%an|%ai|%s" > ../git_log.txt

# 检测强制推送证据（孤立/悬空提交）
git fsck --lost-found --unreachable 2>&1 | grep commit > ../dangling_commits.txt

# 检查引用日志以查找重写的历史记录
git reflog --all > ../reflog.txt

# 列出所有分支（包括已删除的远程引用）
git branch -a -v > ../branches.txt

# 查找可疑的大二进制文件添加
git log --all --diff-filter=A --name-only --format="%H %ai" -- "*.so" "*.dll" "*.exe" "*.bin" > ../binary_additions.txt

# 检查 GPG 签名异常
git log --show-signature --format="%H %ai %aN" > ../signature_check.txt 2>&1
```

**要收集的证据**（通过 `python3 SKILL_DIR/scripts/evidence-store.py add` 添加）：
- 每个悬空提交 SHA → 类型：`git`
- 强制推送证据（引用日志显示历史重写） → 类型：`git`
- 来自已验证贡献者的未签名提交 → 类型：`git`
- 可疑的二进制文件添加 → 类型：`git`

**参考**：请参阅 [recovery-techniques.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/recovery-techniques.md) 了解访问强制推送提交的方法。

---

### 调查员 2：GitHub API 调查员

**角色边界**：您只能查询 **GitHub REST API**。不得在本地运行 git 命令。

**操作**：
```bash
# 提交（分页）
curl -s "https://api.github.com/repos/OWNER/REPO/commits?per_page=100" > api_commits.json

# 拉取请求（包括已关闭/已删除的）
curl -s "https://api.github.com/repos/OWNER/REPO/pulls?state=all&per_page=100" > api_prs.json

# 议题
curl -s "https://api.github.com/repos/OWNER/REPO/issues?state=all&per_page=100" > api_issues.json

# 贡献者和协作者变更
curl -s "https://api.github.com/repos/OWNER/REPO/contributors" > api_contributors.json

# 仓库事件（最近 300 条）
curl -s "https://api.github.com/repos/OWNER/REPO/events?per_page=100" > api_events.json

# 检查特定可疑提交 SHA 的详细信息
curl -s "https://api.github.com/repos/OWNER/REPO/git/commits/SHA" > commit_detail.json

# 发布版本
curl -s "https://api.github.com/repos/OWNER/REPO/releases?per_page=100" > api_releases.json

# 检查特定提交是否存在（强制推送的提交可能在 commits/ 上返回 404，但在 git/commits/ 上成功）
curl -s "https://api.github.com/repos/OWNER/REPO/commits/SHA" | jq .sha
```

**交叉引用目标**（将差异标记为证据）：
- 存档中存在 PR 但 API 中缺失 → 删除证据
- 存档事件中有贡献者但贡献者列表中缺失 → 权限撤销证据
- 存档 PushEvent 中有提交但 API 提交列表中缺失 → 强制推送/删除证据

**参考**：请参阅 [evidence-types.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/evidence-types.md) 了解 GH 事件类型。

---

### 调查员 3：Wayback Machine 调查员

**角色边界**：您只能查询 **Wayback Machine CDX API**。不得使用 GitHub API。

**目标**：恢复已删除的 GitHub 页面（README、议题、PR、发布版本、Wiki 页面）。

**操作**：
```bash
# 搜索仓库主页的存档快照
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO&output=json&limit=100&from=YYYYMMDD&to=YYYYMMDD" > wayback_main.json

# 搜索特定已删除议题
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/issues/NUM&output=json&limit=50" > wayback_issue_NUM.json

# 搜索特定已删除 PR
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/pull/NUM&output=json&limit=50" > wayback_pr_NUM.json

# 获取页面的最佳快照
# 使用 Wayback Machine URL：https://web.archive.org/web/TIMESTAMP/ORIGINAL_URL
# 示例：https://web.archive.org/web/20240101000000*/github.com/OWNER/REPO

# 高级：搜索已删除的发布版本/标签
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/releases/tag/*&output=json" > wayback_tags.json

# 高级：搜索历史 Wiki 变更
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/wiki/*&output=json" > wayback_wiki.json
```

**要收集的证据**：
- 已删除议题/PR 的存档快照及其内容
- 显示变更的历史 README 版本
- 存档中存在但当前 GitHub 状态中缺失的内容证据

**参考**：请参阅 [github-archive-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/github-archive-guide.md) 了解 CDX API 参数。

---

### 调查员 4：GH 存档 / BigQuery 调查员

**角色边界**：您只能通过 BIGQUERY 查询 **GITHUB ARCHIVE**。这是所有公共 GitHub 事件的防篡改记录。

> **先决条件**：需要具有 BigQuery 访问权限的 Google Cloud 凭据（`gcloud auth application-default login`）。如果不可用，请跳过此调查员并在报告中注明。

**成本优化规则**（强制）：
1. 每次查询前务必运行 `--dry_run` 以估算成本。
2. 使用 `_TABLE_SUFFIX` 按日期范围过滤并最小化扫描的数据量。
3. 仅选择您需要的列。
4. 除非进行聚合，否则添加 LIMIT。

```bash
# 模板：针对 OWNER/REPO 的 PushEvent 的安全 BigQuery 查询
bq query --use_legacy_sql=false --dry_run "
SELECT created_at, actor.login, payload.commits, payload.before, payload.head,
       payload.size, payload.distinct_size
FROM \`githubarchive.month.*\`
WHERE _TABLE_SUFFIX BETWEEN 'YYYYMM' AND 'YYYYMM'
  AND type = 'PushEvent'
  AND repo.name = 'OWNER/REPO'
LIMIT 1000
"
# 如果成本可接受，请重新运行（不带 --dry_run）

# 检测强制推送：零 distinct_size 的 PushEvent 表示提交被强制擦除
# payload.distinct_size = 0 AND payload.size > 0 → 强制推送指示器

# 检查已删除分支事件
bq query --use_legacy_sql=false "
SELECT created_at, actor.login, payload.ref, payload.ref_type
FROM \`githubarchive.month.*\`
WHERE _TABLE_SUFFIX BETWEEN 'YYYYMM' AND 'YYYYMM'
  AND type = 'DeleteEvent'
  AND repo.name = 'OWNER/REPO'
LIMIT 200
"
```

**要收集的证据**：
- 强制推送事件（payload.size > 0, payload.distinct_size = 0）
- 分支/标签的 DeleteEvent
- 可疑 CI/CD 自动化的 WorkflowRunEvent
- 在 git 日志中出现“间隙”之前的 PushEvent（重写证据）

**参考**：请参阅 [github-archive-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/github-archive-guide.md) 了解所有 12 种事件类型和查询模式。

---

### 调查员 5：IOC 丰富化调查员

**角色边界**：您只能使用被动公共来源来丰富阶段 1 中的**现有 IOC**。不得执行目标仓库中的任何代码。

**操作**：
- 对于每个提交 SHA：尝试通过直接 GitHub URL（`github.com/OWNER/REPO/commit/SHA.patch`）进行恢复
- 对于每个域名/IP：检查被动 DNS、WHOIS 记录（通过公共 WHOIS 服务的 `web_extract`）
- 对于每个包名：检查 npm/PyPI 上的匹配恶意包报告
- 对于每个参与者用户名：检查 GitHub 个人资料、贡献历史、账户年龄
- 使用 3 种方法恢复强制推送的提交（参见 [recovery-techniques.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/recovery-techniques.md)）

---

## 阶段 3：证据整合

在所有调查员完成工作后：

1. 运行 `python3 SKILL_DIR/scripts/evidence-store.py --store evidence.json list` 查看所有收集到的证据。
2. 对每一条证据，验证其 `content_sha256` 哈希值是否与原始源匹配。
3. 按以下方式对证据进行分组：
   - **时间线**：将所有带时间戳的证据按时间顺序排序
   - **行为者**：按 GitHub 用户名或电子邮件分组
   - **IOC**：将证据与其相关的 IOC 关联起来
4. 识别**差异项**：在一个来源中存在但在另一个来源中缺失的项（关键删除指标）。
5. 将证据标记为 `[已验证]`（经 2 个及以上独立来源确认）或 `[未验证]`（仅单一来源）。

---

## 阶段 4：假设形成

一个假设必须：
- 提出一个具体主张（例如：“行为者 X 于 DATE 强制推送至 BRANCH 以擦除提交 SHA”）
- 引用至少 2 个支持该假设的证据 ID（`EV-XXXX`、`EV-YYYY`）
- 明确指出哪些证据可以推翻该假设
- 在验证前标记为 `[假设]`

**常见假设模板**（参见 [investigation-templates.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/investigation-templates.md)）：
- 维护者入侵：合法账户在接管后被用于注入恶意代码
- 依赖混淆：通过包名抢注拦截安装
- CI/CD 注入：恶意工作流更改以在构建期间运行代码
- 拼写抢注：使用与目标包名几乎相同的名称针对拼写错误者
- 凭据泄露：令牌/密钥被意外提交后强制推送以擦除

对于每个假设，生成一个 `delegate_task` 子智能体，尝试在确认前寻找反驳证据。

---

## 阶段 5：假设验证

验证子智能体必须机械地检查：

1. 对每个假设，提取所有引用的证据 ID。
2. 验证每个 ID 是否存在于 `evidence.json` 中（若任一 ID 缺失则为硬性失败 → 假设因可能伪造而被拒绝）。
3. 验证每条 `[已验证]` 证据是否经 2 个及以上来源确认。
4. 检查逻辑一致性：证据所描绘的时间线是否支持该假设？
5. 检查是否存在其他解释：相同的证据模式是否可能由良性原因引起？

**输出**：
- `已验证`：所有引用证据均存在、已验证、逻辑一致，且无合理的其他解释。
- `不确定`：证据支持假设，但存在其他解释或证据不足。
- `已拒绝`：缺少证据 ID、引用了未验证的证据作为事实、检测到逻辑不一致。

被拒绝的假设将反馈至阶段 4 进行优化（最多 3 次迭代）。

---

## 阶段 6：最终报告生成

使用 [forensic-report.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/templates/forensic-report.md) 中的模板填充 `investigation-report.md`。

**必需章节**：
- 执行摘要：一段式结论（已入侵 / 干净 / 不确定）及置信度等级
- 时间线：按时间顺序重建所有重要事件，并附证据引用
- 已验证假设：每个假设的状态及其支持的证据 ID
- 证据注册表：包含所有 `EV-XXXX` 条目的表格，列明来源、类型和验证状态
- IOC 列表：所有提取并增强的入侵指标
- 监管链：证据如何收集、来自哪些来源、在何时收集
- 建议：若检测到入侵，列出立即缓解措施；监控建议

**报告规则**：
- 每个事实主张必须至少有一个 `[EV-XXXX]` 引用
- 执行摘要必须说明置信度等级（高 / 中 / 低）
- 所有机密/凭据必须脱敏为 `[已脱敏]`

---

## 阶段 7：完成

1. 运行最终证据计数：`python3 SKILL_DIR/scripts/evidence-store.py --store evidence.json list`
2. 归档整个调查目录。
3. 若确认入侵：
   - 列出立即缓解措施（轮换凭据、固定依赖项哈希、通知受影响用户）
   - 识别受影响的版本/包
   - 注明披露义务（若为公共包：与包注册中心协调）
4. 向用户提交最终的 `investigation-report.md`。

---

## 伦理使用准则

此技能专为**防御性安全调查**设计——保护开源软件免受供应链攻击。不得用于：

- **骚扰或跟踪**贡献者或维护者
- **人肉搜索**——出于恶意目的将 GitHub 活动与真实身份关联
- **竞争情报**——未经授权调查专有或内部仓库
- **虚假指控**——在未经已验证证据的情况下发布调查结果（参见反幻觉防护措施）

调查应遵循**最小侵入原则**：仅收集验证或反驳假设所必需的证据。发布结果时，应遵循负责任的披露实践，并在公开披露前与受影响的维护者协调。

若调查揭示真实入侵，请遵循协调漏洞披露流程：
1. 首先私下通知仓库维护者
2. 给予合理的修复时间（通常为 90 天）
3. 若已发布包受影响，与包注册中心（npm、PyPI 等）协调
4. 若适用，申请 CVE

---

## API 速率限制

GitHub REST API 强制执行速率限制，若管理不当将中断大型调查。

**已认证请求**：5,000/小时（需要 `GITHUB_TOKEN` 环境变量或 `gh` CLI 认证）
**未认证请求**：60/小时（无法用于调查）

**最佳实践**：
- 始终认证：`export GITHUB_TOKEN=ghp_...` 或使用 `gh` CLI（自动认证）
- 使用条件请求（`If-None-Match` / `If-Modified-Since` 标头）避免对未更改数据消耗配额
- 对于分页端点，按顺序获取所有页面——不要对同一端点并行请求
- 检查 `X-RateLimit-Remaining` 标头；若低于 100，暂停至 `X-RateLimit-Reset` 时间戳
- BigQuery 有其自身配额（免费层 10 TiB/天）——始终先试运行
- Wayback Machine CDX API：无正式速率限制，但请保持礼貌（最大 1-2 请求/秒）

若在调查中途被限速，请将部分结果记录到证据存储中，并在报告中注明此限制。

---

## 参考资料

- [github-archive-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/github-archive-guide.md) — BigQuery 查询、CDX API、12 种事件类型
- [evidence-types.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/evidence-types.md) — IOC 分类法、证据来源类型、观察类型
- [recovery-techniques.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/recovery-techniques.md) — 恢复已删除的提交、PR、议题
- [investigation-templates.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/investigation-templates.md) — 按攻击类型预建的假设模板
- [evidence-store.py](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/scripts/evidence-store.py) — 用于管理证据 JSON 存储的 CLI 工具
- [forensic-report.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/templates/forensic-report.md) — 结构化报告模板