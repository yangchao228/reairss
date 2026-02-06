#!/usr/bin/env node

/**
 * 生成转换建议脚本
 *
 * 读取分析报告，为每个文件生成具体的转换指令
 * 供 Agent 直接执行
 *
 * 用法: node generate-transforms.js <report.json>
 */

const fs = require('fs')
const path = require('path')

// ============================================
// 转换规则生成器
// ============================================

function generateImportTransforms(report) {
  const transforms = []

  // 检查路由 imports
  if (report.routes?.imports?.length > 0) {
    transforms.push({
      type: 'import',
      action: 'remove',
      description: '移除 react-router-dom imports',
      locations: report.routes.imports.map(i => i.line)
    })

    transforms.push({
      type: 'import',
      action: 'add',
      description: '添加 Taro imports',
      code: `import Taro, { useLoad, useDidShow, useReady } from '@tarojs/taro'`
    })
  }

  // 检查需要的 Taro 组件
  const neededComponents = new Set()

  if (report.jsx?.containers?.length > 0) neededComponents.add('View')
  if (report.jsx?.textElements?.length > 0) neededComponents.add('Text')
  if (report.jsx?.media?.length > 0) neededComponents.add('Image')
  if (report.jsx?.form?.length > 0) {
    report.jsx.form.forEach(item => {
      if (item.element === 'input') neededComponents.add('Input')
      if (item.element === 'textarea') neededComponents.add('Textarea')
      if (item.element === 'button') neededComponents.add('Button')
      if (item.element === 'form') neededComponents.add('Form')
    })
  }
  if (report.jsx?.links?.length > 0) neededComponents.add('Navigator')

  if (neededComponents.size > 0) {
    transforms.push({
      type: 'import',
      action: 'add',
      description: '添加 Taro 组件 imports',
      code: `import { ${[...neededComponents].sort().join(', ')} } from '@tarojs/components'`
    })
  }

  // axios/fetch 替换
  if (report.apis?.axios?.length > 0 || report.apis?.fetch?.length > 0) {
    transforms.push({
      type: 'import',
      action: 'remove',
      description: '移除 axios import (如有)',
      pattern: `import axios from 'axios'`
    })
  }

  return transforms
}

function generateJsxTransforms(report) {
  const transforms = []

  // Container elements
  if (report.jsx?.containers?.length > 0) {
    const grouped = groupByElement(report.jsx.containers)
    Object.entries(grouped).forEach(([element, items]) => {
      transforms.push({
        type: 'jsx',
        action: 'replace-tag',
        description: `<${element}> → <View>`,
        from: element,
        to: 'View',
        locations: items.map(i => i.line),
        count: items.length
      })
    })
  }

  // Text elements
  if (report.jsx?.textElements?.length > 0) {
    const grouped = groupByElement(report.jsx.textElements)
    Object.entries(grouped).forEach(([element, items]) => {
      transforms.push({
        type: 'jsx',
        action: 'replace-tag',
        description: `<${element}> → <Text>`,
        from: element,
        to: 'Text',
        locations: items.map(i => i.line),
        count: items.length,
        warning: '确保 Text 内部没有 View/块级元素'
      })
    })
  }

  // Image elements
  if (report.jsx?.media?.length > 0) {
    transforms.push({
      type: 'jsx',
      action: 'replace-tag',
      description: '<img> → <Image>',
      from: 'img',
      to: 'Image',
      locations: report.jsx.media.map(i => i.line),
      count: report.jsx.media.length,
      attributes: [
        { add: 'mode="widthFix"', condition: '默认添加' },
        { add: 'lazyLoad', condition: '如果在循环中' }
      ],
      removeAttributes: ['alt']
    })
  }

  // Form elements
  if (report.jsx?.form?.length > 0) {
    const grouped = groupByElement(report.jsx.form)

    if (grouped.input) {
      transforms.push({
        type: 'jsx',
        action: 'replace-tag',
        description: '<input> → <Input>',
        from: 'input',
        to: 'Input',
        locations: grouped.input.map(i => i.line),
        eventTransform: {
          from: 'onChange={(e) => fn(e.target.value)}',
          to: 'onInput={(e) => fn(e.detail.value)}'
        },
        attributeTransform: {
          'type="password"': 'password'
        }
      })
    }

    if (grouped.button) {
      transforms.push({
        type: 'jsx',
        action: 'replace-tag',
        description: '<button> → <Button>',
        from: 'button',
        to: 'Button',
        locations: grouped.button.map(i => i.line),
        attributeTransform: {
          'type="submit"': 'formType="submit"'
        }
      })
    }
  }

  // Links
  if (report.jsx?.links?.length > 0) {
    transforms.push({
      type: 'jsx',
      action: 'replace-component',
      description: '<a href="..."> → <Navigator url="..."> 或 Taro.navigateTo',
      from: 'a',
      locations: report.jsx.links.map(i => i.line),
      options: [
        { to: 'Navigator', urlFormat: '/pages{path}/index' },
        { to: 'onClick handler', code: 'onClick={() => Taro.navigateTo({ url: "/pages{path}/index" })}' }
      ]
    })
  }

  return transforms
}

function generateEventTransforms(report) {
  const transforms = []

  if (report.events?.needsTransform?.length > 0) {
    const grouped = {}
    report.events.needsTransform.forEach(item => {
      if (!grouped[item.event]) grouped[item.event] = []
      grouped[item.event].push(item)
    })

    Object.entries(grouped).forEach(([event, items]) => {
      const first = items[0]
      transforms.push({
        type: 'event',
        action: 'replace',
        description: `${event} → ${first.target || '需评估'}`,
        from: event,
        to: first.target,
        note: first.note,
        locations: items.map(i => i.line),
        count: items.length,
        codePattern: {
          from: `${event}={(e) => fn(e.target.value)}`,
          to: first.target ? `${first.target}={(e) => fn(e.detail.value)}` : '需要手动评估'
        }
      })
    })
  }

  return transforms
}

function generateRouteTransforms(report) {
  const transforms = []

  // Hooks
  if (report.routes?.hooks?.length > 0) {
    report.routes.hooks.forEach(hook => {
      if (hook.hook.includes('useNavigate')) {
        transforms.push({
          type: 'route',
          action: 'remove-hook',
          description: '移除 useNavigate hook',
          line: hook.line,
          variable: hook.variable,
          replacement: {
            navigateCall: `Taro.navigateTo({ url: '/pages/{path}/index' })`,
            replaceCall: `Taro.redirectTo({ url: '/pages/{path}/index' })`,
            backCall: 'Taro.navigateBack()'
          }
        })
      }

      if (hook.hook.includes('useLocation') || hook.hook.includes('useParams')) {
        transforms.push({
          type: 'route',
          action: 'replace-hook',
          description: '替换路由参数获取方式',
          line: hook.line,
          from: hook.hook,
          to: `const ${hook.variable || 'params'} = Taro.getCurrentInstance().router?.params || {}`,
          alternative: `useLoad((params) => { /* 使用 params */ })`
        })
      }
    })
  }

  // Link components
  if (report.routes?.components?.length > 0) {
    transforms.push({
      type: 'route',
      action: 'replace-component',
      description: 'Link 组件迁移',
      items: report.routes.components.map(c => ({
        line: c.line,
        from: `<Link to="${c.path}">`,
        to: `<Navigator url="/pages${c.path}/index">`,
        alternative: `<View onClick={() => Taro.navigateTo({ url: '/pages${c.path}/index' })}>`
      }))
    })
  }

  return transforms
}

function generateApiTransforms(report) {
  const transforms = []

  // Axios
  if (report.apis?.axios?.length > 0) {
    transforms.push({
      type: 'api',
      action: 'replace',
      description: 'axios → Taro.request',
      locations: report.apis.axios.map(i => i.line),
      pattern: {
        from: `axios.get(url, { params })`,
        to: `Taro.request({ url, method: 'GET', data: params })`
      },
      responseChange: 'res.status → res.statusCode',
      note: 'URL 需要使用完整路径'
    })
  }

  // Storage
  if (report.apis?.storage?.length > 0) {
    transforms.push({
      type: 'api',
      action: 'replace',
      description: 'localStorage → Taro Storage',
      locations: report.apis.storage.map(i => i.line),
      patterns: [
        { from: `localStorage.setItem('key', JSON.stringify(val))`, to: `Taro.setStorageSync('key', val)` },
        { from: `JSON.parse(localStorage.getItem('key'))`, to: `Taro.getStorageSync('key')` },
        { from: `localStorage.removeItem('key')`, to: `Taro.removeStorageSync('key')` }
      ]
    })
  }

  // Alerts
  if (report.apis?.alerts?.length > 0) {
    transforms.push({
      type: 'api',
      action: 'replace',
      description: 'alert/confirm → Taro UI',
      locations: report.apis.alerts.map(i => i.line),
      patterns: [
        { from: `alert(msg)`, to: `Taro.showToast({ title: msg, icon: 'none' })` },
        { from: `confirm(msg)`, to: `await Taro.showModal({ content: msg })` }
      ]
    })
  }

  // DOM
  if (report.apis?.dom?.length > 0) {
    transforms.push({
      type: 'api',
      action: 'replace',
      description: 'DOM API → Taro Query',
      locations: report.apis.dom.map(i => i.line),
      pattern: {
        from: `document.getElementById('el')`,
        to: `Taro.createSelectorQuery().select('#el')`
      },
      warning: '需要重构为异步回调模式'
    })
  }

  return transforms
}

// ============================================
// 辅助函数
// ============================================

function groupByElement(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.element]) acc[item.element] = []
    acc[item.element].push(item)
    return acc
  }, {})
}

function formatTransforms(transforms, filePath) {
  let output = []

  output.push(`\n${'━'.repeat(60)}`)
  output.push(`📝 转换指令: ${filePath}`)
  output.push(`${'━'.repeat(60)}`)

  // 按类型分组输出
  const byType = transforms.reduce((acc, t) => {
    if (!acc[t.type]) acc[t.type] = []
    acc[t.type].push(t)
    return acc
  }, {})

  const typeIcons = { import: '📦', jsx: '🏷️', event: '⚡', route: '🔀', api: '🔌' }
  const typeNames = { import: 'Import 转换', jsx: 'JSX 转换', event: '事件转换', route: '路由转换', api: 'API 转换' }

  Object.entries(byType).forEach(([type, items]) => {
    output.push(`\n${typeIcons[type]} ${typeNames[type]}:`)
    output.push('─'.repeat(40))

    items.forEach((t, idx) => {
      output.push(`\n  [${idx + 1}] ${t.description}`)

      if (t.action === 'add') {
        output.push(`      ➕ 添加: ${t.code}`)
      }

      if (t.action === 'remove') {
        output.push(`      ➖ 移除位置: L${t.locations?.join(', L') || t.pattern}`)
      }

      if (t.action === 'replace-tag') {
        output.push(`      🔄 ${t.from} → ${t.to}`)
        output.push(`      📍 位置 (${t.count}处): L${t.locations.join(', L')}`)
        if (t.warning) output.push(`      ⚠️  ${t.warning}`)
        if (t.attributes) {
          t.attributes.forEach(attr => {
            output.push(`      ➕ ${attr.add} (${attr.condition})`)
          })
        }
      }

      if (t.action === 'replace') {
        output.push(`      🔄 ${t.from} → ${t.to}`)
        if (t.codePattern) {
          output.push(`      📝 ${t.codePattern.from}`)
          output.push(`         → ${t.codePattern.to}`)
        }
        if (t.patterns) {
          t.patterns.forEach(p => {
            output.push(`      📝 ${p.from}`)
            output.push(`         → ${p.to}`)
          })
        }
      }

      if (t.note) output.push(`      💡 ${t.note}`)
      if (t.responseChange) output.push(`      ⚠️  响应结构变更: ${t.responseChange}`)
    })
  })

  return output.join('\n')
}

// ============================================
// 主程序
// ============================================

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('用法: node generate-transforms.js <report.json>')
    console.log('示例: node generate-transforms.js ./taro-migration-report.json')
    process.exit(1)
  }

  const reportPath = args[0]

  if (!fs.existsSync(reportPath)) {
    console.error(`❌ 报告文件不存在: ${reportPath}`)
    console.log('请先运行: node analyze.js <source-dir>')
    process.exit(1)
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))

  console.log(`\n🔧 React to Taro 转换指令生成器`)
  console.log(`${'='.repeat(60)}`)

  const allTransforms = []

  report.files.forEach(fileReport => {
    if (fileReport.issues.length === 0) return

    const transforms = [
      ...generateImportTransforms(fileReport),
      ...generateJsxTransforms(fileReport),
      ...generateEventTransforms(fileReport),
      ...generateRouteTransforms(fileReport),
      ...generateApiTransforms(fileReport)
    ]

    if (transforms.length > 0) {
      console.log(formatTransforms(transforms, fileReport.file))
      allTransforms.push({
        file: fileReport.file,
        transforms
      })
    }
  })

  // 输出 JSON
  const outputPath = path.join(process.cwd(), 'taro-transforms.json')
  fs.writeFileSync(outputPath, JSON.stringify(allTransforms, null, 2))
  console.log(`\n💾 转换指令已保存: ${outputPath}`)

  // 统计
  const totalTransforms = allTransforms.reduce((sum, f) => sum + f.transforms.length, 0)
  console.log(`\n📊 共生成 ${totalTransforms} 条转换指令，涉及 ${allTransforms.length} 个文件`)
}

main()
