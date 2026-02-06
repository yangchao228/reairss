# Taro Component Reference

## View Component

```typescript
interface ViewProps {
  className?: string
  style?: string | CSSProperties
  hoverClass?: string
  hoverStopPropagation?: boolean
  hoverStartTime?: number  // Default: 50ms
  hoverStayTime?: number   // Default: 400ms
  onClick?: (e: ITouchEvent) => void
  onTouchStart?: (e: ITouchEvent) => void
  onTouchMove?: (e: ITouchEvent) => void
  onTouchEnd?: (e: ITouchEvent) => void
  onLongTap?: (e: ITouchEvent) => void
}
```

## Text Component

```typescript
interface TextProps {
  className?: string
  selectable?: boolean      // Allow text selection
  userSelect?: boolean      // Allow user selection
  space?: 'ensp' | 'emsp' | 'nbsp'  // Space handling
  decode?: boolean          // Decode HTML entities
  numberOfLines?: number    // Max lines (RN)
}
```

**Constraint**: Text can only contain Text children, not View.

## Image Component

```typescript
interface ImageProps {
  src: string               // Required
  mode?: ImageMode          // Default: 'scaleToFill'
  lazyLoad?: boolean        // Lazy loading
  showMenuByLongpress?: boolean
  onLoad?: (e: CommonEvent) => void
  onError?: (e: CommonEvent) => void
}

type ImageMode =
  | 'scaleToFill'    // Stretch to fill
  | 'aspectFit'      // Contain
  | 'aspectFill'     // Cover
  | 'widthFix'       // Width 100%, auto height
  | 'heightFix'      // Height 100%, auto width
  | 'top' | 'bottom' | 'center' | 'left' | 'right'  // Crop modes
```

## Input Component

```typescript
interface InputProps {
  value?: string
  type?: 'text' | 'number' | 'idcard' | 'digit'
  password?: boolean
  placeholder?: string
  placeholderStyle?: string
  maxlength?: number        // Default: 140
  focus?: boolean
  confirmType?: 'send' | 'search' | 'next' | 'go' | 'done'
  onInput?: (e: CommonEvent<{ value: string }>) => void
  onFocus?: (e: CommonEvent<{ value: string; height: number }>) => void
  onBlur?: (e: CommonEvent<{ value: string }>) => void
  onConfirm?: (e: CommonEvent<{ value: string }>) => void
}
```

**Critical**: Use `onInput` + `e.detail.value`, not `onChange` + `e.target.value`

## Button Component

```typescript
interface ButtonProps {
  size?: 'default' | 'mini'
  type?: 'primary' | 'default' | 'warn'
  plain?: boolean           // Outline style
  disabled?: boolean
  loading?: boolean
  formType?: 'submit' | 'reset'
  hoverClass?: string
  onClick?: (e: ITouchEvent) => void
}
```

## ScrollView Component

```typescript
interface ScrollViewProps {
  scrollX?: boolean         // Horizontal scroll
  scrollY?: boolean         // Vertical scroll
  scrollTop?: number        // Scroll position
  scrollLeft?: number
  scrollIntoView?: string   // Scroll to element id
  scrollWithAnimation?: boolean
  upperThreshold?: number   // Default: 50
  lowerThreshold?: number   // Default: 50
  refresherEnabled?: boolean
  refresherTriggered?: boolean
  onScrollToUpper?: (e: CommonEvent) => void
  onScrollToLower?: (e: CommonEvent) => void
  onScroll?: (e: CommonEvent<ScrollDetail>) => void
  onRefresherRefresh?: () => void
}

interface ScrollDetail {
  scrollTop: number
  scrollLeft: number
  scrollHeight: number
  scrollWidth: number
  deltaX: number
  deltaY: number
}
```

## Swiper Component

```typescript
interface SwiperProps {
  indicatorDots?: boolean
  indicatorColor?: string
  indicatorActiveColor?: string
  autoplay?: boolean
  current?: number
  interval?: number         // Default: 5000ms
  duration?: number         // Default: 500ms
  circular?: boolean
  vertical?: boolean
  onChange?: (e: CommonEvent<{ current: number }>) => void
}
```

## Form Component

```typescript
interface FormProps {
  onSubmit?: (e: CommonEvent<{ value: Record<string, any> }>) => void
  onReset?: () => void
}

// Usage: Input name prop maps to form value
<Form onSubmit={e => console.log(e.detail.value)}>
  <Input name="username" />
  <Button formType="submit">Submit</Button>
</Form>
```

## CustomWrapper Component

Purpose: Creates update boundaries for performance optimization in lists.

```tsx
// Wrap list items to isolate state updates
{items.map(item => (
  <CustomWrapper key={item.id}>
    <ComplexComponent data={item} />
  </CustomWrapper>
))}
```

## RichText Component

```typescript
interface RichTextProps {
  nodes: string | RichTextNode[]  // HTML string or node array
  space?: 'ensp' | 'emsp' | 'nbsp'
  selectable?: boolean
}

interface RichTextNode {
  type?: 'node' | 'text'
  name?: string              // Tag name
  attrs?: Record<string, any>
  children?: RichTextNode[]
  text?: string              // For type='text'
}
```
