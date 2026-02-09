# Task Plan: Notion 风小程序前端原型

## Goal
基于 `docs/ui-miniapp-notion.md` 在 `miniapp/` 产出可运行的微信小程序前端原型（含浅色/暗色、底部 Tab、核心页面与基础交互），使用本地 mock 数据，不依赖后端即可演示。

## Phases
- [x] Phase 1: Plan and setup
- [x] Phase 2: Research/gather information
- [x] Phase 3: Execute/build
- [x] Phase 4: Review and deliver

## Key Questions
1. 目标“原型”是否要求完全对齐 PRD 的接口与数据结构，还是只需 UI/交互可演示？
2. 主题切换采用 CSS 变量方案是否满足小程序基础库要求（不满足则降级为两套 class）？

## Decisions Made
- 使用微信小程序原生 `wxml/wxss/js` 在 `miniapp/` 实现：仓库已有 `miniapp/utils/client.js`，但原型阶段改用本地 mock 数据以减少依赖。
- 主题 Token 用语义变量（优先 CSS 变量），并在“我的”页提供 跟随系统/浅色/暗色 单选。
- TabBar 图标先用透明占位图，保证“底部 Tab + 文本”原型可跑通；后续可替换为正式图标资源。

## Errors Encountered
- (none yet)

## Status
**Done** - 已在 `miniapp/` 提供可运行的前端原型与说明文档。
