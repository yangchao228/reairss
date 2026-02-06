# Taro Best Practices & Platform Constraints

## JSX Limitations

### Only `.map()` for Array Rendering

```tsx
// INVALID - Will not compile
{items.filter(i => i.active).map(item => <Item />)}
{items.reduce((acc, i) => [...acc, <Item />], [])}
{items.find(i => i.id === id) && <Detail />}

// VALID - Pre-process arrays
const activeItems = items.filter(i => i.active)
const foundItem = items.find(i => i.id === id)

return (
  <View>
    {activeItems.map(item => <Item key={item.id} />)}
    {foundItem && <Detail item={foundItem} />}
  </View>
)
```

### No Object Spread in Built-in Component Props

```tsx
// INVALID for built-in components
const props = { className: 'box', onClick: handler }
<View {...props} />  // May not work correctly

// VALID - Explicit props
<View className={props.className} onClick={props.onClick} />

// Custom components can use spread (since v1.3.0-beta.0)
<CustomComponent {...props} />
```

## Props Naming Rules

### Function Props Must Start with `on`

```tsx
// INVALID
<Child handleClick={fn} callback={fn} onPress={fn} />

// VALID
<Child onClick={fn} onCallback={fn} onPress={fn} />
```

### Reserved Prop Names

Don't use these as custom prop names (they get stripped):
- `id`
- `class`
- `style`

```tsx
// INVALID
<MyComponent id="custom-id" class="custom" style="special" />

// VALID
<MyComponent componentId="custom-id" className="custom" customStyle="special" />
```

## State Management

### Never Use `undefined`

```tsx
// INVALID - Will cause issues
this.setState({ value: undefined })
const [value, setValue] = useState(undefined)

// VALID - Use null instead
this.setState({ value: null })
const [value, setValue] = useState(null)
```

### Avoid Same Field Names in State and Props

```tsx
// INVALID - Both have 'name', will conflict
interface Props { name: string }
interface State { name: string }

// VALID - Use different names
interface Props { name: string }
interface State { localName: string }
```

## DefaultProps Requirement

Always set `defaultProps` for components receiving props:

```tsx
interface Props {
  title?: string
  count?: number
  onAction?: () => void
}

function MyComponent({ title, count, onAction }: Props) {
  return (
    <View onClick={onAction}>
      <Text>{title}: {count}</Text>
    </View>
  )
}

// REQUIRED: Set defaults for all optional props
MyComponent.defaultProps = {
  title: 'Default Title',
  count: 0,
  onAction: () => {}
}
```

## Component Lifecycle Notes

### Double Rendering

In Mini Program, `constructor` and `render` may be called twice on initial load. Always add null checks:

```tsx
// INVALID - May crash on first render
return <Text>{data.name}</Text>

// VALID - Null check
return <Text>{data?.name || 'Loading...'}</Text>
```

### Route Params in componentWillMount

Route params are not available until `onLoad`. Don't rely on them in early lifecycle:

```tsx
// INVALID - params not available yet
componentWillMount() {
  const id = this.$router.params.id
  return <Child id={id} />  // id is undefined
}

// VALID - Use state and lifecycle
componentWillMount() {
  this.setState({ id: this.$router.params.id })
}

render() {
  return this.state.id && <Child id={this.state.id} />
}

// Or use hooks
useLoad((params) => {
  setId(params.id)
})
```

## Code Style

### Use Single Quotes

```tsx
// INVALID - Double quotes may cause issues
const name = "John"
<View className="container">

// VALID - Single quotes
const name = 'John'
<View className='container'>
```

### Don't Destructure process.env

```tsx
// INVALID
const { NODE_ENV } = process.env
if (NODE_ENV === 'development') {}

// VALID
if (process.env.NODE_ENV === 'development') {}
```

## Style Isolation

Mini Program components have isolated styles by default. Parent page styles don't affect children.

```typescript
// To allow external styles, configure component:
export default {
  styleIsolation: 'apply-shared'  // Apply parent styles
  // or 'shared' - Two-way style sharing
  // or 'isolated' - Default, no sharing
}
```

## Performance Optimization

### CustomWrapper for Lists

```tsx
// Wrap list items to create update boundaries
{items.map(item => (
  <CustomWrapper key={item.id}>
    <ComplexItem data={item} />
  </CustomWrapper>
))}
```

### Image Optimization

```tsx
// Always use lazyLoad in lists
<ScrollView>
  {images.map(img => (
    <Image key={img.id} src={img.url} lazyLoad mode="widthFix" />
  ))}
</ScrollView>
```

### Avoid Anonymous Functions in Loops

```tsx
// LESS OPTIMAL - Creates new function each render
{items.map(item => (
  <View onClick={() => handleClick(item.id)} />
))}

// BETTER - Use bind or CustomWrapper
{items.map(item => (
  <CustomWrapper key={item.id}>
    <View onClick={handleClick.bind(this, item.id)} />
  </CustomWrapper>
))}
```

### Use Virtual List for Large Data

For lists with 100+ items:

```tsx
import { VirtualList } from '@tarojs/components'

const Row = memo(({ index, data }) => (
  <View>{data[index].name}</View>
))

<VirtualList
  height={500}
  itemData={items}
  itemCount={items.length}
  itemSize={80}
  renderItem={Row}
/>
```

## Global Variables

For small apps without Redux:

```typescript
// global_data.ts
const globalData: Record<string, any> = {}

export function set(key: string, val: any) {
  globalData[key] = val
}

export function get(key: string) {
  return globalData[key]
}

// Usage
import { set, get } from './global_data'
set('user', userData)
const user = get('user')
```

## Children and Slots

`this.props.children` compiles to `<slot />`. Don't try to manipulate or log it:

```tsx
// INVALID - Don't print children
console.log(this.props.children)

// VALID - Just render it
render() {
  return (
    <View>
      {this.props.children}
    </View>
  )
}
```

## Passing JSX as Props

Props containing JSX must start with `render`:

```tsx
// Child component
function Dialog({ renderHeader, renderFooter, children }) {
  return (
    <View className="dialog">
      <View className="header">{renderHeader}</View>
      <View className="body">{children}</View>
      <View className="footer">{renderFooter}</View>
    </View>
  )
}

// Parent usage
<Dialog
  renderHeader={<View>Welcome!</View>}
  renderFooter={<Button>Close</Button>}
>
  <Text>Dialog content</Text>
</Dialog>
```

## Determining Page vs Component

Use `this.$componentType` to check context:

```tsx
if (this.$componentType === 'PAGE') {
  // Page-specific logic
} else if (this.$componentType === 'COMPONENT') {
  // Component-specific logic
}
```
