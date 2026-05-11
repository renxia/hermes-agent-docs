---
title: "Oss Forensics — GitHub 仓库供应链调查、证据恢复与取证分析"
sidebar_label: "Oss Forensics"
description: "针对 GitHub 仓库的供应链调查、证据恢复与取证分析"
---

{/* 本页面由网站脚本 generate-skill-docs.py 从 SKILL.md 自动生成。请编辑源文件 SKILL.md，而非此页面。 */}

# Oss Forensics

针对 GitHub 仓库的供应链调查、证据恢复与取证分析。
涵盖已删除提交恢复、强制推送检测、IOC 提取、多源证据收集、假设形成/验证及结构化取证报告。
受 RAPTOR 超过 1800 行的 Oss Forensics 系统启发。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 通过 `hermes skills install official/security/oss-forensics` 安装 |
| 路径 | `optional-skills/security/oss-forensics` |
| 平台 | linux, macos, windows |

:::info
以下是 Hermes 加载此技能时获取的完整技能定义。这是技能激活时智能体看到的说明。
:::

# OSS 安全取证技能

一个用于研究开源供应链攻击的七阶段多智能体调查框架。
改编自 RAPTOR 的取证系统。涵盖 GitHub Archive、Wayback Machine、GitHub API、
本地 git 分析、IOC 提取、基于证据的假设形成与验证，
以及最终的取证报告生成。

---

## ⚠️ 反幻觉防护措施

在每个调查步骤前阅读这些规定。违反它们会使报告失效。

1.  **证据优先原则**：任何报告、假设或摘要中的每项声明都必须引用至少一个证据 ID（`EV-XXXX`）。禁止断言无引用的结论。
2.  **严格职责分工**：每个子智能体（调查员）只负责单一数据源。**禁止**混合来源。GH Archive 调查员不得查询 GitHub API，反之亦然。角色界限是硬性的。
3.  **事实与假设分离**：所有未验证的推断必须用 `[HYPOTHESIS]` 标记。只有根据原始来源验证过的陈述才能作为事实陈述。
4.  **禁止捏造证据**：假设验证器在接受假设之前，必须机械性地检查引用的每个证据 ID 是否实际存在于证据库中。
5.  **反驳需要证据**：假设不能仅凭具体、有证据支持的反驳论点就被推翻。"未找到证据"不足以反驳——它只能使假设不确定。
6.  **SHA/URL 双重验证**：任何作为证据引用的提交 SHA、URL 或外部标识符，必须在标记为已验证之前，从至少两个独立来源得到确认。
7.  **可疑代码规则**：切勿在本地运行在被调查仓库中发现的代码。仅进行静态分析，或在沙箱环境中使用 `execute_code`。
8.  **密钥脱敏**：调查期间发现的任何 API 密钥、令牌或凭证必须在最终报告中脱敏。仅在内部记录。

---

## 示例场景

-   **场景 A：依赖混淆**：一个恶意软件包 `internal-lib-v2` 被上传到 NPM，其版本号高于内部版本。调查员必须追踪该软件包首次出现的时间，以及目标仓库中是否有 PushEvent 更新了 `package.json` 到该版本。
-   **场景 B：维护者接管**：一个长期贡献者的账户被用于推送一个植入后门的 `.github/workflows/build.yml`。调查员会查找该用户在长时间不活动之后或从新的 IP/位置（如果可通过 BigQuery 检测）发出的 PushEvent。
-   **场景 C：强制推送隐藏**：一个开发者意外提交了生产环境密钥，然后强制推送以"修复"它。调查员使用 `git fsck` 和 GH Archive 来恢复原始提交 SHA 并验证泄露了什么。

---

> **路径约定**：在本技能全文中，`SKILL_DIR` 指的是此技能安装目录的根目录（包含此 `SKILL.md` 的文件夹）。当技能加载时，请将 `SKILL_DIR` 解析为实际路径——例如 `~/.hermes/skills/security/oss-forensics/` 或 `optional-skills/` 中的等效路径。所有脚本和模板引用都相对于此路径。

## 阶段 0：初始化

1.  创建调查工作目录：
    ```bash
    mkdir investigation_$(echo "REPO_NAME" | tr '/' '_')
    cd investigation_$(echo "REPO_NAME" | tr '/' '_')
    ```
2.  初始化证据库：
    ```bash
    python3 SKILL_DIR/scripts/evidence-store.py --store evidence.json list
    ```
3.  复制取证报告模板：
    ```bash
    cp SKILL_DIR/templates/forensic-report.md ./investigation-report.md
    ```
4.  创建一个 `iocs.md` 文件，用于在发现时追踪威胁指标。
5.  记录调查开始时间、目标仓库和声明的调查目标。

---

## 阶段 1：提示解析与 IOC 提取

**目标**：从用户的请求中提取所有结构化的调查目标。

**操作**：
-   解析用户提示并提取：
    -   目标仓库（`owner/repo`）
    -   目标行为者（GitHub 用户名、邮箱地址）
    -   关注的时间窗口（提交日期范围、PR 时间戳）
    -   提供的威胁指标：提交 SHA、文件路径、包名、IP 地址、域名、API 密钥/令牌、恶意 URL
    -   任何关联的供应商安全报告或博客文章

**工具**：仅推理，或使用 `execute_code` 从大段文本中进行正则表达式提取。

**输出**：用提取的 IOC 填充 `iocs.md`。每个 IOC 必须包含：
-   类型（从以下选择：COMMIT_SHA, FILE_PATH, API_KEY, SECRET, IP_ADDRESS, DOMAIN, PACKAGE_NAME, ACTOR_USERNAME, MALICIOUS_URL, OTHER）
-   值
-   来源（用户提供、推断得出）

**参考**：参见 [evidence-types.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/evidence-types.md) 了解 IOC 分类。

---

## 阶段 2：并行证据收集

使用 `delegate_task`（批量模式，最多 3 个并发）派生最多 5 个专门的调查员子智能体。每个调查员拥有**单一数据源**，不得混合来源。

> **协调员注意**：在每个委托任务的 `context` 字段中传递阶段 1 的 IOC 列表和调查时间窗口。

---

### 调查员 1：本地 Git 调查员

**角色边界**：你**仅查询本地 Git 仓库**。不要调用任何外部 API。

**操作**：
```bash
# 克隆仓库
git clone https://github.com/OWNER/REPO.git target_repo && cd target_repo

# 包含统计信息的完整提交日志
git log --all --full-history --stat --format="%H|%ae|%an|%ai|%s" > ../git_log.txt

# 检测强制推送证据（孤立/悬挂提交）
git fsck --lost-found --unreachable 2>&1 | grep commit > ../dangling_commits.txt

# 检查引用日志以发现重写历史
git reflog --all > ../reflog.txt

# 列出所有分支，包括已删除的远程引用
git branch -a -v > ../branches.txt

# 查找可疑的大型二进制文件添加
git log --all --diff-filter=A --name-only --format="%H %ai" -- "*.so" "*.dll" "*.exe" "*.bin" > ../binary_additions.txt

# 检查 GPG 签名异常
git log --show-signature --format="%H %ai %aN" > ../signature_check.txt 2>&1
```

**要收集的证据**（通过 `python3 SKILL_DIR/scripts/evidence-store.py add` 添加）：
-   每个悬挂提交 SHA → 类型：`git`
-   强制推送证据（显示历史重写的引用日志） → 类型：`git`
-   来自已验证贡献者的未签名提交 → 类型：`git`
-   可疑的二进制文件添加 → 类型：`git`

**参考**：参见 [recovery-techniques.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/recovery-techniques.md) 了解如何访问被强制推送的提交。

---

### 调查员 2：GitHub API 调查员

**角色边界**：你**仅查询 GitHub REST API**。不要在本地运行 git 命令。

**操作**：
```bash
# 提交记录（分页）
curl -s "https://api.github.com/repos/OWNER/REPO/commits?per_page=100" > api_commits.json

# 拉取请求，包括已关闭/已删除的
curl -s "https://api.github.com/repos/OWNER/REPO/pulls?state=all&per_page=100" > api_prs.json

# 问题
curl -s "https://api.github.com/repos/OWNER/REPO/issues?state=all&per_page=100" > api_issues.json

# 贡献者和协作者变更
curl -s "https://api.github.com/repos/OWNER/REPO/contributors" > api_contributors.json

# 仓库事件（最近 300 个）
curl -s "https://api.github.com/repos/OWNER/REPO/events?per_page=100" > api_events.json

# 检查特定可疑提交 SHA 的详细信息
curl -s "https://api.github.com/repos/OWNER/REPO/git/commits/SHA" > commit_detail.json

# 发布
curl -s "https://api.github.com/repos/OWNER/REPO/releases?per_page=100" > api_releases.json

# 检查特定提交是否存在（被强制推送的提交可能在 commits/ 端点返回 404，但在 git/commits/ 端点成功）
curl -s "https://api.github.com/repos/OWNER/REPO/commits/SHA" | jq .sha
```

**交叉引用目标**（将差异标记为证据）：
-   存档中存在 PR 但从 API 中缺失 → 删除的证据
-   存档事件中有贡献者但不在贡献者列表中 → 权限撤销的证据
-   存档的 PushEvents 中存在提交但不在 API 提交列表中 → 强制推送/删除的证据

**参考**：参见 [evidence-types.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/evidence-types.md) 了解 GH 事件类型。

---

### 调查员 3：Wayback Machine 调查员

**角色边界**：你**仅查询 Wayback Machine CDX API**。不使用 GitHub API。

**目标**：恢复已删除的 GitHub 页面（README、问题、PR、发布、Wiki 页面）。

**操作**：
```bash
# 搜索仓库主页的存档快照
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO&output=json&limit=100&from=YYYYMMDD&to=YYYYMMDD" > wayback_main.json

# 搜索特定的已删除问题
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/issues/NUM&output=json&limit=50" > wayback_issue_NUM.json

# 搜索特定的已删除 PR
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/pull/NUM&output=json&limit=50" > wayback_pr_NUM.json

# 获取页面的最佳快照
# 使用 Wayback Machine URL: https://web.archive.org/web/TIMESTAMP/ORIGINAL_URL
# 示例: https://web.archive.org/web/20240101000000*/github.com/OWNER/REPO

# 高级：搜索已删除的发布/标签
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/releases/tag/*&output=json" > wayback_tags.json

# 高级：搜索历史 Wiki 变更
curl -s "https://web.archive.org/cdx/search/cdx?url=github.com/OWNER/REPO/wiki/*&output=json" > wayback_wiki.json
```

**要收集的证据**：
-   已删除问题/PR 的存档快照及其内容
-   显示变更的历史 README 版本
-   存档中存在但当前 GitHub 状态中缺失的内容证据

**参考**：参见 [github-archive-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/github-archive-guide.md) 了解 CDX API 参数。

---

### 调查员 4：GH Archive / BigQuery 调查员

**角色边界**：你**仅通过 BigQuery 查询 GitHub Archive**。这是所有公共 GitHub 事件的防篡改记录。

> **前提条件**：需要具有 BigQuery 访问权限的 Google Cloud 凭据（`gcloud auth application-default login`）。如果不可用，请跳过此调查员并在报告中注明。

**成本优化规则**（**强制**）：
1.  每次查询前**必须**运行 `--dry_run` 来估算成本。
2.  使用 `_TABLE_SUFFIX` 按日期范围过滤并最小化扫描的数据量。
3.  仅 SELECT 需要的列。
4.  除非在进行聚合，否则添加 LIMIT。

```bash
# 模板：针对 OWNER/REPO 的 PushEvents 的安全 BigQuery 查询
bq query --use_legacy_sql=false --dry_run "
SELECT created_at, actor.login, payload.commits, payload.before, payload.head,
       payload.size, payload.distinct_size
FROM \`githubarchive.month.*\`
WHERE _TABLE_SUFFIX BETWEEN 'YYYYMM' AND 'YYYYMM'
  AND type = 'PushEvent'
  AND repo.name = 'OWNER/REPO'
LIMIT 1000
"
# 如果成本可接受，则不带 --dry_run 重新运行

# 检测强制推送：零 distinct_size 的 PushEvent 意味着提交被强制删除
# payload.distinct_size = 0 AND payload.size > 0 → 强制推送指标

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
-   强制推送事件（payload.size > 0, payload.distinct_size = 0）
-   分支/标签的 DeleteEvent
-   可疑 CI/CD 自动化的 WorkflowRunEvent
-   在 git 日志"空白期"之前的 PushEvent（重写的证据）

**参考**：参见 [github-archive-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/github-archive-guide.md) 了解所有 12 种事件类型和查询模式。

---

### 调查员 5：IOC 丰富化调查员

**角色边界**：你**仅使用被动公开来源**来丰富阶段 1 中的现有 IOC。不要执行来自目标仓库的任何代码。

**操作**：
-   对于每个提交 SHA：尝试通过直接 GitHub URL 恢复（`github.com/OWNER/REPO/commit/SHA.patch`）
-   对于每个域名/IP：通过 `web_extract` 在公共 WHOIS 服务上检查被动 DNS、WHOIS 记录
-   对于每个包名：在 npm/PyPI 上检查是否有匹配的恶意软件包报告
-   对于每个行为者用户名：检查 GitHub 个人资料、贡献历史、账户年龄
-   使用 3 种方法恢复被强制推送的提交（参见 [recovery-techniques.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/recovery-techniques.md)）

---

## 第三阶段：证据整合

所有调查员完成后：

1. 运行 `python3 SKILL_DIR/scripts/evidence-store.py --store evidence.json list` 查看所有收集的证据。
2. 对每条证据，验证其 `content_sha256` 哈希值是否与原始来源匹配。
3. 按以下方式对证据进行分组：
   - **时间线**：将所有带时间戳的证据按时间顺序排列
   - **参与者**：按 GitHub 用户名或电子邮件地址分组
   - **IOC**：将证据与它相关的 IOC 关联起来
4. 识别**差异项**：存在于一个来源但不在另一个来源中的条目（关键的删除指标）。
5. 将证据标记为 `[VERIFIED]`（已从 2 个以上独立来源确认）或 `[UNVERIFIED]`（仅来自单一来源）。

---

## 第四阶段：形成假设

一个假设必须：
- 陈述一个具体的主张（例如，“参与者 X 在 DATE 强制推送到 BRANCH 以擦除提交 SHA”）
- 引用至少两个支持它的证据 ID（`EV-XXXX`, `EV-YYYY`）
- 识别哪些证据可以推翻该假设
- 在得到验证前标记为 `[HYPOTHESIS]`

**常见假设模板**（参见 [investigation-templates.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/investigation-templates.md)）：
- 维护者被入侵：合法账户在被接管后用于注入恶意代码
- 依赖混淆：通过包名占位来拦截安装
- CI/CD 注入：恶意的工作流更改，在构建期间运行代码
- 拼写错误劫持：针对拼写错误者的近似包名
- 凭据泄露：令牌/密钥意外提交，然后强制推送以擦除

对于每个假设，生成一个 `delegate_task` 子智能体，试图在确认之前寻找否定证据。

---

## 第五阶段：假设验证

验证者子智能体必须机械地检查：

1. 对于每个假设，提取所有引用的证据 ID。
2. 验证每个 ID 是否存在于 `evidence.json` 中（如果任何 ID 缺失，则硬性失败 → 假设被驳回，可能属于捏造）。
3. 验证每条 `[VERIFIED]` 的证据是否已从 2 个以上来源确认。
4. 检查逻辑一致性：证据描绘的时间线是否支持该假设？
5. 检查替代解释：同样的证据模式是否可能由良性原因引起？

**输出**：
- `VALIDATED`（已验证）：所有引用的证据都存在、已验证、逻辑一致，且没有合理的替代解释。
- `INCONCLUSIVE`（不确定）：证据支持假设但存在替代解释，或证据不充分。
- `REJECTED`（已驳回）：缺少证据 ID、将未经验证的证据当作事实引用、检测到逻辑不一致。

被驳回的假设反馈回第四阶段进行修正（最多 3 次迭代）。

---

## 第六阶段：生成最终报告

使用 [forensic-report.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/templates/forensic-report.md) 中的模板填充 `investigation-report.md`。

**必填章节**：
- 执行摘要：一段话的结论（被入侵 / 未被入侵 / 不确定）并附带置信度
- 时间线：按时间顺序重建所有重大事件，并引用证据
- 已验证的假设：每个假设的状态及支持它的证据 ID
- 证据清单：所有 `EV-XXXX` 条目的表格，包含来源、类型和验证状态
- IOC 列表：所有提取和充实的入侵指标
- 证据链：证据是如何收集的、从哪些来源、在什么时间
- 建议：如果检测到入侵，提供立即缓解措施；监控建议

**报告规则**：
- 每项事实主张必须至少引用一个 `[EV-XXXX]`
- 执行摘要必须说明置信度（高 / 中 / 低）
- 所有密钥/凭据必须编辑为 `[REDACTED]`

---

## 第七阶段：完成

1. 运行最终证据计数：`python3 SKILL_DIR/scripts/evidence-store.py --store evidence.json list`
2. 归档整个调查目录。
3. 如果确认入侵：
   - 列出立即缓解措施（轮换凭据、固定依赖哈希值、通知受影响的用户）
   - 识别受影响的版本/包
   - 注意披露义务（如果是公开的包：与包注册机构协调）
4. 将最终的 `investigation-report.md` 呈现给用户。

---

## 道德使用指南

此技能专为**防御性安全调查**设计——保护开源软件免受供应链攻击。它不得用于：

- **骚扰或跟踪**贡献者或维护者
- **人肉搜索**——将 GitHub 活动关联到真实身份以用于恶意目的
- **竞争情报**——未经授权调查专有或内部仓库
- **虚假指控**——在没有经过验证的证据的情况下发布调查结果（参见反幻觉防护栏）

调查应遵循**最小侵入**原则：仅收集验证或推翻假设所必需的证据。发布结果时，遵循负责任的披露实践，并在公开披露前与受影响的维护者协调。

如果调查揭示了真正的入侵，请遵循协调漏洞披露流程：
1. 首先私下通知仓库维护者
2. 给予合理的修复时间（通常为 90 天）
3. 如果发布了受影响的包，与包注册机构（npm, PyPI 等）协调
4. 如果适用，提交 CVE

---

## API 速率限制

GitHub REST API 强制实施速率限制，如果不加以管理，大型调查将被中断。

**已认证请求**：5,000 次/小时（需要 `GITHUB_TOKEN` 环境变量或 `gh` CLI 认证）
**未认证请求**：60 次/小时（对调查不可用）

**最佳实践**：
- 始终进行认证：`export GITHUB_TOKEN=ghp_...` 或使用 `gh` CLI（自动认证）
- 使用条件请求（`If-None-Match` / `If-Modified-Since` 头）以避免在未更改的数据上消耗配额
- 对于分页端点，按顺序获取所有页面——不要针对同一端点并行化
- 检查 `X-RateLimit-Remaining` 头；如果低于 100，暂停直到 `X-RateLimit-Reset` 时间戳
- BigQuery 有自己的配额（免费层每天 10 TiB）——始终先试运行
- Wayback Machine CDX API：没有正式的速率限制，但请保持礼貌（最多 1-2 次请求/秒）

如果在调查过程中受到速率限制，请在证据存储中记录部分结果，并在报告中注明该限制。

---

## 参考材料

- [github-archive-guide.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/github-archive-guide.md) — BigQuery 查询、CDX API、12 种事件类型
- [evidence-types.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/evidence-types.md) — IOC 分类学、证据源类型、观察类型
- [recovery-techniques.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/recovery-techniques.md) — 恢复已删除的提交、PR、问题
- [investigation-templates.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/references/investigation-templates.md) — 针对每种攻击类型的预建假设模板
- [evidence-store.py](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/scripts/evidence-store.py) — 用于管理证据 JSON 存储的 CLI 工具
- [forensic-report.md](https://github.com/NousResearch/hermes-agent/blob/main/optional-skills/security/oss-forensics/templates/forensic-report.md) — 结构化报告模板