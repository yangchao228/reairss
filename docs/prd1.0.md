# prd1.0 — 微信小程序 RSS × AI 阅读助手（Demo→上线跑通）完整设计文档

> 本文档用于指导一期 Demo 从开发到上线跑通（体验版/正式版）。
>
> 一期目标：先跑通闭环，不追求功能全；同时在实现上为后续 React Native App 迁移保留低成本路径。

---

## 1. 目标与成功标准

### 1.1 产品目标（Demo 版）

* 解决冷启动：提供精选 RSS 源库
* 跑通核心闭环：找源→订阅→阅读流→详情→中转页→打开源站
* 合规可提审：协议弹窗、来源标注、外链中转确认

### 1.2 成功标准（验收口径）

* 小程序可发布体验版，并可进入正式提审流程
* 首次打开必须同意协议后才能使用
* 用户 30 秒内完成首次订阅
* 订阅后阅读流可看到内容
* 内容详情页可打开中转页，手动确认后可跳源站
* 后端以单实例方式稳定运行（SQLite 持久化）

---

## 2. 范围定义

### 2.1 一期必做（MVP 闭环）

* 源库：分类、排序（热度/字母）、搜索
* 订阅：订阅/取消、我的订阅列表
* 阅读：阅读流（聚合订阅源内容）、下拉刷新、分页
* 内容：详情页展示标题/来源/时间/摘要
* 外链：安全中转页（确认后跳转）
* 合规：隐私协议/用户协议弹窗、来源标注
* 抓取：RSS 拉取脚本 + 定时任务（cron）

### 2.2 一期不做（Out of Scope）

* AI 摘要/标签/去重/低质过滤（Demo 先用 RSS 原摘要 raw_summary）
* 收藏/分享/举报
* 微信登录与云端同步
* 置顶/复杂筛选
* 埋点（可留接口占位但不阻塞上线）

> 说明：二期再逐步补齐 AI、去重、过滤、举报、埋点、登录同步。

---

## 3. 迁移到 RN App 的低成本原则（一期就要遵守）

1. **业务能力在后端**：抓取、解析、未来 AI 都放服务端。
2. **API 版本化**：从第一天起使用 `/api/v1`，避免后续改接口破坏 App。
3. **统一响应与错误码**：跨端复用。
4. **统一分页 cursor**：列表性能与可扩展性保证。
5. **身份模型不写死微信**：一期先用 `device_id`，二期扩展 `user_id + identities`。
6. **中转页语义固定**：来源展示 + 风险提示 + 手动确认。

---

## 4. 系统架构（一期 Demo）

### 4.1 架构概览

* 小程序前端：页面渲染与交互
* FastAPI 后端：源库/订阅/阅读流/内容/中转
* SQLite：单文件持久化存储（Demo 单实例）
* RSS 抓取：脚本 `fetch_rss.py` + cron 定时

### 4.2 为什么一期选 SQLite

* 不需要单独部署 MySQL，速度最快
* 支持唯一约束，保证 RSS 幂等写入
* 后续切 MySQL：表结构 1:1 迁移成本最低

> 注意：SQLite 推荐单实例运行。未来需要多实例/水平扩展时切 MySQL。

---

## 5. 前端信息架构与页面说明

### 5.1 Tab 结构

* 【阅读】阅读流
* 【找源】源库 + 搜索
* 【订阅】我的订阅
* 【我的】设置/协议入口（Demo 简化）

### 5.2 页面最小交互

**A. 首次启动协议弹窗**

* 未同意：阻断使用
* 同意后：进入找源或阅读

**B. 找源页**

* 分类列表 + 源卡
* 搜索框：按名称/领域/简介
* 源卡：订阅/已订阅

**C. 订阅页**

* 展示订阅列表
* 支持取消订阅
* 空状态：引导去找源

**D. 阅读页**

* 聚合订阅源内容
* 下拉刷新
* cursor 分页
* 空状态：无订阅/无内容引导

**E. 内容详情页**

* 标题、来源、时间、摘要（raw_summary）
* 按钮：查看全文 → 中转页

**F. 中转页**

* 显示来源名、风险提示
* 继续访问按钮（必须手动确认）

---

## 6. 后端 API 设计（一期）

### 6.1 通用约定

* Base：`/api/v1`
* 必须请求头：

  * `X-Platform: wx`
  * `X-App-Version: 1.0.0`
  * `X-Device-Id: <uuid>`（客户端生成并持久化）
  * `X-Session-Id: <uuid>`（每次启动生成）

### 6.2 统一响应

```json
{ "code": 0, "message": "ok", "data": {}, "trace_id": "..." }
```

### 6.3 接口清单（一期必须）

**健康检查**

* GET `/health`

**源库**

* GET `/sources?category=&sort=hot|alpha`
* GET `/sources/search?q=`
* GET `/sources/{source_id}`（可选）

**订阅**（以 `X-Device-Id` 作为主体）

* POST `/subscriptions` body `{ "source_id": 1 }`
* DELETE `/subscriptions/{source_id}`
* GET `/subscriptions`（按订阅时间倒序）

**阅读流/内容**

* GET `/feed?cursor=&limit=&source_id=&time_range=24h|3d|7d`
* GET `/content/{content_id}`

**中转**

* GET `/redirect/{content_id}`

### 6.4 分页规范（feed）

* 请求：`cursor`（空表示从最新开始），`limit` 默认 20，最大 50
* 响应：

```json
{ "items": [], "next_cursor": "...", "has_more": true }
```

> cursor 推荐实现：使用 `(published_at, id)` 组合游标，避免同一时间戳排序不稳定。

---

## 7. SQLite 数据库设计（一期最小 3 表）

### 7.1 schema.sql

> 文件路径建议：`app/db/schema.sql`

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rss_source (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  homepage_url TEXT,
  update_freq TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_fetch_at TEXT,
  last_item_published_at TEXT,
  fail_count INTEGER NOT NULL DEFAULT 0,
  popularity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rss_source_category ON rss_source(category);
CREATE INDEX IF NOT EXISTS idx_rss_source_status ON rss_source(status);
CREATE INDEX IF NOT EXISTS idx_rss_source_popularity ON rss_source(popularity);

CREATE TABLE IF NOT EXISTS subscription (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(device_id, source_id),
  FOREIGN KEY(source_id) REFERENCES rss_source(id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_device ON subscription(device_id);

CREATE TABLE IF NOT EXISTS content_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  link_url TEXT NOT NULL,
  author TEXT,
  published_at TEXT NOT NULL,
  guid TEXT,
  raw_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_id, link_url),
  FOREIGN KEY(source_id) REFERENCES rss_source(id)
);

CREATE INDEX IF NOT EXISTS idx_content_source_published ON content_item(source_id, published_at);
CREATE INDEX IF NOT EXISTS idx_content_published ON content_item(published_at);
```

### 7.2 幂等策略（一期必须）

* RSS 抓取写入内容时：依赖 `UNIQUE(source_id, link_url)`
* 插入冲突：忽略/更新（建议忽略，保留第一次写入）

---

## 8. RSS 抓取与定时任务（一期）

### 8.1 抓取脚本

* 路径：`scripts/fetch_rss.py`
* 行为：

  1. 读取 `rss_source` 中 `status='active'` 的源
  2. 用 feedparser 拉取并解析
  3. 标准化 link（可选去 utm）
  4. 写入 `content_item`（幂等）

### 8.2 定时执行

* 最小：cron 每 30 分钟执行一次
* 失败处理：

  * 失败计数 `fail_count +1`
  * 成功抓取：`fail_count=0`，更新 `last_fetch_at`

> 源有效性状态机（updating/invalid）一期可先不做前端展示，后端先留字段。

---

## 9. 合规与审核要点（一期必做）

1. 首次启动必须同意隐私协议/用户协议
2. 内容详情页必须展示“内容来源”（RSS 源名称）
3. 外链跳转必须中转确认，不允许自动跳转
4. 空状态/加载态齐全，避免审核遇到白屏

---

## 10. 部署与上线（一期最小流程）

### 10.1 后端部署

* FastAPI：`uvicorn`（建议 systemd 或 docker）
* SQLite：`./data/app.db` 放在持久化目录
* HTTPS 域名：小程序 request 合法域名必须 https
* cron：定时跑抓取脚本

### 10.2 小程序配置

* request 合法域名配置（https 后端域名）
* 业务域名/ webview 域名（如需要）
* 填写隐私合规信息、类目、截图等

---

## 11. 最小开发计划（可执行节奏）

> 目标：7 天内跑通体验版闭环

* D1：工程骨架 + health + SQLite 初始化 + 小程序 API client
* D2：源库/搜索/订阅接口 + 找源页/订阅页
* D3：RSS 抓取脚本 + feed/content 接口 + 阅读页/详情页
* D4：协议弹窗 + 中转页（合规关键）
* D5：错误兜底 + 空状态/加载态 + cursor 分页
* D6：部署 + 小程序域名配置 + 体验版发布
* D7：回归测试 + 提审/上线

---

## 12. 二期路线（提示，不阻塞一期）

* AI 摘要/标签/过滤/去重（Celery + Redis）
* 收藏/分享/举报
* 埋点与指标面板
* 登录与云端同步（user_id + identities）
* 源有效性校验与失效隐藏

---

## 13. 工程实现建议（强制约束，便于迁移）

### 13.1 后端目录建议

```
app/
  main.py
  core/ (config, db)
  db/ (schema.sql, init.py)
  repo/ (sources, subscriptions, content)
  api/routes/ (health, sources, subscriptions, feed, content, redirect)
scripts/
  fetch_rss.py
```

### 13.2 前端建议

* 封装 `client`：统一 headers/错误处理/分页
* `device_id`：首次生成后持久化
* `session_id`：每次启动生成

---

## 14. 附录：一期最小任务清单（摘录）

* 后端：health、sources、subscriptions、feed、content、redirect
* 数据库：SQLite 3 表 + schema.sql
* 抓取：fetch_rss.py + cron
* 前端：协议弹窗、找源、订阅、阅读、详情、中转
* 上线：https 域名 + 小程序域名配置 + 体验版发布
