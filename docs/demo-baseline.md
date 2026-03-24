# Demo 联调基线与复现说明

## 1. 文档目的

本文用于固定当前仓库的 `Demo 联调版` 基线，方便后续开发、联调和验收时统一口径。

当前基线对应的项目状态是：

- 小程序主要页面和交互已经齐备，且页面数据优先请求真实 `/api/v1`，失败时再 fallback 本地 mock。
- 后端已经具备一期 Demo 最小业务链路：`sources -> subscriptions -> feed -> content -> redirect`。
- SQLite 初始化和 Demo 数据 seed 已接入，空库启动即可联调。
- 统一响应体和 `trace_id` 已接入。

本文不覆盖正式上线所需内容，例如真实 RSS 抓取、AI 摘要/标签、登录、收藏、举报、埋点、正式 HTTPS 域名、小程序审核合规页。

## 2. 当前 Demo 基线

### 2.1 前端范围

当前小程序可联调的核心页面包括：

- `阅读`：`miniapp/pages/feed/index.js`
- `找源`：`miniapp/pages/discover/index.js`
- `订阅`：`miniapp/pages/subscriptions/index.js`
- `详情`：`miniapp/pages/content/index.js`
- `中转`：`miniapp/pages/redirect/index.js`
- `WebView`：`miniapp/pages/webview/index.js`

请求层入口：

- `miniapp/utils/client.js`
- `miniapp/utils/api.js`

联调行为约定：

- 默认从本地存储读取 `api_base_url`。
- 若未配置，则默认请求 `http://127.0.0.1:8000`。
- 若真实请求失败，页面会 fallback 到本地 mock 数据。

这意味着：如果要验证真实后端，必须把 `api_base_url` 配成当前设备可访问的地址，而不是依赖默认值。

### 2.2 后端范围

当前后端已提供的 Demo API：

- `GET /health`
- `GET /api/v1/sources`
- `GET /api/v1/sources/search`
- `GET /api/v1/subscriptions`
- `POST /api/v1/subscriptions`
- `DELETE /api/v1/subscriptions/{source_id}`
- `GET /api/v1/feed`
- `GET /api/v1/content/{content_id}`
- `GET /api/v1/redirect/{content_id}`

核心实现入口：

- `app/main.py`
- `app/api/routes/sources.py`
- `app/api/routes/subscriptions.py`
- `app/api/routes/feed.py`
- `app/api/routes/content.py`
- `app/core/response.py`
- `app/core/trace.py`
- `app/db/init.py`
- `app/db/seed.py`

运行约定：

- API 前缀固定为 `/api/v1`。
- 统一响应格式为 `{ code, message, data, trace_id }`。
- 订阅主体通过请求头 `X-Device-Id` 标识。
- 数据库路径由环境变量 `APP_DB_PATH` 控制，默认值为 `./data/app.db`。

### 2.3 Demo 数据基线

为了保证“空库即可联调”，启动时会自动执行数据库初始化；如果库中没有数据，则自动写入 Demo 数据：

- `5` 个 Demo 源
- `60` 条 Demo 内容

当前 seed 行为来自 `app/db/seed.py`，其中 Demo 源包括：

- `Hacker News`
- `The Verge`
- `BBC World`
- `NYT Technology`
- `Indie Hackers`

注意：

- seed 只在表为空时执行。
- 如果你希望复现和本文一致的联调结果，应使用一个全新的 SQLite 文件，或删除旧的 `app.db` 后重新启动。

### 2.4 当前不纳入基线的内容

- 真实 RSS 抓取和定时入库
- AI 摘要、AI 标签
- 登录、收藏、举报、埋点
- 正式部署、HTTPS、合法域名、审核收尾

工作区里当前还有一组 TopBar UI 本地修改：

- `miniapp/app.wxss`
- `miniapp/components/topbar/topbar.wxml`
- `miniapp/components/topbar/topbar.wxss`

这组修改不影响本文定义的后端联调链路，不作为本次 Demo 基线的验收点。

## 3. 本地启动后端

### 3.1 推荐方式：Docker

当前仓库最稳妥的本地复现方式是直接使用根目录 `Dockerfile`，因为宿主 Python 环境未必已经安装 `FastAPI/Uvicorn` 依赖。

如果你只想用一条命令起服务，直接执行：

```bash
./scripts/run_demo_backend.sh --fresh
```

或者直接用 `Makefile` 入口：

```bash
make demo-up-fresh
```

这个脚本会完成下面几件事：

- 使用仓库根目录 `Dockerfile` 构建 `reairss-demo`
- 默认把 SQLite 数据挂到 `/tmp/reairss-demo-data`
- `--fresh` 时删除旧的 `app.db`，确保回到空库 seed 基线
- 如果同名容器已存在，先删掉旧容器再启动新实例
- Docker 构建上下文按“后端 Demo 服务”收敛，`.dockerignore` 已排除小程序、设计文档和本地运行态文件

服务启动成功后，默认监听：

```text
http://127.0.0.1:8000
```

如果你想手动执行，等价步骤如下：

```bash
docker build -t reairss-demo .
mkdir -p /tmp/reairss-demo-data
rm -f /tmp/reairss-demo-data/app.db
docker run --rm --name reairss-demo \
  -p 8000:8000 \
  -e APP_DB_PATH=/data/app.db \
  -v /tmp/reairss-demo-data:/data \
  reairss-demo
```

### 3.2 可选方式：本机 Python

如果本机已经安装依赖，也可以直接运行：

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

但当前仓库的实际可复现基线，仍以 Docker 路径为准。

## 4. API Smoke 验证

下面这组步骤用于验证当前 Demo 主链路已经打通。

如果你只想跑一条标准回归命令，可以直接执行：

```bash
python3 scripts/demo_smoke.py --base-url http://127.0.0.1:8000
```

或者通过 `Makefile`：

```bash
make demo-smoke
```

这条脚本会自动完成：

- 健康检查
- 源列表校验
- 订阅清理与重新创建
- 订阅列表校验
- feed 首屏与下一页游标校验
- 详情与中转校验
- 重复订阅错误校验

脚本默认会生成一个临时 `device_id`，避免多次执行时被历史订阅状态污染；如果你需要固定某个设备身份再回归，可以额外传：

```bash
python3 scripts/demo_smoke.py \
  --base-url http://127.0.0.1:8000 \
  --device-id demo-device
```

下面保留手工版步骤，方便单独排查某一环。

### 4.1 健康检查

```bash
curl -sS http://127.0.0.1:8000/health
```

预期：

- HTTP `200`
- `code=0`
- `data.status=healthy`

### 4.2 源列表

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  http://127.0.0.1:8000/api/v1/sources
```

预期：

- HTTP `200`
- 返回 `5` 个 Demo 源
- 所有项默认 `subscribed=false`

### 4.3 创建订阅

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  -H 'Content-Type: application/json' \
  -X POST \
  http://127.0.0.1:8000/api/v1/subscriptions \
  -d '{"source_id":1}'
```

预期：

- HTTP `200`
- `code=0`
- `message=subscribed`

### 4.4 订阅列表

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  http://127.0.0.1:8000/api/v1/subscriptions
```

预期：

- HTTP `200`
- 至少返回刚订阅的 `source_id=1`

### 4.5 阅读流与分页游标

第一页：

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  'http://127.0.0.1:8000/api/v1/feed?time_range=7d&limit=5'
```

预期：

- HTTP `200`
- `items` 长度为 `5`
- `has_more=true`
- 返回非空 `next_cursor`

把上一步响应保存下来，取出 `next_cursor`：

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  'http://127.0.0.1:8000/api/v1/feed?time_range=7d&limit=5' \
  > /tmp/reairss-feed-page1.json

python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path('/tmp/reairss-feed-page1.json').read_text())
print(payload['data']['next_cursor'])
PY
```

第二页：

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  'http://127.0.0.1:8000/api/v1/feed?time_range=7d&limit=5&cursor=<替换为上一步输出的 next_cursor>'
```

预期：

- HTTP `200`
- 仍能正常返回后续内容
- 第二页内容与第一页不重复

### 4.6 详情与中转

建议直接使用阅读流第一条内容的 `id` 继续验证。

详情：

```bash
curl -sS http://127.0.0.1:8000/api/v1/content/<content_id>
```

中转：

```bash
curl -sS http://127.0.0.1:8000/api/v1/redirect/<content_id>
```

预期：

- HTTP `200`
- `/content/{id}` 返回标题、摘要、来源信息
- `/redirect/{id}` 返回原始外链和域名

### 4.7 重复订阅错误

再次提交同一个 `source_id`：

```bash
curl -sS \
  -H 'X-Device-Id: demo-device' \
  -H 'Content-Type: application/json' \
  -X POST \
  http://127.0.0.1:8000/api/v1/subscriptions \
  -d '{"source_id":1}'
```

预期：

- HTTP `409`
- 响应体 `code=40003`
- `message=已订阅该源`

## 5. 小程序联调步骤

### 5.1 打开项目

用微信开发者工具打开仓库根目录即可，当前配置已经指定：

- `miniprogramRoot = miniapp/`

对应配置文件：

- `project.config.json`

### 5.2 配置真实 API 地址

当前没有专门的“切环境”页面，联调时请直接写入小程序本地存储。

在微信开发者工具控制台执行：

```javascript
wx.setStorageSync('api_base_url', 'http://127.0.0.1:8000')
```

然后重新编译或重新启动小程序。

注意：

- 在开发者工具模拟器里，`127.0.0.1` 指当前开发机。
- 在真机里，`127.0.0.1` 指手机本机，不能访问你电脑上的服务。
- 如果要做真机联调，请把地址改成开发机局域网 IP 或测试环境地址，例如 `http://192.168.x.x:8000`。

如果你希望恢复“请求失败即 fallback mock”的默认行为，可以删除这个存储项：

```javascript
wx.removeStorageSync('api_base_url')
```

### 5.3 小程序侧主链路验收

建议按下面顺序走一遍：

1. 打开 `找源` 页面，确认源列表能正常返回。
2. 订阅任意一个源，例如 `Hacker News`。
3. 切到 `订阅` 页面，确认已订阅源出现。
4. 切到 `阅读` 页面，确认阅读流出现真实内容。
5. 打开任意一条内容，进入 `详情` 页面。
6. 从 `详情` 进入 `中转` / `WebView`，确认外链信息可继续流转。

如果这条链路可以完整走通，就说明当前 Demo 联调基线成立。

## 6. 已验证记录

本次在当前工作区已完成的验证包括：

- `python3 -m compileall app`
- 基于仓库 `Dockerfile` 的容器化启动
- `GET /health`
- `GET /api/v1/sources`
- `GET /api/v1/subscriptions`
- `POST /api/v1/subscriptions`
- `GET /api/v1/feed`
- `GET /api/v1/content/{id}`
- `GET /api/v1/redirect/{id}`
- feed 分页游标
- 重复订阅错误返回 `409 / 40003`

其中，容器内实测结果确认：

- 首次订阅返回 `200 / code=0 / message=subscribed`
- `time_range=7d&limit=5` 的 feed 首屏可返回 `5` 条内容且 `has_more=true`
- 重复订阅返回 `409 / code=40003 / 已订阅该源`

## 7. 下一阶段不应混淆的事项

后续如果继续推进，请不要把下面这些工作和“当前 Demo 基线已稳定”混为一谈：

- 接入真实 RSS 抓取任务
- 做正式部署和 HTTPS
- 配小程序 request 合法域名 / WebView 业务域名
- 增补隐私协议、用户协议、审核合规页
- 上线前测试、收尾和发布
