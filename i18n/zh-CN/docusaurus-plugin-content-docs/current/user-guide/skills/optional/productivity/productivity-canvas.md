---
title: "Canvas — Canvas LMS 集成 — 使用 API 令牌认证获取已注册课程和作业"
sidebar_label: "Canvas"
description: "Canvas LMS 集成 — 使用 API 令牌认证获取已注册课程和作业"
---

{/* 此页面由 website/scripts/generate-skill-docs.py 从技能的 SKILL.md 自动生成。请编辑源文件 SKILL.md，而不是此页面。 */}

# Canvas

Canvas LMS 集成 — 使用 API 令牌认证获取已注册课程和作业。

## 技能元数据

| | |
|---|---|
| 来源 | 可选 — 使用 `hermes skills install official/productivity/canvas` 安装 |
| 路径 | `optional-skills/productivity/canvas` |
| 版本 | `1.0.0` |
| 作者 | 社区 |
| 许可证 | MIT |
| 标签 | `Canvas`, `LMS`, `教育`, `课程`, `作业` |

## 参考：完整 SKILL.md

:::info
以下是 Hermes 触发此技能时加载的完整技能定义。这是智能体在技能激活时看到的指令。
:::

# Canvas LMS — 课程与作业访问

对 Canvas LMS 的只读访问，用于列出课程和作业。

## 脚本

- `scripts/canvas_api.py` — 用于调用 Canvas API 的 Python CLI 工具

## 设置

1. 在浏览器中登录您的 Canvas 实例  
2. 进入 **账户 → 设置**（点击您的头像图标，然后选择“设置”）  
3. 滚动到 **已批准的集成**，点击 **+ 新建访问令牌**  
4. 为令牌命名（例如“Hermes 智能体”），设置可选的过期时间，然后点击 **生成令牌**  
5. 复制令牌并添加到 `~/.hermes/.env`：

```
CANVAS_API_TOKEN=your_token_here
CANVAS_BASE_URL=https://yourschool.instructure.com
```

基础 URL 是您在浏览器中登录 Canvas 时显示的地址（末尾不要带斜杠）。

## 使用方法

```bash
CANVAS="python $HERMES_HOME/skills/productivity/canvas/scripts/canvas_api.py"

# 列出所有活跃课程
$CANVAS list_courses --enrollment-state active

# 列出所有课程（任意状态）
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

注意：作业描述会被截断至 500 个字符。`html_url` 字段链接到 Canvas 中的完整作业页面。

## API 参考（curl）

```bash
# 列出课程
curl -s -H "Authorization: Bearer $CANVAS_API_TOKEN" \
  "$CANVAS_BASE_URL/api/v1/courses?enrollment_state=active&per_page=10"

# 列出某课程的作业
curl -s -H "Authorization: Bearer $CANVAS_API_TOKEN" \
  "$CANVAS_BASE_URL/api/v1/courses/COURSE_ID/assignments?per_page=10&order_by=due_at"
```

Canvas 使用 `Link` 头部进行分页。Python 脚本会自动处理分页。

## 规则

- 此技能为**只读** — 仅获取数据，绝不修改课程或作业  
- 首次使用时，请运行 `$CANVAS list_courses` 验证身份认证 — 如果返回 401 错误，请引导用户完成设置  
- Canvas 的速率限制约为每 10 分钟 700 次请求；若遇到限制，请检查 `X-Rate-Limit-Remaining` 头部  

## 故障排除

| 问题 | 解决方案 |
|---------|-----|
| 401 未授权 | 令牌无效或已过期 — 请在 Canvas 设置中重新生成 |
| 403 禁止访问 | 令牌缺少该课程的访问权限 |
| 课程列表为空 | 尝试使用 `--enrollment-state active` 或省略该参数以查看所有状态 |
| 错误的机构 | 确认 `CANVAS_BASE_URL` 与浏览器中的 URL 一致 |
| 超时错误 | 检查与 Canvas 实例的网络连接 |