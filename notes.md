# Notes: UI 原型实现要点（Notion 风）

## Sources

### `docs/ui-miniapp-notion.md`
- 核心：语义 Token（浅色/暗色）、排版规格（字号/行高/间距/圆角）、组件（TopBar/Chip/FeedItem/SourceItem/Empty/Loading）、页面（阅读/找源/订阅/我的/详情/中转）。

### `AGENT.md`
- 小程序端定位为“壳”：UI/交互/渲染 + 轻量本地缓存；合规：协议弹窗、外链中转。

## Synthesized Findings

### 页面清单（原型必备）
- Tab：阅读（Feed）、找源（Discover）、订阅（Subscriptions）、我的（Profile）
- 非 Tab：详情（Content）、中转确认（Redirect）

### 交互（原型级）
- 列表整行可点；轻按压态
- 阅读页：时间范围 Chip（24h/3d/7d），下拉刷新（mock）
- 找源页：搜索框 + 分类 Chip（横向滚动）+ 订阅按钮
- 订阅页：源列表 → 点进阅读页并按源筛选（原型：跳转并带 query）
- 我的页：主题单选；协议入口（占位页或 toast）
- 详情页：底部固定主 CTA “查看全文” → 中转页
- 中转页：强提示 + “继续访问/返回”，禁止自动跳转

### 主题实现方案
- 优先：CSS 变量 Token（light/dark）+ `data-theme` 选择器作用于页面根容器
- 降级：两套 class（`.theme-light`/`.theme-dark`）覆盖颜色

