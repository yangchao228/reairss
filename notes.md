# Notes: Demo 后端接口与联调实现要点

## Sources

### `docs/prd1.0.md`
- 一期核心闭环：找源 → 订阅 → 阅读流 → 详情 → 中转页。
- Demo 阶段允许使用 SQLite 单实例，不要求先做 AI、登录、收藏。

### `docs/API和DB设计.md`
- 业务接口统一走 `/api/v1`。
- 需要的最小接口集合已经明确定义，分页以 cursor 为主。

### `design/api-contract.md`
- 统一响应 `{ code, message, data, trace_id }`。
- `X-Device-Id` 是订阅主体，小程序请求层已经具备该 Header 生成逻辑。

### 现有代码观察
- 小程序页面已全部跑在 `miniapp/utils/mock.js` 上，核心字段主要是：
  - 源：`id/name/desc/category/subscribed`
  - Feed：`id/title/source_name/published_ago/raw_summary/link_url/domain`
- 后端目前只有 `health`，但 SQLite schema 已覆盖 `rss_source`、`subscription`、`content_item` 三张一期核心表。

## Synthesized Findings

### 继续开发的最短路径
- 启动时自动 seed 演示数据，否则前端切到真实 API 后会全部空白。
- 让后端响应尽量贴近现有前端字段，比大改前端页面更稳。
- 小程序端可以保留本地主题、协议、本地筛选逻辑，只替换数据来源。

### 实现边界
- 本轮优先做 Demo 可联调，不扩展 AI、收藏、举报、登录。
- 中转页和 WebView 仍沿用当前前端逻辑，不需要单独后端跳转接口才能完成演示。

### 验证现状
- `python3 -m compileall app` 已通过，说明后端 Python 代码至少没有语法错误。
- 宿主 Python 3.14 不适合直接装当前依赖，最终改用仓库自带 `Dockerfile`（Python 3.11）完成真实运行验证。
- Docker smoke test 已验证：
  - `GET /health`
  - `GET /api/v1/sources`
  - `GET /api/v1/subscriptions`
  - `POST /api/v1/subscriptions`
  - `GET /api/v1/feed`
  - `GET /api/v1/content/{id}`
  - `GET /api/v1/redirect/{id}`
  - feed cursor 分页
  - 重复订阅返回 `40003`
