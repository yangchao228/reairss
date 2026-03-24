# Task Plan: Demo 后端接口落地与前后端联调

## Goal
基于现有小程序原型，补齐一期 Demo 所需的后端核心 API 与演示数据，并让 `miniapp/` 从本地 mock 切到真实接口联调。

## Phases
- [x] Phase 1: Plan and setup
- [x] Phase 2: Research/gather information
- [x] Phase 3: Execute/build
- [x] Phase 4: Review and deliver

## Key Questions
1. 在没有真实 RSS 抓取任务的前提下，是否需要自动注入演示数据以保证 API 可直接联调？
2. 小程序切换到真实 API 时，是否应尽量保持当前页面数据结构不变，避免大规模 UI 改动？

## Decisions Made
- 先实现一期最小业务接口：`/api/v1/sources`、`/api/v1/sources/search`、`/api/v1/subscriptions`、`/api/v1/feed`、`/api/v1/content/{id}`。
- 保留根路径 `/health`，业务接口统一走 `settings.API_PREFIX`。
- 为了让 Demo 可直接运行，服务启动时若数据库为空则自动注入一批演示源和内容。
- 小程序端优先兼容现有页面字段，减少改动面；必要时在请求层做字段映射。

## Errors Encountered
- 本地 Python 环境缺少 `fastapi/uvicorn`：宿主 Python 3.14 下安装依赖需要编译 `pydantic-core`，因此改用 Dockerfile 内的 Python 3.11 路径完成运行验证。
- `app/core/trace.py` 初版错误地从 `typing` 导入 `Token`：已改为从 `contextvars` 导入，并通过 Docker 运行验证。

## Status
**Done** - 已完成后端接口、演示数据、小程序请求层改造、Demo 基线文档与可执行 smoke 脚本，并通过 Docker 对健康检查、源列表、订阅、Feed、详情、跳转、分页与重复订阅错误做了真实验证。
