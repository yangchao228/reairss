# 小程序前端原型（Notion 风）

基于 `docs/ui-miniapp-notion.md` 的 UI 规格，在 `miniapp/` 实现了可运行的微信小程序原型（本地 mock 数据，不依赖后端）。

## 如何打开

1. 用微信开发者工具打开仓库根目录（已提供 `project.config.json`）。
2. 确保项目设置中 `miniprogramRoot` 为 `miniapp/`（已在配置里写好）。
3. 运行后即可看到底部 Tab：阅读 / 找源 / 订阅 / 我的。

## 已实现页面

- 阅读（Feed）：时间范围 Chip（24h/3d/7d）、列表、下拉刷新（mock）、触底加载更多（mock）、按源筛选展示与清除
- 找源（Discover）：搜索框、分类 Chip（横向滚动）、订阅/取消订阅
- 订阅（Subscriptions）：订阅列表、点击源进入阅读并按源筛选、取消订阅二次确认
- 我的（Profile）：主题（跟随系统/浅色/暗色）、协议入口（占位）
- 详情（Content）：标题/来源/时间/摘要、底部固定“查看全文”
- 中转确认（Redirect）：来源域名 + 风险提示 + “继续访问/返回”
- WebView：用于打开源站（需要配置业务域名/合法域名时才可正常访问）

## 关键实现位置

- 全局 Token 与基础样式：`miniapp/app.wxss`
- 主题逻辑：`miniapp/utils/theme.js`
- Mock 数据：`miniapp/utils/mock.js`
- 订阅本地存储：`miniapp/utils/subscriptions.js`
- 组件：`miniapp/components/*`

