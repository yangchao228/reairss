# V1.0 API 文档 & 数据库设计（FastAPI）

> 适用：一期微信小程序（游客模式为主，可选微信登录），为后续 React Native App 迁移预留扩展点。
>
> 约定：所有接口前缀 `/api/v1`；所有时间字段为 **UTC ISO8601**；分页统一 **cursor**。

---

## 1. 通用约定

### 1.1 Base URL

* `/api/v1`

### 1.2 请求头（必须）

* `X-Platform`: `wx`（后续扩展 `ios`/`android`）
* `X-App-Version`: 例如 `1.0.0`
* `X-Device-Id`: 客户端生成并持久化的匿名设备 ID
* `X-Session-Id`: 每次启动生成（用于埋点/诊断）
* `Authorization`: `Bearer <token>`（仅登录用户；游客可不带）

### 1.3 统一响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "trace_id": "d7c1..."
}
```

* `code=0` 表示成功
* 常见错误码：

  * `40001` 参数错误
  * `40101` 未登录/Token 无效
  * `40301` 无权限
  * `40401` 资源不存在
  * `40901` 资源冲突（重复订阅/重复收藏等）
  * `42901` 频控
  * `50000` 服务端错误

### 1.4 分页统一（cursor）

响应 `data` 统一：

```json
{
  "items": [],
  "next_cursor": "",
  "has_more": false
}
```

请求参数：

* `cursor`：可选，空表示从最新开始
* `limit`：可选，默认 20，最大 50

---

## 2. RSS 源库（Sources）

### 2.1 获取源库列表

**GET** `/sources`

Query:

* `category` 可选（科技/职场/财经/教育/生活/知识…）
* `sort` 可选：`hot`（默认）| `alpha`
* `status` 可选：`active`（默认）| `updating`（一般不展示）
* `limit/cursor`：如需分页（通常不需要）

Response（item 示例）：

```json
{
  "id": 1,
  "name": "Hacker News",
  "category": "科技",
  "update_freq": "high",
  "description": "…",
  "homepage_url": "…",
  "feed_url": "…",
  "status": "active",
  "popularity": 12345,
  "last_item_published_at": "2026-02-06T00:00:00Z"
}
```

### 2.2 搜索源

**GET** `/sources/search`

Query:

* `q`（必填）
* `limit` 默认 20

Response：

* 返回源列表 + `match_score`（0-100）

### 2.3 获取源详情

**GET** `/sources/{source_id}`

---

## 3. 订阅（Subscriptions）

### 3.1 订阅一个源

**POST** `/subscriptions`

Body:

```json
{ "source_id": 1 }
```

说明：

* 游客：绑定到 `device_id` 对应的匿名用户
* 登录用户：绑定到 `user_id`

### 3.2 取消订阅

**DELETE** `/subscriptions/{source_id}`

### 3.3 获取我的订阅列表

**GET** `/subscriptions`

Query:

* `sort`：`recent_update`（默认）| `sub_time`

Response item 增加：

* `pinned` / `pinned_order`
* `latest_item_published_at`

### 3.4 订阅置顶（最多 3 个）

**POST** `/subscriptions/{source_id}/pin`

Body:

```json
{ "pinned": true, "pinned_order": 0 }
```

* `pinned=false` 表示取消置顶
* 服务端校验：同一用户最多 3 个置顶

---

## 4. 阅读流 & 内容（Feed / Content）

### 4.1 获取阅读流（聚合订阅源）

**GET** `/feed`

Query:

* `cursor` 可选
* `limit` 可选
* `source_id` 可选（按源筛选）
* `tag` 可选（按标签筛选，单标签）
* `time_range` 可选：`24h` | `3d` | `7d`

Response item 示例：

```json
{
  "id": 10001,
  "source": {"id": 1, "name": "Hacker News", "category": "科技"},
  "title": "…",
  "link_url": "…",
  "published_at": "2026-02-06T00:00:00Z",
  "summary": "50-80字摘要…",
  "ai_ready": true,
  "tags": ["科技", "AI"],
  "is_favorited": false,
  "quality_score": 78
}
```

### 4.2 获取内容详情

**GET** `/content/{content_id}`

Response：

* 含 `summary/tags/ai_ready/source/link_url/published_at`
* 可选返回 `content_text`（若后端已抽取；V1 可不提供）

### 4.3 获取内容可用标签列表（用于筛选）

**GET** `/tags`

Query:

* `time_range`（默认 `7d`）

Response：

* `[{"tag":"AI","count":123}]`

---

## 5. 收藏（Favorites）

### 5.1 收藏

**POST** `/favorites`

Body:

```json
{ "content_id": 10001 }
```

### 5.2 取消收藏

**DELETE** `/favorites/{content_id}`

### 5.3 收藏列表

**GET** `/favorites`

Query:

* `cursor/limit`

---

## 6. 设置（Settings）

### 6.1 获取设置

**GET** `/settings`

Response：

```json
{ "refresh_interval": 3, "summary_length": "short" }
```

### 6.2 更新设置

**PUT** `/settings`

Body:

```json
{ "refresh_interval": 1, "summary_length": "medium" }
```

---

## 7. 举报（Reports）

### 7.1 举报内容/源

**POST** `/reports`

Body:

```json
{
  "target_type": "content",
  "target_id": 10001,
  "reason": "ad",
  "detail": "可选补充"
}
```

* `target_type`: `content` | `source`
* `reason` 建议枚举：`ad` | `spam` | `copyright` | `other`

---

## 8. 埋点（Events）

### 8.1 批量上报事件

**POST** `/events/batch`

Body:

```json
[
  {
    "event_name": "feed_view",
    "ts": "2026-02-06T00:00:00Z",
    "props": {"latency_ms": 120, "ai_ready": true}
  }
]
```

服务端自动补充/覆盖：

* `platform/app_version/device_id/session_id/user_id`

---

## 9. 外链中转（Redirect）

### 9.1 获取跳转信息（可用于中转页展示）

**GET** `/redirect/{content_id}`

Response：

```json
{
  "title": "…",
  "source_name": "…",
  "link_url": "…",
  "risk_tip": "外部链接由第三方提供…"
}
```

---

## 10.（可选）认证（Auth）

> V1 可以先只做游客；若要“微信一键登录 + 云端同步”，建议按此设计，便于后续 App 扩展 Apple/Google。

### 10.1 交换 Token（微信 code → token）

**POST** `/auth/wx/login`

Body:

```json
{ "code": "wx_code" }
```

Response：

```json
{ "access_token": "…", "expires_in": 86400 }
```

### 10.2 绑定游客数据到登录用户（可合并到登录接口内部自动做）

* 规则：把匿名用户（device_id）下的订阅/收藏 merge 到登录 user_id

---

# 11. 数据库设计（MySQL 8+）

> 说明：支持“游客（device_id）”与“登录 user_id”共存；订阅/收藏统一关联到 `principal_id`（主体）。
>
> 迁移到 RN App 时，仅需新增 identity 类型与 push token 表，无需大改。

## 11.1 核心表结构（SQL）

```sql
-- 领域枚举可以用字符串，MVP 不强制建字典表

CREATE TABLE rss_source (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32) NOT NULL,
  feed_url VARCHAR(512) NOT NULL,
  homepage_url VARCHAR(512) NULL,
  update_freq ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  description VARCHAR(256) NULL,
  status ENUM('active','updating','invalid') NOT NULL DEFAULT 'active',
  last_fetch_at DATETIME NULL,
  last_item_published_at DATETIME NULL,
  fail_count INT NOT NULL DEFAULT 0,
  popularity BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_feed_url (feed_url),
  KEY idx_category (category),
  KEY idx_status (status),
  KEY idx_popularity (popularity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 主体（游客/登录用户统一抽象）
-- type: anonymous(游客) / user(登录)
CREATE TABLE principal (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('anonymous','user') NOT NULL,
  device_id VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 登录用户（可选）
CREATE TABLE app_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  principal_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_principal (principal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 身份绑定：为后续 Apple/Google/Email 预留
CREATE TABLE user_identity (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider ENUM('wx','apple','google','email','phone') NOT NULL,
  subject VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_provider_subject (provider, subject),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subscription (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  principal_id BIGINT NOT NULL,
  source_id BIGINT NOT NULL,
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  pinned_order INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_principal_source (principal_id, source_id),
  KEY idx_source_id (source_id),
  KEY idx_principal_pinned (principal_id, pinned, pinned_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE content_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  source_id BIGINT NOT NULL,
  title VARCHAR(512) NOT NULL,
  link_url VARCHAR(1024) NOT NULL,
  author VARCHAR(128) NULL,
  published_at DATETIME NOT NULL,
  guid VARCHAR(512) NULL,
  raw_summary TEXT NULL,
  content_text MEDIUMTEXT NULL,
  fingerprint CHAR(64) NULL,
  quality_score INT NOT NULL DEFAULT 0,
  is_filtered TINYINT(1) NOT NULL DEFAULT 0,
  duplicate_of_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_source_link (source_id, link_url(255)),
  KEY idx_source_published (source_id, published_at),
  KEY idx_published (published_at),
  KEY idx_duplicate (duplicate_of_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ai_result (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  content_id BIGINT NOT NULL,
  status ENUM('pending','running','success','failed') NOT NULL DEFAULT 'pending',
  summary_short VARCHAR(512) NULL,
  tags_json VARCHAR(512) NULL,
  model_name VARCHAR(64) NULL,
  cost_tokens INT NULL,
  processed_at DATETIME NULL,
  error_msg VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_content (content_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE favorite (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  principal_id BIGINT NOT NULL,
  content_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_principal_content (principal_id, content_id),
  KEY idx_principal_time (principal_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_setting (
  principal_id BIGINT PRIMARY KEY,
  refresh_interval INT NOT NULL DEFAULT 3,
  summary_length ENUM('short','medium') NOT NULL DEFAULT 'short',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE report (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  principal_id BIGINT NULL,
  target_type ENUM('content','source') NOT NULL,
  target_id BIGINT NOT NULL,
  reason ENUM('ad','spam','copyright','other') NOT NULL,
  detail VARCHAR(512) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_target (target_type, target_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_name VARCHAR(64) NOT NULL,
  principal_id BIGINT NULL,
  device_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  platform VARCHAR(16) NOT NULL,
  app_version VARCHAR(16) NOT NULL,
  ts DATETIME NOT NULL,
  props_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_event_ts (event_name, ts),
  KEY idx_device_ts (device_id, ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 为后续推送预留（App 时启用）
CREATE TABLE device_token (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  principal_id BIGINT NOT NULL,
  platform ENUM('ios','android','wx') NOT NULL,
  token VARCHAR(256) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_platform_token (platform, token),
  KEY idx_principal (principal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 11.2 关键约束说明（为什么这么设计）

* `principal` 统一主体：游客（device_id）与登录用户（user_id）都能绑定订阅/收藏/设置。
* 登录后做 merge：将匿名 principal 下的数据迁移到 user principal，并处理冲突（保留并集）。
* `subscription` 的置顶上限（≤3）由业务层校验（DB 可加触发器，但 MVP 不建议）。
* `content_item` 用 `UNIQUE(source_id, link_url)` 保证幂等；链接用 `link_url(255)` 前缀索引适配 MySQL。

---

## 12. 一期必须实现的服务端逻辑（配合表结构）

1. **RSS 抓取入库幂等**：

   * 同源同链接重复抓取不会重复写入
2. **源状态机**：

   * `fail_count` 与 `status` 变更（updating/invalid）
3. **AI 队列分级**：

   * P0：置顶源 + 热门源优先
4. **去重处理**：

   * 命中重复设置 `duplicate_of_id` 并只在 feed 查询时过滤掉重复项
5. **低质过滤**：

   * `is_filtered=1` 不出现在 feed

---

## 13. 最小可用的后台管理（可先不做 UI）

* 源的增删改查（脚本/管理接口）
* 源状态查看（active/updating/invalid）
* 举报列表查看与处理

> MVP 先用 CLI/管理接口即可，等验证通过再做后台页面。
