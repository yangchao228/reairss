#!/usr/bin/env node

/**
 * React to Taro 转换分析器
 *
 * 扫描 React 源代码，生成转换报告，标记需要处理的位置
 *
 * 用法: node analyze.js <file-or-directory>
 * 输出: 转换报告 (JSON + 可读文本)
 */

const fs = require('fs')
const path = require('path')

// ============================================
// 配置: 需要检测的模式
// ============================================

const JSX_MAPPINGS = {
  // Container elements → View
  containers: ['div', 'section', 'article', 'main', 'nav', 'aside', 'header', 'footer', 'ul', 'ol', 'li'],
  // Text elements → Text
  textElements: ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'strong', 'em', 'b', 'i'],
  // Media → Image
  media: ['img'],
  // Form elements
  form: ['input', 'textarea', 'button', 'form', 'select', 'option'],
  // Links → Navigator or Taro.navigateTo
  links: ['a']
}

const EVENT_MAPPINGS = {
  // 需要转换的事件
  needsTransform: {
    'onChange': { target: 'onInput', note: 'e.target.value → e.detail.value' },
    'onKeyDown': { target: 'onConfirm', note: '仅 Enter 键场景' },
    'onKeyPress': { target: 'onConfirm', note: '仅 Enter 键场景' },
    'onKeyUp': { target: null, note: '检查是否需要 onConfirm' }
  },
  // 保持不变但需要注意的事件
  keepButNote: ['onClick', 'onFocus', 'onBlur', 'onSubmit', 'onScroll']
}

const ROUTE_PATTERNS = {
  imports: [
    /import\s*\{[^}]*(?:useNavigate|useLocation|useParams|useSearchParams|Link|NavLink|Outlet|Routes|Route)[^}]*\}\s*from\s*['"]react-router-dom['"]/g,
    /import\s*\{[^}]*(?:BrowserRouter|HashRouter|Router)[^}]*\}\s*from\s*['"]react-router-dom['"]/g
  ],
  hooks: [
    /const\s+(\w+)\s*=\s*useNavigate\s*\(\)/g,
    /const\s+(\w+)\s*=\s*useLocation\s*\(\)/g,
    /const\s+\{([^}]+)\}\s*=\s*useParams\s*\(\)/g,
    /const\s+\[([^\]]+)\]\s*=\s*useSearchParams\s*\(\)/g
  ],
  components: [
    /<Link\s+to\s*=\s*[{"]([^}"]+)[}"]/g,
    /<NavLink\s+to\s*=\s*[{"]([^}"]+)[}"]/g,
    /<Outlet\s*\/?\s*>/g
  ],
  navigateCalls: [
    /(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/g,  // navigate('/path')
    /(\w+)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*replace\s*:\s*true/g  // navigate('/path', { replace: true })
  ]
}

const API_PATTERNS = {
  axios: [
    /import\s+axios\s+from\s*['"]axios['"]/g,
    /axios\.(get|post|put|delete|patch|request)\s*\(/g,
    /axios\s*\(\s*\{/g
  ],
  fetch: [
    /fetch\s*\(\s*['"`]/g
  ],
  storage: [
    /localStorage\.(setItem|getItem|removeItem|clear)/g,
    /sessionStorage\.(setItem|getItem|removeItem|clear)/g
  ],
  dom: [
    /document\.(getElementById|querySelector|querySelectorAll)\s*\(/g,
    /document\.body/g,
    /window\.(location|history|scrollTo|addEventListener)/g
  ],
  alerts: [
    /\balert\s*\(/g,
    /\bconfirm\s*\(/g,
    /\bprompt\s*\(/g
  ]
}

// ============================================
// 分析函数
// ============================================

function analyzeFile(filePath, content) {
  const report = {
    file: filePath,
    issues: [],
    jsx: { containers: [], textElements: [], media: [], form: [], links: [] },
    events: { needsTransform: [], keepButNote: [] },
    routes: { imports: [], hooks: [], components: [], navigateCalls: [] },
    apis: { axios: [], fetch: [], storage: [], dom: [], alerts: [] }
  }

  const lines = content.split('\n')

  // 分析每一行
  lines.forEach((line, index) => {
    const lineNum = index + 1

    // JSX 元素检测
    Object.entries(JSX_MAPPINGS).forEach(([category, elements]) => {
      elements.forEach(element => {
        const regex = new RegExp(`<${element}(?:\\s|>|\\/)`, 'gi')
        if (regex.test(line)) {
          report.jsx[category].push({
            line: lineNum,
            element,
            code: line.trim(),
            suggestion: getSuggestion(category, element)
          })
        }
      })
    })

    // 事件处理器检测
    Object.entries(EVENT_MAPPINGS.needsTransform).forEach(([event, info]) => {
      const regex = new RegExp(`${event}\\s*=\\s*\\{`, 'g')
      if (regex.test(line)) {
        report.events.needsTransform.push({
          line: lineNum,
          event,
          target: info.target,
          note: info.note,
          code: line.trim()
        })
      }
    })

    EVENT_MAPPINGS.keepButNote.forEach(event => {
      const regex = new RegExp(`${event}\\s*=\\s*\\{`, 'g')
      if (regex.test(line)) {
        report.events.keepButNote.push({
          line: lineNum,
          event,
          code: line.trim()
        })
      }
    })

    // 路由检测
    ROUTE_PATTERNS.imports.forEach(pattern => {
      const match = line.match(pattern)
      if (match) {
        report.routes.imports.push({ line: lineNum, code: line.trim() })
      }
    })

    ROUTE_PATTERNS.hooks.forEach(pattern => {
      const matches = [...line.matchAll(pattern)]
      matches.forEach(match => {
        report.routes.hooks.push({
          line: lineNum,
          hook: match[0],
          variable: match[1],
          code: line.trim()
        })
      })
    })

    // Link/NavLink 检测
    const linkMatch = line.match(/<(?:Link|NavLink)\s+to\s*=\s*[{"]([^}"]+)[}"]/)
    if (linkMatch) {
      report.routes.components.push({
        line: lineNum,
        path: linkMatch[1],
        code: line.trim()
      })
    }

    // API 检测
    Object.entries(API_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(line)) {
          report.apis[category].push({
            line: lineNum,
            code: line.trim()
          })
        }
        pattern.lastIndex = 0  // Reset regex
      })
    })
  })

  // 生成 issues 摘要
  generateIssues(report)

  return report
}

function getSuggestion(category, element) {
  const suggestions = {
    containers: `<${element}> → <View>`,
    textElements: `<${element}> → <Text> (确保内部无块级元素)`,
    media: `<${element}> → <Image mode="widthFix"> (循环中加 lazyLoad)`,
    form: getFormSuggestion(element),
    links: `<${element}> → <Navigator> 或 Taro.navigateTo()`
  }
  return suggestions[category]
}

function getFormSuggestion(element) {
  const formSuggestions = {
    input: '<input> → <Input> (onChange→onInput, e.target.value→e.detail.value)',
    textarea: '<textarea> → <Textarea> (同上)',
    button: '<button> → <Button> (type="submit"→formType="submit")',
    form: '<form> → <Form> (onSubmit 保持)',
    select: '<select> → <Picker> (需要重构)',
    option: '移除，配合 Picker 重构'
  }
  return formSuggestions[element] || `<${element}> 需要手动处理`
}

function generateIssues(report) {
  // JSX issues
  const jsxCount = Object.values(report.jsx).reduce((sum, arr) => sum + arr.length, 0)
  if (jsxCount > 0) {
    report.issues.push({
      type: 'jsx',
      severity: 'high',
      count: jsxCount,
      message: `发现 ${jsxCount} 个需要转换的 JSX 元素`
    })
  }

  // Event issues
  if (report.events.needsTransform.length > 0) {
    report.issues.push({
      type: 'events',
      severity: 'high',
      count: report.events.needsTransform.length,
      message: `发现 ${report.events.needsTransform.length} 个需要转换的事件处理器`
    })
  }

  // Route issues
  const routeCount = report.routes.imports.length + report.routes.hooks.length + report.routes.components.length
  if (routeCount > 0) {
    report.issues.push({
      type: 'routes',
      severity: 'high',
      count: routeCount,
      message: `发现 ${routeCount} 处路由相关代码需要迁移`
    })
  }

  // API issues
  const apiCount = Object.values(report.apis).reduce((sum, arr) => sum + arr.length, 0)
  if (apiCount > 0) {
    report.issues.push({
      type: 'apis',
      severity: 'medium',
      count: apiCount,
      message: `发现 ${apiCount} 处 Web API 需要替换为 Taro API`
    })
  }
}

// ============================================
// 输出格式化
// ============================================

function formatReport(report) {
  let output = []

  output.push(`\n${'='.repeat(60)}`)
  output.push(`📁 文件: ${report.file}`)
  output.push(`${'='.repeat(60)}`)

  // Issues 摘要
  if (report.issues.length > 0) {
    output.push('\n📋 问题摘要:')
    report.issues.forEach(issue => {
      const icon = issue.severity === 'high' ? '🔴' : '🟡'
      output.push(`  ${icon} [${issue.type}] ${issue.message}`)
    })
  } else {
    output.push('\n✅ 未发现需要转换的内容')
    return output.join('\n')
  }

  // JSX 详情
  const hasJsx = Object.values(report.jsx).some(arr => arr.length > 0)
  if (hasJsx) {
    output.push('\n📦 JSX 元素转换:')
    Object.entries(report.jsx).forEach(([category, items]) => {
      if (items.length > 0) {
        output.push(`\n  [${category}]`)
        items.forEach(item => {
          output.push(`    L${item.line}: ${item.element}`)
          output.push(`      建议: ${item.suggestion}`)
        })
      }
    })
  }

  // Events 详情
  if (report.events.needsTransform.length > 0) {
    output.push('\n⚡ 事件处理器转换:')
    report.events.needsTransform.forEach(item => {
      output.push(`  L${item.line}: ${item.event} → ${item.target || '需评估'}`)
      output.push(`    注意: ${item.note}`)
    })
  }

  // Routes 详情
  const hasRoutes = Object.values(report.routes).some(arr => arr.length > 0)
  if (hasRoutes) {
    output.push('\n🔀 路由迁移:')
    if (report.routes.imports.length > 0) {
      output.push('  [需删除的 imports]')
      report.routes.imports.forEach(item => {
        output.push(`    L${item.line}: ${item.code.substring(0, 60)}...`)
      })
    }
    if (report.routes.hooks.length > 0) {
      output.push('  [需替换的 hooks]')
      report.routes.hooks.forEach(item => {
        output.push(`    L${item.line}: ${item.variable} = ${item.hook}`)
        output.push(`      建议: 使用 Taro.getCurrentInstance().router.params`)
      })
    }
    if (report.routes.components.length > 0) {
      output.push('  [需替换的组件]')
      report.routes.components.forEach(item => {
        output.push(`    L${item.line}: Link to="${item.path}"`)
        output.push(`      建议: Navigator url="/pages${item.path}/index"`)
      })
    }
  }

  // APIs 详情
  const hasApis = Object.values(report.apis).some(arr => arr.length > 0)
  if (hasApis) {
    output.push('\n🔌 API 替换:')
    Object.entries(report.apis).forEach(([category, items]) => {
      if (items.length > 0) {
        const suggestions = {
          axios: 'Taro.request()',
          fetch: 'Taro.request()',
          storage: 'Taro.setStorageSync/getStorageSync',
          dom: 'Taro.createSelectorQuery()',
          alerts: 'Taro.showToast/showModal'
        }
        output.push(`  [${category}] → ${suggestions[category]}`)
        items.forEach(item => {
          output.push(`    L${item.line}: ${item.code.substring(0, 50)}...`)
        })
      }
    })
  }

  return output.join('\n')
}

// ============================================
// 主程序
// ============================================

function scanDirectory(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = []

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir)
    items.forEach(item => {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          scan(fullPath)
        }
      } else if (extensions.includes(path.extname(item))) {
        files.push(fullPath)
      }
    })
  }

  scan(dir)
  return files
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('用法: node analyze.js <file-or-directory>')
    console.log('示例: node analyze.js ./src')
    console.log('      node analyze.js ./src/components/Button.tsx')
    process.exit(1)
  }

  const target = args[0]
  const stat = fs.statSync(target)

  let files = []
  if (stat.isDirectory()) {
    files = scanDirectory(target)
    console.log(`\n🔍 扫描目录: ${target}`)
    console.log(`📄 找到 ${files.length} 个文件`)
  } else {
    files = [target]
  }

  const allReports = []
  let totalIssues = { jsx: 0, events: 0, routes: 0, apis: 0 }

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8')
    const report = analyzeFile(file, content)
    allReports.push(report)

    // 累计统计
    report.issues.forEach(issue => {
      totalIssues[issue.type] = (totalIssues[issue.type] || 0) + issue.count
    })

    // 只输出有问题的文件
    if (report.issues.length > 0) {
      console.log(formatReport(report))
    }
  })

  // 总结
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 转换统计总结')
  console.log(`${'='.repeat(60)}`)
  console.log(`  📦 JSX 元素: ${totalIssues.jsx || 0} 处`)
  console.log(`  ⚡ 事件处理器: ${totalIssues.events || 0} 处`)
  console.log(`  🔀 路由代码: ${totalIssues.routes || 0} 处`)
  console.log(`  🔌 API 调用: ${totalIssues.apis || 0} 处`)
  console.log(`  ────────────────────`)
  console.log(`  📝 总计: ${Object.values(totalIssues).reduce((a, b) => a + b, 0)} 处需要处理`)

  // 输出 JSON 报告
  const jsonReport = {
    summary: totalIssues,
    files: allReports
  }

  const reportPath = path.join(process.cwd(), 'taro-migration-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2))
  console.log(`\n💾 详细报告已保存: ${reportPath}`)
}

main()
