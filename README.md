## reairss — 微信小程序 RSS × AI 阅读助手（V1 Demo）

参见：`docs/prd1.0.md`（产品/一期最小计划）、`docs/API和DB设计.md`（接口与DB规范）、`docs/demo-baseline.md`（当前 Demo 基线与可复现联调说明）。

本地 Demo 最短路径：

- `make demo-up-fresh`
- `make demo-smoke`

仓库已补充 GitHub Actions smoke workflow：`.github/workflows/demo-smoke.yml`

## 开发说明（当前 Demo 基线）

- 开发联调入口文档：`docs/demo-baseline.md`
- 本地起后端：`make demo-up-fresh`
- 本地跑回归：`make demo-smoke`
- Docker 镜像当前按“后端 Demo 服务”构建，`.dockerignore` 已排除小程序、设计文档和本地运行态文件
- 真机联调时，`api_base_url` 不能写 `127.0.0.1`，应改成开发机局域网 IP 或测试环境地址

---

## 后端运维信息（当前部署状态）

- **服务器（Lighthouse）**：
  - **实例 ID**：`lhins-7puvqw92`
  - **地域**：`ap-shanghai`
  - **公网 IP**：`43.143.57.13`
- **服务端口**：`8000`
- **健康检查**：`http://43.143.57.13:8000/health`
- **运行方式**：Docker 容器（FastAPI + Uvicorn）
  - **容器名**：`reairss`
  - **镜像名**：`reairss:latest`
  - **重启策略**：`--restart unless-stopped`
- **代码目录**：部署包解压目录形如 `/root/reairss_YYYYMMDDHHMMSS`
  - **固定路径**：`/root/reairss` 为软链，指向当前发布版本（便于运维统一入口）
- **数据持久化（SQLite）**：
  - **宿主机目录**：`/root/reairss_data/`
  - **容器内路径**：`/data/app.db`
  - **环境变量**：`APP_DB_PATH=/data/app.db`
- **防火墙**：已放通 **TCP 8000**（用于 Demo）。

---

## 常用运维命令（在服务器上执行）

- **查看容器状态**：
  - `docker ps --filter name=reairss --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'`
- **查看日志**：
  - `docker logs -f --tail 200 reairss`
- **重启服务**：
  - `docker restart reairss`
- **停止并删除容器**：
  - `docker rm -f reairss`
- **本机健康检查**：
  - `curl -sS http://127.0.0.1:8000/health`

---

## 发布/更新后端（推荐最简流程）

> 思路：每次发布一个新目录 → 在新目录构建镜像 → 重建容器（复用同一份持久化数据目录）→ 更新 `/root/reairss` 软链。

1. 进入新发布目录（示例）：`cd /root/reairss_20260207022014`
2. 构建镜像：`docker build -t reairss:latest .`
3. 重建容器（保留数据卷）：
   - `mkdir -p /root/reairss_data`
   - `docker rm -f reairss || true`
   - `docker run -d --name reairss --restart unless-stopped -p 8000:8000 -e APP_DB_PATH=/data/app.db -v /root/reairss_data:/data reairss:latest`
4. 更新固定软链：`ln -sfn /root/reairss_20260207022014 /root/reairss`
5. 验证：`curl -sS http://127.0.0.1:8000/health`

---

## 备份与恢复（SQLite 最简）

- **备份**：打包 ` /root/reairss_data/ ` 即可（包含 `app.db`）
- **恢复**：把备份解压回 ` /root/reairss_data/ `，然后 `docker restart reairss`

---

## 微信小程序线上发布与部署方案（尽量简单）

### 方案 A（推荐）：后端单实例 + HTTPS 域名 + 小程序配置合法域名

- **目标**：小程序只走 HTTPS 请求后端，最少改动、最符合审核要求。

#### 1) 准备一个域名
- 将域名解析到服务器公网 IP（`A` 记录 → `43.143.57.13`）。

#### 2) 让后端提供 HTTPS（两种最简单选择，选其一即可）

- **选择 1：Nginx 反代 + 证书（常见方案）**
  - 对外使用 **443**，反代到容器的 `8000`。
  - 防火墙放通 **TCP 80/443**（用于签证书与访问）。

- **选择 2：Caddy 反代 + 自动签证书（更省事）**
  - Caddy 自动申请/续期 Let’s Encrypt 证书。
  - 同样对外使用 **443**，反代到 `127.0.0.1:8000`。

> 小程序强依赖 HTTPS 合法域名；生产不建议长期用 `http://IP:8000`。

#### 3) 微信公众平台配置域名
在「微信公众平台 → 小程序 → 开发 → 开发管理 → 开发设置」里配置：
- **request 合法域名**：填 `https://你的后端域名`
- （如使用 WebView）**业务域名 / webview 域名**：按实际需要再填

#### 4) 小程序端切换 API 基址
- 修改 `miniapp/utils/client.js` 中的 `BASE_URL` 为：`https://你的后端域名`

#### 5) 发布流程（最简）
- 开发版自测 → 提交体验版 → 完整走一遍闭环（订阅/阅读/详情/外链中转）
- 确认隐私合规弹窗/协议页、外链中转页符合审核要求 → 提交审核 → 发布

---

### 方案 B（更极简但不建议长期）：仅用于 Demo 联调
- 直接用 `http://43.143.57.13:8000` 联调（无需域名/HTTPS）
- **风险**：无法作为正式线上方案，且不符合小程序「request 合法域名必须 HTTPS」的要求
