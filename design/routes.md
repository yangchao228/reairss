# Routes Specification - 页面路由与跳转

> 本文档定义小程序所有页面路由、跳转逻辑、参数传递和导航行为。

## 1. 路由结构

### 1.1 目录结构
```
pages/
├── feed/          # 阅读页（主 Tab）
│   ├── feed.wxml
│   ├── feed.wxss
│   ├── feed.js
│   └── feed.json
├── discover/      # 找源页（主 Tab）
│   ├── discover.wxml
│   ├── discover.wxss
│   ├── discover.js
│   └── discover.json
├── subscriptions/ # 订阅页（主 Tab）
│   ├── subscriptions.wxml
│   ├── subscriptions.wxss
│   ├── subscriptions.js
│   └── subscriptions.json
├── profile/       # 我的页（主 Tab）
│   ├── profile.wxml
│   ├── profile.wxss
│   ├── profile.js
│   └── profile.json
├── content/       # 内容详情页
│   ├── content.wxml
│   ├── content.wxss
│   ├── content.js
│   └── content.json
├── redirect/      # 中转确认页
│   ├── redirect.wxml
│   ├── redirect.wxss
│   ├── redirect.js
│   └── redirect.json
└── agreement/     # 协议页（WebView）
    ├── agreement.wxml
    ├── agreement.wxss
    ├── agreement.js
    └── agreement.json
```

---

## 2. 路由配置（app.json）

### 2.1 完整配置
```json
{
  "pages": [
    "pages/feed/feed",
    "pages/discover/discover",
    "pages/subscriptions/subscriptions",
    "pages/profile/profile",
    "pages/content/content",
    "pages/redirect/redirect",
    "pages/agreement/agreement"
  ],
  "tabBar": {
    "color": "#6B6B6B",
    "selectedColor": "#2F80ED",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/feed/feed",
        "text": "阅读",
        "iconPath": "assets/icons/feed.png",
        "selectedIconPath": "assets/icons/feed-active.png"
      },
      {
        "pagePath": "pages/discover/discover",
        "text": "找源",
        "iconPath": "assets/icons/discover.png",
        "selectedIconPath": "assets/icons/discover-active.png"
      },
      {
        "pagePath": "pages/subscriptions/subscriptions",
        "text": "订阅",
        "iconPath": "assets/icons/subscriptions.png",
        "selectedIconPath": "assets/icons/subscriptions-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "assets/icons/profile.png",
        "selectedIconPath": "assets/icons/profile-active.png"
      }
    ]
  },
  "window": {
    "navigationBarTitleText": "RSS 阅读器",
    "navigationBarBackgroundColor": "#FFFFFF",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F7F7F5",
    "enablePullDownRefresh": false
  },
  "darkmode": true,
  "themeLocation": "theme.json"
}
```

### 2.2 主题配置（theme.json）
```json
{
  "light": {
    "navigationBarBackgroundColor": "#FFFFFF",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F7F7F5"
  },
  "dark": {
    "navigationBarBackgroundColor": "#171717",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#0F0F0F"
  }
}
```

---

## 3. 页面路由详情

### 3.1 阅读页（Feed）

**路由路径**
```
pages/feed/feed
```

**Tab 配置**
- 序号：0（默认首页）
- 文本：阅读
- 图标：feed.png / feed-active.png

**Query 参数**（可选）
```typescript
interface FeedQuery {
  source_id?: string;    // 按源筛选（从订阅页跳转）
  time_range?: '24h' | '3d' | '7d';  // 时间范围
}
```

**跳转示例**
```javascript
// 默认进入（首页）
wx.switchTab({
  url: '/pages/feed/feed'
});

// 从订阅页跳转（按源筛选）
wx.navigateTo({
  url: '/pages/feed/feed?source_id=123'
});

// 注意：Tab 页面不支持 navigateTo，需要特殊处理
// 方案：使用事件总线或全局状态传递筛选参数
```

**页面配置（feed.json）**
```json
{
  "navigationBarTitleText": "阅读",
  "enablePullDownRefresh": true,
  "backgroundColor": "#F7F7F5",
  "backgroundTextStyle": "dark",
  "onReachBottomDistance": 100
}
```

**生命周期钩子**
- `onLoad`: 初始化，读取 query 参数
- `onShow`: 每次显示时刷新数据
- `onPullDownRefresh`: 下拉刷新
- `onReachBottom`: 滚动到底部加载更多

**跳转到其他页面**
- 内容详情：`navigateTo('/pages/content/content?id=xxx')`

---

### 3.2 找源页（Discover）

**路由路径**
```
pages/discover/discover
```

**Tab 配置**
- 序号：1
- 文本：找源
- 图标：discover.png / discover-active.png

**Query 参数**（无）

**跳转示例**
```javascript
wx.switchTab({
  url: '/pages/discover/discover'
});
```

**页面配置（discover.json）**
```json
{
  "navigationBarTitleText": "找源",
  "enablePullDownRefresh": false,
  "backgroundColor": "#F7F7F5"
}
```

**生命周期钩子**
- `onLoad`: 初始化，加载分类和源列表
- `onShow`: 每次显示时检查订阅状态更新

**跳转到其他页面**
- 无（在当前页订阅/取消订阅）

---

### 3.3 订阅页（Subscriptions）

**路由路径**
```
pages/subscriptions/subscriptions
```

**Tab 配置**
- 序号：2
- 文本：订阅
- 图标：subscriptions.png / subscriptions-active.png

**Query 参数**（无）

**跳转示例**
```javascript
wx.switchTab({
  url: '/pages/subscriptions/subscriptions'
});
```

**页面配置（subscriptions.json）**
```json
{
  "navigationBarTitleText": "订阅",
  "enablePullDownRefresh": true,
  "backgroundColor": "#F7F7F5",
  "backgroundTextStyle": "dark"
}
```

**生命周期钩子**
- `onLoad`: 初始化
- `onShow`: 每次显示时刷新订阅列表
- `onPullDownRefresh`: 下拉刷新

**跳转到其他页面**
- 阅读页（按源筛选）：需要特殊处理，因为目标是 Tab 页

**跳转方案**
```javascript
// 方案1：使用全局状态
getApp().globalData.feedFilter = { source_id: 123 };
wx.switchTab({
  url: '/pages/feed/feed'
});

// 方案2：使用事件总线
eventBus.emit('filterFeed', { source_id: 123 });
wx.switchTab({
  url: '/pages/feed/feed'
});
```

---

### 3.4 我的页（Profile）

**路由路径**
```
pages/profile/profile
```

**Tab 配置**
- 序号：3
- 文本：我的
- 图标：profile.png / profile-active.png

**Query 参数**（无）

**跳转示例**
```javascript
wx.switchTab({
  url: '/pages/profile/profile'
});
```

**页面配置（profile.json）**
```json
{
  "navigationBarTitleText": "我的",
  "enablePullDownRefresh": false,
  "backgroundColor": "#F7F7F5"
}
```

**生命周期钩子**
- `onLoad`: 初始化，读取本地主题设置
- `onShow`: 每次显示时刷新设置状态

**跳转到其他页面**
- 用户协议：`navigateTo('/pages/agreement/agreement?type=user')`
- 隐私政策：`navigateTo('/pages/agreement/agreement?type=privacy')`

---

### 3.5 内容详情页（Content）

**路由路径**
```
pages/content/content
```

**路由类型**
- 非 Tab 页面
- 保留导航历史

**Query 参数**（必需）
```typescript
interface ContentQuery {
  id: string;  // 内容 ID（必需）
}
```

**跳转示例**
```javascript
// 从阅读页跳转
wx.navigateTo({
  url: '/pages/content/content?id=123'
});
```

**页面配置（content.json）**
```json
{
  "navigationBarTitleText": "详情",
  "navigationStyle": "default",
  "backgroundColor": "#F7F7F5"
}
```

**生命周期钩子**
- `onLoad(options)`: 接收 `options.id`，调用 API 获取详情
- `onUnload`: 清理数据

**跳转到其他页面**
- 中转页：`navigateTo('/pages/redirect/redirect?id=xxx')`

**返回逻辑**
```javascript
// 返回上一页
wx.navigateBack();

// 或自定义返回按钮
onBackTap() {
  wx.navigateBack({ delta: 1 });
}
```

---

### 3.6 中转确认页（Redirect）

**路由路径**
```
pages/redirect/redirect
```

**路由类型**
- 非 Tab 页面
- 保留导航历史

**Query 参数**（必需）
```typescript
interface RedirectQuery {
  id: string;  // 内容 ID（必需）
}
```

**跳转示例**
```javascript
// 从内容详情页跳转
wx.navigateTo({
  url: '/pages/redirect/redirect?id=123'
});
```

**页面配置（redirect.json）**
```json
{
  "navigationBarTitleText": "外部链接",
  "navigationStyle": "default",
  "backgroundColor": "#F7F7F5"
}
```

**生命周期钩子**
- `onLoad(options)`: 接收 `options.id`，调用 API 获取跳转 URL

**跳转到其他页面**
```javascript
// 继续访问（打开 WebView）
wx.navigateTo({
  url: `/pages/webview/webview?url=${encodeURIComponent(targetUrl)}`
});

// 或直接打开外部浏览器（如果允许）
// 注意：小程序限制，需要配置业务域名
```

**返回逻辑**
```javascript
// 返回上一页（内容详情）
wx.navigateBack();
```

**注意事项**
- 禁止自动跳转，必须用户手动点击
- URL 必须从 API 获取，不能直接从 query 传递（安全考虑）
- 显示目标域名，提供风险提示

---

### 3.7 协议页（Agreement）

**路由路径**
```
pages/agreement/agreement
```

**路由类型**
- 非 Tab 页面
- WebView 页面

**Query 参数**（必需）
```typescript
interface AgreementQuery {
  type: 'user' | 'privacy';  // 协议类型
}
```

**跳转示例**
```javascript
// 用户协议
wx.navigateTo({
  url: '/pages/agreement/agreement?type=user'
});

// 隐私政策
wx.navigateTo({
  url: '/pages/agreement/agreement?type=privacy'
});
```

**页面配置（agreement.json）**
```json
{
  "navigationBarTitleText": "协议",
  "navigationStyle": "default"
}
```

**实现方式**
```javascript
// agreement.js
Page({
  data: {
    url: ''
  },
  onLoad(options) {
    const urls = {
      user: 'https://example.com/user-agreement.html',
      privacy: 'https://example.com/privacy-policy.html'
    };
    this.setData({
      url: urls[options.type] || urls.user
    });
    
    // 更新标题
    const titles = {
      user: '用户协议',
      privacy: '隐私政策'
    };
    wx.setNavigationBarTitle({
      title: titles[options.type] || '协议'
    });
  }
});
```

```xml
<!-- agreement.wxml -->
<web-view src="{{url}}"></web-view>
```

**注意事项**
- 协议 URL 需要在小程序后台配置业务域名
- 必须使用 HTTPS
- 建议协议页面适配移动端

---

## 4. 导航方法汇总

### 4.1 微信小程序导航 API

| API | 用途 | 说明 |
|-----|------|------|
| `wx.switchTab` | 切换 Tab | 跳转到 tabBar 页面，会关闭其他非 tabBar 页面 |
| `wx.navigateTo` | 保留当前页跳转 | 保留当前页面，跳转到应用内的某个页面，最多10层 |
| `wx.redirectTo` | 关闭当前页跳转 | 关闭当前页面，跳转到应用内的某个非 tabBar 页面 |
| `wx.navigateBack` | 返回 | 关闭当前页面，返回上一页或多级页面 |
| `wx.reLaunch` | 重新启动 | 关闭所有页面，打开到应用内的某个页面 |

### 4.2 使用场景

**跳转到 Tab 页面**
```javascript
wx.switchTab({
  url: '/pages/feed/feed'
});
```

**跳转到详情页（保留历史）**
```javascript
wx.navigateTo({
  url: '/pages/content/content?id=123'
});
```

**返回上一页**
```javascript
wx.navigateBack({
  delta: 1  // 返回的页面数，默认 1
});
```

**关闭当前页并跳转**
```javascript
wx.redirectTo({
  url: '/pages/content/content?id=123'
});
```

**重启应用到某页**
```javascript
wx.reLaunch({
  url: '/pages/feed/feed'
});
```

---

## 5. 特殊路由场景

### 5.1 首次启动流程

**流程图**
```
启动
  ↓
检查是否同意协议
  ↓
  ├─ 已同意 → 进入首页（阅读页）
  └─ 未同意 → 显示协议弹窗
              ↓
              ├─ 同意 → 保存状态 → 进入首页
              └─ 不同意 → 退出小程序
```

**实现方式**
```javascript
// app.js
App({
  onLaunch() {
    // 检查协议同意状态
    const agreed = wx.getStorageSync('agreed');
    if (!agreed) {
      this.globalData.showAgreementModal = true;
    }
  },
  globalData: {
    showAgreementModal: false
  }
});

// pages/feed/feed.js
Page({
  onLoad() {
    const app = getApp();
    if (app.globalData.showAgreementModal) {
      this.showAgreementModal();
    }
  },
  showAgreementModal() {
    // 显示弹窗组件
  }
});
```

### 5.2 Tab 页面传参问题

**问题**
- `wx.switchTab` 不支持携带参数
- 无法通过 URL query 传递数据

**解决方案**

**方案1：全局数据**
```javascript
// 设置筛选参数
getApp().globalData.feedFilter = {
  source_id: 123,
  time_range: '24h'
};

// 跳转
wx.switchTab({
  url: '/pages/feed/feed'
});

// 目标页面读取
Page({
  onShow() {
    const filter = getApp().globalData.feedFilter;
    if (filter) {
      this.applyFilter(filter);
      // 清除筛选参数
      getApp().globalData.feedFilter = null;
    }
  }
});
```

**方案2：事件总线**
```javascript
// utils/eventBus.js
class EventBus {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
}
export default new EventBus();

// 使用
import eventBus from '../../utils/eventBus';

// 订阅页发送事件
eventBus.emit('filterFeed', { source_id: 123 });
wx.switchTab({ url: '/pages/feed/feed' });

// 阅读页监听事件
Page({
  onLoad() {
    eventBus.on('filterFeed', this.handleFilter.bind(this));
  },
  onUnload() {
    eventBus.off('filterFeed', this.handleFilter);
  },
  handleFilter(filter) {
    this.applyFilter(filter);
  }
});
```

### 5.3 从订阅页跳转到阅读页并筛选

**场景**
- 用户在订阅页点击某个源
- 跳转到阅读页并只显示该源的内容

**推荐方案**
```javascript
// pages/subscriptions/subscriptions.js
Page({
  onSourceTap(e) {
    const sourceId = e.currentTarget.dataset.id;
    
    // 设置全局筛选参数
    getApp().globalData.feedFilter = {
      source_id: sourceId,
      clear_on_show: true  // 标记在 onShow 时应用后清除
    };
    
    // 跳转到阅读页
    wx.switchTab({
      url: '/pages/feed/feed'
    });
  }
});

// pages/feed/feed.js
Page({
  data: {
    currentFilter: null
  },
  onShow() {
    const app = getApp();
    const filter = app.globalData.feedFilter;
    
    if (filter) {
      // 应用筛选
      this.setData({ currentFilter: filter });
      this.loadFeedWithFilter(filter);
      
      // 清除全局筛选参数（如果标记了）
      if (filter.clear_on_show) {
        app.globalData.feedFilter = null;
      }
    } else if (this.data.currentFilter) {
      // 清除筛选，恢复默认
      this.setData({ currentFilter: null });
      this.loadDefaultFeed();
    }
  }
});
```

### 5.4 深度链接（分享/扫码进入）

**场景**
- 用户通过分享链接打开小程序
- 用户扫描二维码打开小程序

**配置**
```javascript
// app.json
{
  "navigateToMiniProgramAppIdList": [],
  // 其他配置...
}

// 分享配置（某个页面）
Page({
  onShareAppMessage() {
    return {
      title: '推荐一个好用的 RSS 阅读器',
      path: '/pages/content/content?id=123',
      imageUrl: '/assets/share-cover.png'
    };
  }
});
```

**处理深度链接**
```javascript
// app.js
App({
  onLaunch(options) {
    console.log('启动场景值:', options.scene);
    console.log('启动路径:', options.path);
    console.log('启动参数:', options.query);
    
    // 场景值参考：
    // 1007: 单人聊天会话中的消息卡片
    // 1008: 群聊会话中的消息卡片
    // 1011: 扫描二维码
    // 1047: 扫描小程序码
    // 1048: 长按图片识别小程序码
  }
});
```

---

## 6. 路由守卫（导航拦截）

### 6.1 全局路由守卫

**场景**
- 检查协议同意状态
- 检查登录状态（二期）
- 统计页面访问

**实现**
```javascript
// utils/router.js
class Router {
  constructor() {
    this.beforeEach = null;
  }
  
  // 全局前置守卫
  setBeforeEach(guard) {
    this.beforeEach = guard;
  }
  
  // 封装导航方法
  navigateTo(options) {
    if (this.beforeEach) {
      const result = this.beforeEach(options);
      if (result === false) return;
    }
    wx.navigateTo(options);
  }
  
  switchTab(options) {
    if (this.beforeEach) {
      const result = this.beforeEach(options);
      if (result === false) return;
    }
    wx.switchTab(options);
  }
}

const router = new Router();

// 设置守卫
router.setBeforeEach((options) => {
  // 检查协议
  const agreed = wx.getStorageSync('agreed');
  if (!agreed && options.url !== '/pages/feed/feed') {
    wx.showToast({
      title: '请先同意协议',
      icon: 'none'
    });
    return false;  // 阻止导航
  }
  
  // 统计
  console.log('页面访问:', options.url);
  
  return true;  // 允许导航
});

export default router;

// 使用
import router from '../../utils/router';

router.navigateTo({
  url: '/pages/content/content?id=123'
});
```

### 6.2 页面级守卫

**场景**
- 页面需要特定权限
- 页面需要数据预加载

**实现**
```javascript
// pages/content/content.js
Page({
  onLoad(options) {
    // 检查是否有内容 ID
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 继续加载
    this.loadContent(options.id);
  }
});
```

---

## 7. 路由最佳实践

### 7.1 URL 构建

**使用工具函数**
```javascript
// utils/url.js
export function buildUrl(path, params = {}) {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  return query ? `${path}?${query}` : path;
}

// 使用
import { buildUrl } from '../../utils/url';

const url = buildUrl('/pages/content/content', {
  id: 123,
  source: 'techcrunch'
});
// 结果: /pages/content/content?id=123&source=techcrunch
```

### 7.2 路由常量

**定义路由常量**
```javascript
// constants/routes.js
export const ROUTES = {
  FEED: '/pages/feed/feed',
  DISCOVER: '/pages/discover/discover',
  SUBSCRIPTIONS: '/pages/subscriptions/subscriptions',
  PROFILE: '/pages/profile/profile',
  CONTENT: '/pages/content/content',
  REDIRECT: '/pages/redirect/redirect',
  AGREEMENT: '/pages/agreement/agreement'
};

// 使用
import { ROUTES } from '../../constants/routes';
import { buildUrl } from '../../utils/url';

wx.navigateTo({
  url: buildUrl(ROUTES.CONTENT, { id: 123 })
});
```

### 7.3 路由历史管理

**获取路由栈**
```javascript
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];
const prevPage = pages[pages.length - 2];

console.log('当前页面:', currentPage.route);
console.log('上一页面:', prevPage ? prevPage.route : 'none');
console.log('路由栈深度:', pages.length);
```

**返回多级**
```javascript
// 返回到指定页面
function navigateBackTo(targetRoute) {
  const pages = getCurrentPages();
  let delta = 0;
  
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i].route === targetRoute) {
      delta = pages.length - 1 - i;
      break;
    }
  }
  
  if (delta > 0) {
    wx.navigateBack({ delta });
  }
}

// 使用
navigateBackTo('pages/feed/feed');
```

### 7.4 防止重复跳转

**节流函数**
```javascript
// utils/throttle.js
export function throttleNavigate(fn, delay = 500) {
  let timer = null;
  return function(...args) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

// 使用
const navigate = throttleNavigate((url) => {
  wx.navigateTo({ url });
}, 500);

// 按钮点击
onButtonTap() {
  navigate('/pages/content/content?id=123');
}
```

---

## 8. 开发检查清单

### 8.1 路由配置
- [ ] app.json 中正确配置所有页面路径
- [ ] tabBar 配置正确，图标准备齐全
- [ ] 主题配置文件（theme.json）已创建
- [ ] 页面配置（*.json）符合需求

### 8.2 导航逻辑
- [ ] Tab 页面跳转使用 `switchTab`
- [ ] 详情页跳转使用 `navigateTo`
- [ ] 返回逻辑正确，无死循环
- [ ] 路由参数正确传递和接收
- [ ] 防止重复跳转（节流）

### 8.3 特殊场景
- [ ] 首次启动协议弹窗正常
- [ ] Tab 页面传参方案可行
- [ ] 深度链接处理正确
- [ ] 路由守卫逻辑清晰
- [ ] 错误页面/空页面处理

### 8.4 用户体验
- [ ] 页面切换流畅
- [ ] Loading 状态清晰
- [ ] 返回逻辑符合预期
- [ ] 页面标题正确显示
- [ ] 导航栏主题适配

---

## 9. 路由流程图

### 9.1 核心流程

```
应用启动
    ↓
检查协议
    ├─ 未同意 → 显示弹窗 → 同意 → 进入首页
    └─ 已同意 → 进入首页（阅读页）
                    ↓
                Tab 导航
                    ├─ 阅读页（默认）
                    ├─ 找源页
                    ├─ 订阅页
                    └─ 我的页
                    
阅读页 → 点击内容 → 内容详情页
                        ↓
                  点击查看全文
                        ↓
                    中转确认页
                        ↓
                   继续访问/返回
```

### 9.2 订阅流程

```
找源页 → 点击订阅 → API 调用 → 成功
                                ↓
                         Toast 提示
                                ↓
                         按钮状态更新
                         
订阅页 → 点击源 → 跳转阅读页（筛选）
         ↓
    左滑/长按
         ↓
    显示删除选项
         ↓
    二次确认弹窗
         ↓
    确认删除 → API 调用 → 成功 → 从列表移除
```

---

## 附录

### A. 微信小程序路由限制

1. **页面栈限制**：最多 10 层
2. **Tab 页面限制**：
   - 只能通过 `switchTab` 跳转
   - 不支持 URL 参数传递
   - 最多 5 个 Tab
3. **URL 长度限制**：建议不超过 1000 字符

### B. 路由性能优化

1. **预加载**：提前加载下一页数据
2. **缓存**：合理使用页面栈缓存
3. **懒加载**：非关键页面按需加载
4. **减少跳转层级**：避免过深的页面嵌套

### C. 常见问题

**Q: Tab 页面如何传参？**
A: 使用全局数据或事件总线，参考 5.2 节。

**Q: 如何实现返回到首页？**
A: 使用 `wx.reLaunch` 或计算 delta 使用 `wx.navigateBack`。

**Q: 页面栈满了怎么办？**
A: 使用 `wx.redirectTo` 替代 `wx.navigateTo`，或使用 `wx.reLaunch` 重置。

**Q: 如何禁用某个页面的下拉刷新？**
A: 在页面配置文件（*.json）中设置 `"enablePullDownRefresh": false`。