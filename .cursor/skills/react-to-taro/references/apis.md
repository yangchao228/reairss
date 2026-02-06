# Taro API Reference

## Navigation APIs

### Taro.navigateTo
Navigate to a page, preserving current page in stack (max 10 pages).

```typescript
Taro.navigateTo({
  url: '/pages/detail/index?id=123',
  events: {
    // Listen for data from opened page
    acceptDataFromOpenedPage: (data) => console.log(data)
  },
  success: (res) => {
    // Send data to opened page
    res.eventChannel.emit('acceptDataFromOpenerPage', { data: 'test' })
  }
})
```

### Taro.redirectTo
Close current page and navigate to a new one.

```typescript
Taro.redirectTo({ url: '/pages/login/index' })
```

### Taro.navigateBack
Return to previous page(s).

```typescript
Taro.navigateBack()              // Go back 1 page
Taro.navigateBack({ delta: 2 })  // Go back 2 pages
```

### Taro.switchTab
Switch to a TabBar page. Closes all non-TabBar pages.

```typescript
Taro.switchTab({ url: '/pages/home/index' })
```

### Taro.reLaunch
Close all pages and navigate to a new one.

```typescript
Taro.reLaunch({ url: '/pages/index/index' })
```

## Network APIs

### Taro.request
HTTP network request.

```typescript
interface RequestOption<T = any> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD'
  data?: any
  header?: Record<string, string>
  timeout?: number        // Default: 60000ms
  dataType?: 'json' | string
  responseType?: 'text' | 'arraybuffer'
}

interface Response<T> {
  data: T
  statusCode: number      // Note: statusCode, not status
  header: Record<string, string>
  errMsg: string
}

// Usage
const res = await Taro.request<UserData>({
  url: 'https://api.example.com/user',
  method: 'GET',
  header: { 'Authorization': `Bearer ${token}` }
})

if (res.statusCode === 200) {
  console.log(res.data)
}
```

### Taro.uploadFile
Upload local file to server.

```typescript
const uploadTask = Taro.uploadFile({
  url: 'https://api.example.com/upload',
  filePath: tempFilePath,
  name: 'file',
  formData: { 'user': 'test' },
  success: (res) => console.log(res.data)
})

uploadTask.progress((res) => {
  console.log('Progress:', res.progress)
})
```

### Taro.downloadFile
Download file from server.

```typescript
const downloadTask = Taro.downloadFile({
  url: 'https://example.com/file.pdf',
  success: (res) => {
    if (res.statusCode === 200) {
      console.log('Saved to:', res.tempFilePath)
    }
  }
})
```

## UI Interaction APIs

### Taro.showToast
Show toast notification.

```typescript
Taro.showToast({
  title: 'Success!',
  icon: 'success',  // 'success' | 'error' | 'loading' | 'none'
  duration: 2000,
  mask: true        // Prevent touch during display
})

// For longer messages, use icon: 'none'
Taro.showToast({
  title: 'This is a longer message that needs more space',
  icon: 'none',
  duration: 3000
})

// Hide manually
Taro.hideToast()
```

### Taro.showLoading
Show loading indicator.

```typescript
Taro.showLoading({ title: 'Loading...', mask: true })

// Must manually hide
Taro.hideLoading()
```

### Taro.showModal
Show modal dialog.

```typescript
const result = await Taro.showModal({
  title: 'Confirm',
  content: 'Are you sure you want to delete?',
  confirmText: 'Delete',
  confirmColor: '#ff0000',
  cancelText: 'Cancel'
})

if (result.confirm) {
  // User clicked confirm
} else if (result.cancel) {
  // User clicked cancel
}
```

### Taro.showActionSheet
Show action sheet menu.

```typescript
const result = await Taro.showActionSheet({
  itemList: ['Option 1', 'Option 2', 'Delete'],
  itemColor: '#000000'
})

console.log('Selected index:', result.tapIndex)
```

## Storage APIs

### Synchronous

```typescript
// Set
Taro.setStorageSync('key', value)  // Auto JSON.stringify for objects

// Get
const value = Taro.getStorageSync('key')  // Auto JSON.parse

// Remove
Taro.removeStorageSync('key')

// Clear all
Taro.clearStorageSync()

// Get storage info
const info = Taro.getStorageInfoSync()
console.log(info.keys, info.currentSize, info.limitSize)
```

### Asynchronous

```typescript
// Set
await Taro.setStorage({ key: 'user', data: userData })

// Get
const { data } = await Taro.getStorage({ key: 'user' })

// Remove
await Taro.removeStorage({ key: 'user' })

// Clear
await Taro.clearStorage()
```

## System APIs

### Taro.getSystemInfoSync
Get system information.

```typescript
const info = Taro.getSystemInfoSync()
console.log({
  platform: info.platform,      // 'ios' | 'android' | 'devtools'
  screenWidth: info.screenWidth,
  screenHeight: info.screenHeight,
  windowWidth: info.windowWidth,
  windowHeight: info.windowHeight,
  statusBarHeight: info.statusBarHeight,
  safeArea: info.safeArea
})
```

### Taro.getCurrentInstance
Get current page/component instance.

```typescript
const instance = Taro.getCurrentInstance()
const params = instance.router?.params || {}
const preloadData = instance.preloadData
```

## Clipboard APIs

```typescript
// Copy
await Taro.setClipboardData({ data: 'Text to copy' })

// Paste
const { data } = await Taro.getClipboardData()
```

## DOM Query APIs

### Taro.createSelectorQuery
Query DOM elements.

```typescript
// Query single element
const query = Taro.createSelectorQuery()
query.select('#myElement').boundingClientRect((rect) => {
  console.log(rect)  // { top, left, width, height, ... }
}).exec()

// Query multiple elements
query.selectAll('.item').boundingClientRect((rects) => {
  console.log(rects)  // Array of rects
}).exec()

// Get scroll position
query.selectViewport().scrollOffset((res) => {
  console.log(res.scrollTop, res.scrollLeft)
}).exec()

// Promise wrapper
const getRect = (selector: string): Promise<any> => {
  return new Promise((resolve) => {
    Taro.createSelectorQuery()
      .select(selector)
      .boundingClientRect()
      .exec((res) => resolve(res[0]))
  })
}
```

## Page Lifecycle Hooks

```typescript
import { useLoad, useDidShow, useDidHide, useReady, useUnload, usePageScroll, useReachBottom, usePullDownRefresh } from '@tarojs/taro'

function MyPage() {
  // Page loaded with params
  useLoad((params) => {
    console.log('Page loaded:', params)
  })

  // Page first render complete
  useReady(() => {
    console.log('DOM ready')
  })

  // Page shown (also on return from other page)
  useDidShow(() => {
    console.log('Page shown')
  })

  // Page hidden
  useDidHide(() => {
    console.log('Page hidden')
  })

  // Page unloaded
  useUnload(() => {
    console.log('Page unloaded')
  })

  // Page scroll
  usePageScroll((res) => {
    console.log('Scroll position:', res.scrollTop)
  })

  // Reached bottom
  useReachBottom(() => {
    console.log('Reached bottom, load more')
  })

  // Pull down refresh
  usePullDownRefresh(() => {
    console.log('Pull down refresh triggered')
    // Stop refresh when done
    Taro.stopPullDownRefresh()
  })
}
```

## Share APIs

```typescript
import { useShareAppMessage, useShareTimeline } from '@tarojs/taro'

function MyPage() {
  // Share to chat
  useShareAppMessage(() => ({
    title: 'Share Title',
    path: '/pages/index/index?id=123',
    imageUrl: '/images/share.png'
  }))

  // Share to moments
  useShareTimeline(() => ({
    title: 'Share Title',
    query: 'id=123',
    imageUrl: '/images/share.png'
  }))
}
```
