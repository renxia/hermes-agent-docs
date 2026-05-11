---
title: "Canvas — Canvas LMS 集成 — 使用 API 令牌认证获取已注册的课程和作业"
sidebar_label: "Canvas"
description: "Canvas LMS 集成 — 使用 API 令牌认证获取已注册的课程和作业"
---

{/* This page is auto-generated from the skill's SKILL.md by website/scripts/generate-skill-docs.py. Edit the source SKILL.md, not this page. */}

# Canvas

Canvas LMS 集成 — 使用 API 令牌认证获取已注册的课程和作业。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/canvas` 安装 |
| 路径 | `optional-skills/productivity/canvas` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 平台 | linux, macos, windows |
| 标签 | `Canvas`, `LMS`, `教育`, `课程`, `作业` |

## 参考：完整的 SKILL.md

:::info
以下是此技能被触发时，Hermes 加载的完整技能定义。当技能激活时，这就是智能体看到的指令。
:::

# Canvas LMS — 课程与作业访问

对 Canvas LMS 进行只读访问，以列出课程和作业。

## 脚本

- `scripts/canvas_api.py` — 用于 Canvas API 调用的 Python CLI 工具

## 设置

1. 在浏览器中登录您的 Canvas 实例
2. 前往 **帐户 → 设置**（点击您的个人资料图标，然后选择设置）
3. 滚动到 **已批准的集成** 并点击 **+ 新建访问令牌**
4. 为令牌命名（例如，"Hermes 智能体"），设置可选的过期时间，然后点击 **生成令牌**
5. 复制令牌并将其添加到 `~/.hermes/.env`：

```
CANVAS_API_TOKEN=your_token_here
CANVAS_BASE_URL=https://yourschool.instructure.com
```

基础 URL 是您登录 Canvas 时浏览器中显示的网址（不带尾部斜杠）。

## 使用方法

```bash
CANVAS="python $HERMES_HOME/skills/productivity/canvas/scripts/canvas_api.py"

# 列出所有活跃课程
$CANVAS list_courses --enrollment-state active

# 列出所有课程（任何状态）
$CANVAS list_courses

# 列出特定课程的作业
$CANVAS list_assignments 12345

# 按截止日期排序列出作业
$CANVAS list_assignments 12345 --order-by due_at
```

## 输出格式

**list_courses** 返回：
```json
[{"id": 12345, "name": "计算机科学导论", "course_code": "CS101", "workflow_state": "available", "start_at": "...", "end_at": "..."}]
```

**list_assignments** 返回：
```json
[{"id": 67890, "name": "作业 1", "due_at": "2025-02-15T23:59:00Z", "points_possible": 100, "submission_types": ["online_upload"], "html_url": "...", "description": "...", "course_id": 12345}]
```

注意：作业描述被截断为 500 个字符。`html_url` 字段链接到 Canvas 中完整的作业页面。

## API 参考（curl）

```bash
# 列出课程
curl -s -H "Authorization: Bearer $CANVAS_API_TOKEN" \
  "$CANVAS_BASE_URL/api/v1/courses?enrollment_state=active&per_page=10"

# 列出某个课程的作业
curl -s -H "Authorization: Bearer $CANVAS_API_TOKEN" \
  "$CANVAS_BASE_URL/api/v1/courses/COURSE_ID/assignments?per_page=10&order_by=due_at"
```

Canvas 使用 `Link` 头部进行分页。Python 脚本会自动处理分页。

## 规则

- 此技能是**只读的** — 它仅获取数据，从不修改课程或作业
- 首次使用时，通过运行 `$CANVAS list_courses` 来验证认证 — 如果因 401 错误而失败，请引导用户完成设置
- Canvas 速率限制约为每 10 分钟 700 个请求；如果达到限制，请检查 `X-Rate-Limit-Remaining` 头部

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 401 未授权 | 令牌无效或已过期 — 在 Canvas 设置中重新生成 |
| 403 禁止访问 | 令牌缺少对此课程的权限 |
| 课程列表为空 | 尝试 `--enrollment-state active` 或省略该标志以查看所有状态 |
| 机构错误 | 验证 `CANVAS_BASE_URL` 是否与浏览器中的 URL 匹配 |
| 超时错误 | 检查到您 Canvas 实例的网络连接 |