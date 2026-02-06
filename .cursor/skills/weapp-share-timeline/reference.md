# 微信小程序分享到朋友圈完整参考文档

基础库 2.11.3+ 支持，Android/iOS 微信 8.0.24+

## 1. API 详解

### Page.onShareAppMessage

转发给朋友的回调函数（分享到朋友圈的前置条件）。

#### 参数

##### Object res

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| from | string | 转发事件来源：`button`（页面内按钮）或 `menu`（右上角菜单） |
| target | Object | 如果 from 为 button，则 target 为触发事件的 button |
| webViewUrl | string | 页面中包含 web-view 组件时，返回当前 web-view 的 url |

#### 返回值

##### Object

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | string | 当前小程序名称 | 转发标题 |
| path | string | 当前页面路径 | 转发路径，必须是以 / 开头的完整路径 |
| imageUrl | string | 页面截图 | 自定义图片路径，支持 PNG/JPG，比例 5:4 |
| promise | Promise | - | 异步获取分享信息 |

#### 示例代码

```javascript
Page({
  onShareAppMessage(res) {
    if (res.from === 'button') {
      console.log('来自按钮分享', res.target)
    }
    return {
      title: '自定义转发标题',
      path: '/pages/index/index?id=123',
      imageUrl: '/images/share.png'
    }
  }
})
```

### Page.onShareTimeline

分享到朋友圈的回调函数。

#### 返回值

##### Object

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | string | 当前小程序名称 | 分享标题 |
| query | string | 当前页面 query | 自定义页面路径中携带的参数 |
| imageUrl | string | 页面截图 | 自定义图片路径，支持本地或网络图片 |

#### 示例代码

```javascript
Page({
  onShareTimeline() {
    return {
      title: '分享到朋友圈的标题',
      query: 'id=123&from=timeline',
      imageUrl: 'https://example.com/share.png'
    }
  }
})
```

### Taro Hooks

#### useShareAppMessage

```typescript
import { useShareAppMessage } from '@tarojs/taro'

useShareAppMessage((res) => {
  // res.from: 'button' | 'menu'
  // res.target: 触发按钮
  return {
    title: string,
    path: string,
    imageUrl?: string
  }
})
```

#### useShareTimeline

```typescript
import { useShareTimeline } from '@tarojs/taro'

useShareTimeline(() => {
  return {
    title: string,
    query: string,
    imageUrl?: string
  }
})
```

## 2. 单页模式完整限制列表

### 2.1 禁用组件

| 组件 | 说明 |
| --- | --- |
| button open-type | 开放能力按钮的所有 open-type 值 |
| camera | 相机组件 |
| editor | 富文本编辑器 |
| form | 表单组件 |
| functional-page-navigator | 仅在插件中有效的跳转 |
| live-pusher | 直播推流组件 |
| navigator | 页面导航组件 |
| navigation-bar | 导航栏组件 |
| official-account | 公众号关注组件 |
| open-data | 开放数据组件 |
| web-view | 网页容器组件 |

### 2.2 禁用 API 完整列表

#### 路由

| API | 说明 |
| --- | --- |
| wx.redirectTo | 关闭当前页面，跳转到应用内的某个页面 |
| wx.reLaunch | 关闭所有页面，打开到应用内的某个页面 |
| wx.navigateTo | 保留当前页面，跳转到应用内的某个页面 |
| wx.switchTab | 跳转到 tabBar 页面 |
| wx.navigateBack | 关闭当前页面，返回上一页面 |

#### 界面

| API | 说明 |
| --- | --- |
| 导航栏相关 | wx.setNavigationBarTitle 等 |
| Tab Bar 相关 | wx.showTabBar、wx.hideTabBar 等 |

#### 网络

| API | 说明 |
| --- | --- |
| mDNS | wx.startLocalServiceDiscovery 等 |
| UDP 通信 | wx.createUDPSocket |

#### 数据缓存

| API | 说明 |
| --- | --- |
| 周期性更新 | wx.setBackgroundFetchToken 等 |

#### 媒体

| API | 说明 |
| --- | --- |
| VoIP | 实时音视频通话相关 |
| wx.chooseMedia | 选择图片或视频 |
| wx.chooseImage | 选择图片 |
| wx.saveImageToPhotosAlbum | 保存图片到相册 |
| wx.chooseVideo | 选择视频 |
| wx.saveVideoToPhotosAlbum | 保存视频到相册 |
| wx.getVideoInfo | 获取视频信息 |
| wx.compressVideo | 压缩视频 |

#### 位置

| API | 说明 |
| --- | --- |
| wx.openLocation | 打开内置地图 |
| wx.chooseLocation | 选择位置 |
| wx.startLocationUpdateBackground | 后台定位 |
| wx.startLocationUpdate | 实时定位 |

#### 转发

| API | 说明 |
| --- | --- |
| wx.getShareInfo | 获取转发信息 |
| wx.showShareMenu | 显示分享菜单 |
| wx.hideShareMenu | 隐藏分享菜单 |
| wx.updateShareMenu | 更新分享菜单 |

#### 文件

| API | 说明 |
| --- | --- |
| wx.openDocument | 打开文档 |

#### 开放接口

| 分类 | 说明 |
| --- | --- |
| 登录 | wx.login、wx.checkSession |
| 小程序跳转 | wx.navigateToMiniProgram 等 |
| 用户信息 | wx.getUserInfo、wx.getUserProfile |
| 支付 | wx.requestPayment |
| 授权 | wx.authorize |
| 设置 | wx.openSetting |
| 收货地址 | wx.chooseAddress |
| 卡券 | wx.addCard 等 |
| 发票 | wx.chooseInvoice 等 |
| 生物认证 | wx.startSoterAuthentication 等 |
| 微信运动 | wx.getWeRunData |
| 微信红包 | wx.sendBizRedPacket |

#### 设备

| 分类 | 说明 |
| --- | --- |
| 蓝牙 | wx.openBluetoothAdapter 等 |
| iBeacon | wx.startBeaconDiscovery 等 |
| Wi-Fi | wx.startWifi 等 |
| NFC | wx.getNFCAdapter 等 |
| 联系人 | wx.addPhoneContact |
| 剪贴板 | wx.setClipboardData、wx.getClipboardData |
| 电话 | wx.makePhoneCall |
| 扫码 | wx.scanCode |

#### 广告

| 组件/API | 说明 |
| --- | --- |
| ad | 广告组件 |
| wx.createRewardedVideoAd | 激励视频广告 |
| wx.createInterstitialAd | 插屏广告 |

## 3. 场景值说明

| 场景值 | 说明 |
| --- | --- |
| 1154 | 朋友圈单页模式 |

### 获取场景值

```javascript
// 方式 1：启动时获取
const launchOptions = wx.getLaunchOptionsSync()
const scene = launchOptions.scene

// 方式 2：App.onLaunch / App.onShow
App({
  onLaunch(options) {
    console.log('场景值:', options.scene)
  }
})

// 方式 3：wx.getApiCategory（基础库 2.22.1+）
const apiCategory = wx.getApiCategory()
// 'browseOnly' 表示朋友圈快照页等仅浏览场景
```

## 4. 页面配置

### navigationBarFit

```json
{
  "navigationBarFit": "squeezed"
}
```

| 值 | 说明 |
| --- | --- |
| float | 导航栏浮动在页面上方，页面内容从屏幕顶部开始（默认） |
| squeezed | 页面被导航栏挤压，页面内容从导航栏下方开始 |

**使用场景**：当页面有自定义导航栏时，在单页模式下可能会与系统导航栏重叠，此时应使用 `squeezed` 让页面从系统导航栏下方开始布局。

## 5. 云开发未登录访问

### 开启方式

1. 登录云开发控制台
2. 进入「设置」-「安全配置」
3. 开启「未登录用户访问云资源」

### 云函数配置

```json
// cloudfunction/xxx/config.json
{
  "permissions": {
    "openapi": []
  },
  "overrideUserSecurityRules": {
    "allow": true
  }
}
```

### 数据库安全规则

```json
{
  "read": true,
  "write": "auth.openid != null"
}
```

## 6. 分享图片规范

| 属性 | 要求 |
| --- | --- |
| 格式 | PNG、JPG |
| 比例 | 建议 1:1 正方形 |
| 大小 | 建议不超过 128KB |
| 来源 | 本地图片或网络图片均可 |

### 动态生成分享图

```tsx
import Taro from '@tarojs/taro'

const generateShareImage = async (): Promise<string> => {
  return new Promise((resolve) => {
    const query = Taro.createSelectorQuery()
    query.select('#share-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 绘制分享图...

        canvas.toTempFilePath({
          success: (result) => resolve(result.tempFilePath)
        })
      })
  })
}
```

## 7. 完整示例

### 文章详情页

```tsx
import Taro, { useLoad, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { View, Text, Image, RichText, Button } from '@tarojs/components'
import { useState } from 'react'

interface Article {
  id: string
  title: string
  content: string
  cover: string
  author: string
}

function ArticleDetailPage() {
  const [article, setArticle] = useState<Article | null>(null)
  const [isSinglePage, setIsSinglePage] = useState(false)
  const [loading, setLoading] = useState(true)

  useLoad((params) => {
    const scene = Taro.getLaunchOptionsSync().scene
    setIsSinglePage(scene === 1154)

    if (params.id) {
      fetchArticle(params.id)
    }
  })

  const fetchArticle = async (id: string) => {
    try {
      setLoading(true)
      // 使用公开接口，支持单页模式
      const res = await Taro.request({
        url: `https://api.example.com/public/articles/${id}`,
        method: 'GET'
      })
      setArticle(res.data)
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 1. 启用发送给朋友
  useShareAppMessage(() => ({
    title: article?.title || '精彩文章',
    path: `/pages/article/detail?id=${article?.id}`,
    imageUrl: article?.cover
  }))

  // 2. 启用分享到朋友圈
  useShareTimeline(() => ({
    title: article?.title || '精彩文章',
    query: `id=${article?.id}`,
    imageUrl: article?.cover
  }))

  const handleLike = () => {
    if (isSinglePage) {
      Taro.showToast({
        title: '请点击下方"前往小程序"进行点赞',
        icon: 'none'
      })
      return
    }
    // 正常点赞逻辑
  }

  const handleComment = () => {
    if (isSinglePage) {
      Taro.showToast({
        title: '请点击下方"前往小程序"发表评论',
        icon: 'none'
      })
      return
    }
    // 正常评论逻辑
    Taro.navigateTo({ url: `/pages/comment/index?articleId=${article?.id}` })
  }

  if (loading) {
    return (
      <View className="loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View
      className="article-page"
      style={{
        paddingBottom: isSinglePage ? '80px' : 'env(safe-area-inset-bottom)'
      }}
    >
      {/* 文章封面 */}
      <Image
        src={article?.cover || ''}
        mode="widthFix"
        className="cover"
      />

      {/* 文章标题 */}
      <View className="header">
        <Text className="title">{article?.title}</Text>
        <Text className="author">作者：{article?.author}</Text>
      </View>

      {/* 文章内容 */}
      <View className="content">
        <RichText nodes={article?.content || ''} />
      </View>

      {/* 操作区：单页模式下显示提示 */}
      {!isSinglePage ? (
        <View className="actions">
          <Button onClick={handleLike}>点赞</Button>
          <Button onClick={handleComment}>评论</Button>
        </View>
      ) : (
        <View className="single-page-tip">
          <Text>点击下方"前往小程序"体验完整功能</Text>
        </View>
      )}
    </View>
  )
}

export default ArticleDetailPage
```

### 页面配置

```typescript
// pages/article/detail.config.ts
export default definePageConfig({
  navigationBarTitleText: '文章详情',
  navigationBarFit: 'squeezed',  // 适配单页模式
  enableShareAppMessage: true,
  enableShareTimeline: true
})
```
