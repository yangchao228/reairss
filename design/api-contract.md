# API Contract Specification - 接口契约

> 本文档定义前后端接口契约，包括请求/响应格式、字段说明、错误码、空状态处理。严格遵循 RESTful 规范。

## 1. 通用规范

### 1.1 Base URL

```
生产环境: https://api.example.com/api/v1
开发环境: https://dev-api.example.com/api/v1
本地环境: http://localhost:8000/api/v1
```

### 1.2 通用请求头（Required Headers）

所有请求必须携带以下 Headers：

```http
X-Platform: wx                    # 平台标识（wx=微信小程序）
X-App-Version: 1.0.0             # 应用版本
X-Device-Id: <uuid>              # 设备唯一标识（客户端生成并持久化）
X-Session-Id: <uuid>             # 会话ID（每次启动生成）
Content-Type: application/json   # 请求体格式
```

**可选 Headers：**

```http
Authorization: Bearer <token>    # 登录令牌（二期）
Accept-Language: zh-CN           # 语言偏好
```

### 1.3 统一响应格式

**成功响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "trace_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**错误响应**

```json
{
  "code": 40001,
  "message": "参数错误",
  "data": null,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "errors": [
    {
      "field": "source_id",
      "message": "source_id 不能为空"
    }
  ]
}
```

**字段说明**

- `code`: 业务状态码（0 表示成功）
- `message`: 状态描述信息
- `data`: 业务数据（成功时返回，失败时为 null）
- `trace_id`: 请求追踪ID（用于日志排查）
- `errors`: 详细错误信息（可选，参数校验失败时返回）

### 1.4 HTTP 状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| 200 | OK | 请求成功 |
| 201 | Created | 创建成功 |
| 204 | No Content | 删除成功（无返回内容） |
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未授权（需登录） |
| 403 | Forbidden | 禁止访问 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器错误 |
| 503 | Service Unavailable | 服务不可用 |

### 1.5 业务错误码

| Code | Message | 说明 |
|------|---------|------|
| 0 | ok | 成功 |
| 40001 | 参数错误 | 请求参数校验失败 |
| 40002 | 资源不存在 | 请求的资源未找到 |
| 40003 | 资源已存在 | 重复操作（如重复订阅） |
| 40004 | 操作失败 | 通用操作失败 |
| 40101 | 未授权 | 需要登录（二期） |
| 40301 | 禁止访问 | 权限不足 |
| 42901 | 请求过于频繁 | 触发限流 |
| 50001 | 服务器错误 | 内部错误 |
| 50002 | 数据库错误 | 数据库操作失败 |
| 50003 | 外部服务错误 | 第三方服务调用失败 |

### 1.6 分页规范

**游标分页（Cursor-based Pagination）**

适用于时间流数据（如 Feed）

**请求参数**

```typescript
{
  cursor?: string;   // 游标（空表示从最新开始）
  limit?: number;    // 每页数量，默认 20，最大 50
}
```

**响应格式**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [...],
    "next_cursor": "eyJwdWJsaXNoZWRfYXQiOiIyMDI0LTAxLTAxVDAwOjAwOjAwWiIsImlkIjoxMjN9",
    "has_more": true
  }
}
```

**游标生成规则**

```
cursor = base64({
  "published_at": "2024-01-01T00:00:00Z",
  "id": 123
})
```

---

## 2. 接口清单

### 2.1 健康检查

**接口**

```
GET /health
```

**描述**
检查服务健康状态

**请求参数**
无

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2.2 源库相关

#### 2.2.1 获取源列表

**接口**

```
GET /sources
```

**描述**
获取 RSS 源列表，支持分类和排序

**请求参数**

```typescript
interface SourcesQuery {
  category?: string;        // 分类筛选（可选）
  sort?: 'hot' | 'alpha';  // 排序方式：hot=热度，alpha=字母
  page?: number;            // 页码（从 1 开始）
  limit?: number;           // 每页数量，默认 20
}
```

**示例**

```
GET /sources?category=科技&sort=hot&page=1&limit=20
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "TechCrunch",
        "category": "科技",
        "feed_url": "https://techcrunch.com/feed/",
        "homepage_url": "https://techcrunch.com",
        "description": "科技新闻和创业资讯",
        "popularity": 8500,
        "status": "active",
        "subscribed": false,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 源ID |
| name | string | 源名称 |
| category | string | 分类 |
| feed_url | string | RSS 订阅地址 |
| homepage_url | string | 主页地址 |
| description | string | 简介 |
| popularity | number | 热度值（订阅人数） |
| status | string | 状态：active/inactive/invalid |
| subscribed | boolean | 当前用户是否已订阅 |
| created_at | string | 创建时间（ISO 8601） |

**状态码**

- 200: 成功
- 400: 参数错误

---

#### 2.2.2 搜索源

**接口**

```
GET /sources/search
```

**描述**
按关键词搜索 RSS 源

**请求参数**

```typescript
interface SearchQuery {
  q: string;       // 搜索关键词（必需）
  limit?: number;  // 返回数量，默认 20
}
```

**示例**

```
GET /sources/search?q=react&limit=10
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 2,
        "name": "React Blog",
        "category": "技术",
        "feed_url": "https://react.dev/feed.xml",
        "homepage_url": "https://react.dev",
        "description": "React 官方博客",
        "popularity": 5200,
        "status": "active",
        "subscribed": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 5,
    "keyword": "react"
  }
}
```

**搜索范围**

- 源名称（name）
- 简介（description）
- 分类（category）

**状态码**

- 200: 成功
- 400: 参数错误（缺少关键词）

**空结果处理**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0,
    "keyword": "不存在的关键词"
  }
}
```

---

#### 2.2.3 获取源详情（可选）

**接口**

```
GET /sources/{source_id}
```

**描述**
获取单个源的详细信息

**路径参数**

- `source_id`: 源ID

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "name": "TechCrunch",
    "category": "科技",
    "feed_url": "https://techcrunch.com/feed/",
    "homepage_url": "https://techcrunch.com",
    "description": "科技新闻和创业资讯的领先媒体",
    "popularity": 8500,
    "status": "active",
    "update_freq": "high",
    "last_fetch_at": "2024-01-01T12:00:00Z",
    "last_item_published_at": "2024-01-01T11:30:00Z",
    "subscribed": false,
    "subscriber_count": 8500,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**状态码**

- 200: 成功
- 404: 源不存在

---

#### 2.2.4 获取分类列表

**接口**

```
GET /sources/categories
```

**描述**
获取所有可用分类

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "categories": [
      {
        "name": "科技",
        "count": 45
      },
      {
        "name": "技术",
        "count": 38
      },
      {
        "name": "设计",
        "count": 22
      },
      {
        "name": "商业",
        "count": 31
      }
    ]
  }
}
```

---

### 2.3 订阅相关

#### 2.3.1 订阅源

**接口**

```
POST /subscriptions
```

**描述**
订阅一个 RSS 源

**请求体**

```json
{
  "source_id": 1
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "订阅成功",
  "data": {
    "id": 100,
    "device_id": "550e8400-e29b-41d4-a716-446655440000",
    "source_id": 1,
    "source": {
      "id": 1,
      "name": "TechCrunch",
      "category": "科技"
    },
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**状态码**

- 201: 创建成功
- 400: 参数错误
- 40003: 已订阅该源

**错误示例**

```json
{
  "code": 40003,
  "message": "资源已存在",
  "data": null,
  "errors": [
    {
      "field": "source_id",
      "message": "已订阅该源"
    }
  ]
}
```

**幂等性**

- 重复订阅返回 40003 错误
- 客户端应检查 code 并提示用户

---

#### 2.3.2 取消订阅

**接口**

```
DELETE /subscriptions/{source_id}
```

**描述**
取消订阅指定源

**路径参数**

- `source_id`: 源ID

**响应示例**

```json
{
  "code": 0,
  "message": "已取消订阅",
  "data": null
}
```

**状态码**

- 200: 成功
- 404: 未订阅该源

**错误示例**

```json
{
  "code": 40002,
  "message": "资源不存在",
  "data": null
}
```

---

#### 2.3.3 获取订阅列表

**接口**

```
GET /subscriptions
```

**描述**
获取当前设备的所有订阅

**请求参数**

```typescript
interface SubscriptionsQuery {
  page?: number;   // 页码，默认 1
  limit?: number;  // 每页数量，默认 20
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 100,
        "source": {
          "id": 1,
          "name": "TechCrunch",
          "category": "科技",
          "description": "科技新闻和创业资讯",
          "feed_url": "https://techcrunch.com/feed/",
          "homepage_url": "https://techcrunch.com",
          "status": "active"
        },
        "created_at": "2024-01-01T12:00:00Z"
      },
      {
        "id": 101,
        "source": {
          "id": 2,
          "name": "React Blog",
          "category": "技术",
          "description": "React 官方博客",
          "feed_url": "https://react.dev/feed.xml",
          "homepage_url": "https://react.dev",
          "status": "active"
        },
        "created_at": "2024-01-01T11:00:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20
  }
}
```

**排序规则**

- 按订阅时间倒序（最新订阅在前）

**空状态处理**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2.4 阅读流相关

#### 2.4.1 获取 Feed 流

**接口**

```
GET /feed
```

**描述**
获取聚合内容流，支持时间范围筛选和按源筛选

**请求参数**

```typescript
interface FeedQuery {
  cursor?: string;                      // 游标（可选）
  limit?: number;                       // 每页数量，默认 20，最大 50
  source_id?: number;                   // 按源筛选（可选）
  time_range?: '24h' | '3d' | '7d';    // 时间范围（可选）
}
```

**示例**

```
GET /feed?time_range=24h&limit=20
GET /feed?source_id=1&cursor=xxx&limit=20
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": 1001,
        "source": {
          "id": 1,
          "name": "TechCrunch",
          "category": "科技"
        },
        "title": "人工智能如何改变软件开发的未来",
        "link_url": "https://techcrunch.com/2024/01/01/ai-future/",
        "author": "John Doe",
        "published_at": "2024-01-01T10:00:00Z",
        "raw_summary": "AI 正在快速改变软件开发的方式，从代码生成到自动化测试，开发者的工作流程正在经历根本性的变革...",
        "created_at": "2024-01-01T10:05:00Z"
      },
      {
        "id": 1002,
        "source": {
          "id": 2,
          "name": "React Blog",
          "category": "技术"
        },
        "title": "React 19 新特性深度解析：并发渲染的突破",
        "link_url": "https://react.dev/blog/2024/01/01/react-19",
        "author": null,
        "published_at": "2024-01-01T09:30:00Z",
        "raw_summary": "React 团队发布了 19 版本的重要更新，带来了革命性的并发渲染特性和全新的 Hooks API...",
        "created_at": "2024-01-01T09:35:00Z"
      }
    ],
    "next_cursor": "eyJwdWJsaXNoZWRfYXQiOiIyMDI0LTAxLTAxVDA5OjMwOjAwWiIsImlkIjoxMDAyfQ==",
    "has_more": true
  }
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 内容ID |
| source | object | 来源信息 |
| source.id | number | 源ID |
| source.name | string | 源名称 |
| source.category | string | 源分类 |
| title | string | 标题 |
| link_url | string | 原文链接 |
| author | string\|null | 作者（可能为空） |
| published_at | string | 发布时间（ISO 8601） |
| raw_summary | string | 原始摘要 |
| created_at | string | 入库时间 |

**时间范围说明**

- `24h`: 最近 24 小时
- `3d`: 最近 3 天
- `7d`: 最近 7 天
- 不传：不限制时间范围

**排序规则**

- 按发布时间（published_at）倒序
- 同一时间按 ID 倒序

**空状态处理**

**场景1：无订阅**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "next_cursor": null,
    "has_more": false,
    "empty_reason": "no_subscription"
  }
}
```

**场景2：有订阅但无内容**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "next_cursor": null,
    "has_more": false,
    "empty_reason": "no_content"
  }
}
```

**状态码**

- 200: 成功
- 400: 参数错误

---

#### 2.4.2 获取内容详情

**接口**

```
GET /content/{content_id}
```

**描述**
获取单条内容的详细信息

**路径参数**

- `content_id`: 内容ID

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1001,
    "source": {
      "id": 1,
      "name": "TechCrunch",
      "category": "科技",
      "homepage_url": "https://techcrunch.com"
    },
    "title": "人工智能如何改变软件开发的未来",
    "link_url": "https://techcrunch.com/2024/01/01/ai-future/",
    "author": "John Doe",
    "published_at": "2024-01-01T10:00:00Z",
    "raw_summary": "AI 正在快速改变软件开发的方式，从代码生成到自动化测试，开发者的工作流程正在经历根本性的变革。这篇文章将深入探讨 AI 对软件开发各个环节的影响...",
    "guid": "https://techcrunch.com/?p=123456",
    "created_at": "2024-01-01T10:05:00Z"
  }
}
```

**状态码**

- 200: 成功
- 404: 内容不存在

**错误示例**

```json
{
  "code": 40002,
  "message": "资源不存在",
  "data": null
}
```

---

### 2.5 中转相关

#### 2.5.1 获取跳转信息

**接口**

```
GET /redirect/{content_id}
```

**描述**
获取外链跳转信息，用于中转页显示

**路径参数**

- `content_id`: 内容ID

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "content_id": 1001,
    "url": "https://techcrunch.com/2024/01/01/ai-future/",
    "domain": "techcrunch.com",
    "source_name": "TechCrunch",
    "title": "人工智能如何改变软件开发的未来",
    "warning": "即将访问外部网站，请注意保护个人信息和财产安全"
  }
}
```

**字段说明**

- `url`: 目标 URL（完整链接）
- `domain`: 域名（用于显示）
- `source_name`: 来源名称
- `title`: 内容标题
- `warning`: 风险提示文案（后端可配置）

**状态码**

- 200: 成功
- 404: 内容不存在

**安全性**

- URL 不能通过 query 参数传递
- 必须通过 API 获取
- 客户端不能缓存 URL

---

## 3. 数据模型

### 3.1 Source（RSS 源）

```typescript
interface Source {
  id: number;
  name: string;
  category: string;
  feed_url: string;
  homepage_url: string;
  description: string;
  popularity: number;
  status: 'active' | 'inactive' | 'invalid';
  update_freq: 'high' | 'medium' | 'low';
  last_fetch_at: string | null;
  last_item_published_at: string | null;
  created_at: string;
  updated_at: string;
  // 扩展字段（列表接口返回）
  subscribed?: boolean;
}
```

### 3.2 Subscription（订阅）

```typescript
interface Subscription {
  id: number;
  device_id: string;
  source_id: number;
  source: Source;
  created_at: string;
}
```

### 3.3 ContentItem（内容）

```typescript
interface ContentItem {
  id: number;
  source_id: number;
  source: {
    id: number;
    name: string;
    category: string;
  };
  title: string;
  link_url: string;
  author: string | null;
  published_at: string;
  raw_summary: string;
  guid: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 4. 错误处理规范

### 4.1 参数校验错误

**场景**：缺少必填参数、参数格式错误

**响应示例**

```json
{
  "code": 40001,
  "message": "参数错误",
  "data": null,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "errors": [
    {
      "field": "source_id",
      "message": "source_id 必须是正整数"
    },
    {
      "field": "limit",
      "message": "limit 不能超过 50"
    }
  ]
}
```

**客户端处理**

```javascript
if (response.code === 40001) {
  // 显示第一个错误
  const firstError = response.errors[0];
  wx.showToast({
    title: firstError.message,
    icon: 'none'
  });
}
```

### 4.2 资源不存在

**场景**：请求的资源未找到

**响应示例**

```json
{
  "code": 40002,
  "message": "资源不存在",
  "data": null
}
```

**客户端处理**

```javascript
if (response.code === 40002) {
  wx.showToast({
    title: '内容不存在',
    icon: 'none'
  });
  setTimeout(() => {
    wx.navigateBack();
  }, 1500);
}
```

### 4.3 资源已存在

**场景**：重复订阅

**响应示例**

```json
{
  "code": 40003,
  "message": "资源已存在",
  "data": null
}
```

**客户端处理**

```javascript
if (response.code === 40003) {
  wx.showToast({
    title: '已订阅该源',
    icon: 'none'
  });
}
```

### 4.4 请求限流

**场景**：请求过于频繁

**响应示例**

```json
{
  "code": 42901,
  "message": "请求过于频繁，请稍后再试",
  "data": null,
  "retry_after": 60
}
```

**客户端处理**

```javascript
if (response.code === 42901) {
  wx.showToast({
    title: '请求过于频繁',
    icon: 'none'
  });
  // 禁用按钮 60 秒
  this.setData({ disabled: true });
  setTimeout(() => {
    this.setData({ disabled: false });
  }, response.retry_after * 1000);
}
```

### 4.5 服务器错误

**场景**：后端异常

**响应示例**

```json
{
  "code": 50001,
  "message": "服务器错误，请稍后重试",
  "data": null,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**客户端处理**

```javascript
if (response.code >= 50000) {
  wx.showToast({
    title: '服务异常，请稍后重试',
    icon: 'none'
  });
  // 记录错误日志（包含 trace_id）
  console.error('Server Error:', response.trace_id);
}
```

---

## 5. 空状态处理

### 5.1 Feed 流空状态

**场景1：无订阅**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "next_cursor": null,
    "has_more": false,
    "empty_reason": "no_subscription"
  }
}
```

**客户端处理**

```javascript
if (data.items.length === 0) {
  if (data.empty_reason === 'no_subscription') {
    // 显示"去找源"引导
    this.setData({
      emptyType: 'no_subscription',
      emptyTitle: '还没有订阅源',
      emptyDesc: '去找源页面订阅感兴趣的内容',
      emptyAction: '去找源'
    });
  }
}
```

**场景2：有订阅但无内容**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "next_cursor": null,
    "has_more": false,
    "empty_reason": "no_content"
  }
}
```

**客户端处理**

```javascript
if (data.empty_reason === 'no_content') {
  this.setData({
    emptyType: 'no_content',
    emptyTitle: '暂无更新',
    emptyDesc: '订阅的源还没有新内容',
    emptyAction: null  // 无操作按钮
  });
}
```

### 5.2 搜索无结果

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0,
    "keyword": "不存在的关键词"
  }
}
```

**客户端处理**

```javascript
if (data.items.length === 0) {
  this.setData({
    emptyType: 'no_result',
    emptyTitle: '未找到相关源',
    emptyDesc: '试试其他关键词'
  });
}
```

### 5.3 订阅列表为空

**响应**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0
  }
}
```

**客户端处理**

```javascript
if (data.items.length === 0) {
  this.setData({
    emptyType: 'no_subscription',
    emptyTitle: '还没有订阅',
    emptyDesc: '去找源页面订阅感兴趣的内容',
    emptyAction: '去找源'
  });
}
```

---

## 6. 客户端请求封装

### 6.1 统一请求封装

```javascript
// utils/request.js
const BASE_URL = 'https://api.example.com/api/v1';

function getHeaders() {
  return {
    'X-Platform': 'wx',
    'X-App-Version': '1.0.0',
    'X-Device-Id': wx.getStorageSync('device_id'),
    'X-Session-Id': wx.getStorageSync('session_id'),
    'Content-Type': 'application/json'
  };
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: getHeaders(),
      success: (res) => {
        const { code, message, data } = res.data;
        
        if (code === 0) {
          resolve(data);
        } else {
          // 业务错误
          wx.showToast({
            title: message || '操作失败',
            icon: 'none'
          });
          reject({ code, message, data });
        }
      },
      fail: (err) => {
        // 网络错误
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

export default {
  get: (url, data) => request({ url, data, method: 'GET' }),
  post: (url, data) => request({ url, data, method: 'POST' }),
  put: (url, data) => request({ url, data, method: 'PUT' }),
  delete: (url) => request({ url, method: 'DELETE' })
};
```

### 6.2 API 调用示例

```javascript
// api/feed.js
import request from '../utils/request';

export default {
  // 获取 Feed 流
  getFeed(params) {
    return request.get('/feed', params);
  },
  
  // 获取内容详情
  getContent(id) {
    return request.get(`/content/${id}`);
  },
  
  // 获取跳转信息
  getRedirect(id) {
    return request.get(`/redirect/${id}`);
  }
};

// 使用
import feedApi from '../../api/feed';

Page({
  async loadFeed() {
    try {
      const data = await feedApi.getFeed({
        time_range: '24h',
        limit: 20
      });
      this.setData({ items: data.items });
    } catch (error) {
      console.error('加载失败:', error);
    }
  }
});
```

---

## 7. 性能优化建议

### 7.1 请求优化

**防抖/节流**

```javascript
// 搜索防抖
let searchTimer = null;
function onSearchInput(e) {
  const keyword = e.detail.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    this.searchSources(keyword);
  }, 300);
}
```

**请求缓存**

```javascript
const cache = new Map();

function getCachedData(key, fetcher, ttl = 300000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }
  
  return fetcher().then(data => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  });
}

// 使用
const data = await getCachedData(
  'sources_tech',
  () => sourceApi.getSources({ category: '科技' }),
  5 * 60 * 1000  // 5 分钟缓存
);
```

### 7.2 分页优化

**预加载下一页**

```javascript
onReachBottom() {
  if (this.data.loading || !this.data.has_more) return;
  
  this.setData({ loading: true });
  this.loadMore();
}
```

**游标分页**

```javascript
async loadMore() {
  const data = await feedApi.getFeed({
    cursor: this.data.next_cursor,
    limit: 20
  });
  
  this.setData({
    items: [...this.data.items, ...data.items],
    next_cursor: data.next_cursor,
    has_more: data.has_more,
    loading: false
  });
}
```

---

## 8. 测试用例

### 8.1 正常流程测试

```javascript
// 订阅流程
describe('订阅流程', () => {
  test('成功订阅', async () => {
    const res = await request.post('/subscriptions', {
      source_id: 1
    });
    expect(res.code).toBe(0);
    expect(res.data.source_id).toBe(1);
  });
  
  test('重复订阅', async () => {
    try {
      await request.post('/subscriptions', {
        source_id: 1
      });
    } catch (error) {
      expect(error.code).toBe(40003);
    }
  });
  
  test('取消订阅', async () => {
    const res = await request.delete('/subscriptions/1');
    expect(res.code).toBe(0);
  });
});
```

### 8.2 异常场景测试

```javascript
// 参数错误
test('缺少必填参数', async () => {
  try {
    await request.post('/subscriptions', {});
  } catch (error) {
    expect(error.code).toBe(40001);
    expect(error.errors).toBeDefined();
  }
});

// 资源不存在
test('获取不存在的内容', async () => {
  try {
    await request.get('/content/999999');
  } catch (error) {
    expect(error.code).toBe(40002);
  }
});
```

---

## 9. 开发检查清单

### 9.1 接口实现

- [ ] 所有接口返回统一格式
- [ ] HTTP 状态码使用正确
- [ ] 业务错误码定义清晰
- [ ] 错误信息友好易懂
- [ ] trace_id 正确生成

### 9.2 参数校验

- [ ] 必填参数校验
- [ ] 参数类型校验
- [ ] 参数范围校验
- [ ] 返回详细错误信息

### 9.3 数据处理

- [ ] 分页逻辑正确
- [ ] 游标生成正确
- [ ] 空状态正确返回
- [ ] 数据排序正确

### 9.4 客户端集成

- [ ] 请求头正确携带
- [ ] 错误处理完善
- [ ] 加载状态显示
- [ ] 空状态处理
- [ ] 重试机制

---

## 附录

### A. 时间格式规范

所有时间字段使用 ISO 8601 格式：

```
2024-01-01T12:00:00Z  // UTC 时间
2024-01-01T12:00:00+08:00  // 带时区
```

客户端处理：

```javascript
// 格式化显示
function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return `${Math.floor(diff / 86400000)}天前`;
  }
}
```

### B. 游标编码/解码

```javascript
// 编码
function encodeCursor(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// 解码
function decodeCursor(cursor) {
  return JSON.parse(Buffer.from(cursor, 'base64').toString());
}

// 使用
const cursor = encodeCursor({
  published_at: '2024-01-01T00:00:00Z',
  id: 123
});
```

### C. 常见问题

**Q: 为什么使用游标分页而不是页码分页？**
A: 游标分页在数据实时更新时更稳定，避免重复或遗漏数据。

**Q: trace_id 如何生成？**
A: 使用 UUID v4，后端在接收请求时生成。

**Q: 如何处理网络超时？**
A: 客户端设置合理超时（如 10 秒），提供重试选项。

**Q: API 版本如何管理？**
A: 通过 URL 路径（/api/v1），确保向后兼容。
