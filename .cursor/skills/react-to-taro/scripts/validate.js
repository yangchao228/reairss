#!/usr/bin/env node

/**
 * Taro 代码验证器
 *
 * 检查转换后的 Taro 代码是否符合规范
 * 发现潜在问题并给出修复建议
 *
 * 用法: node validate.js <file-or-directory>
 */

const fs = require('fs')
const path = require('path')

// ============================================
// 验证规则
// ============================================

const RULES = [
  {
    id: 'no-web-elements',
    severity: 'error',
    description: '不应包含 Web 原生元素',
    patterns: [
      /<div(?:\s|>)/gi,
      /<span(?:\s|>)/gi,
      /<p(?:\s|>)/gi,
      /<img(?:\s|>)/gi,
      /<input(?:\s|>)/gi,
      /<button(?:\s|>)/gi,
      /<a(?:\s|>)/gi,
      /<h[1-6](?:\s|>)/gi
    ],
    message: '发现 Web 原生元素，请替换为 Taro 组件'
  },
  {
    id: 'no-react-router',
    severity: 'error',
    description: '不应包含 react-router-dom',
    patterns: [
      /from\s*['"]react-router-dom['"]/g,
      /useNavigate\s*\(\)/g,
      /useLocation\s*\(\)/g,
      /useParams\s*\(\)/g,
      /<Link\s+to/g,
      /<NavLink/g,
      /<Outlet/g
    ],
    message: '发现 react-router-dom 相关代码，请迁移到 Taro 路由'
  },
  {
    id: 'no-axios',
    severity: 'warning',
    description: '不应直接使用 axios',
    patterns: [
      /import\s+axios/g,
      /axios\.(get|post|put|delete)/g
    ],
    message: '发现 axios 调用，建议使用 Taro.request'
  },
  {
    id: 'no-dom-api',
    severity: 'error',
    description: '不应使用 DOM API',
    patterns: [
      /document\.(getElementById|querySelector|querySelectorAll)/g,
      /document\.body/g,
      /window\.(location|history)/g,
      /\.getBoundingClientRect\(\)/g
    ],
    message: '发现 DOM API 调用，请使用 Taro.createSelectorQuery'
  },
  {
    id: 'no-localstorage',
    severity: 'error',
    description: '不应使用 localStorage',
    patterns: [
      /localStorage\./g,
      /sessionStorage\./g
    ],
    message: '发现 localStorage/sessionStorage，请使用 Taro Storage API'
  },
  {
    id: 'no-alert',
    severity: 'error',
    description: '不应使用 alert/confirm',
    patterns: [
      /\balert\s*\(/g,
      /\bconfirm\s*\(/g
    ],
    message: '发现 alert/confirm，请使用 Taro.showToast/showModal'
  },
  {
    id: 'event-target-value',
    severity: 'error',
    description: '不应使用 e.target.value',
    patterns: [
      /e\.target\.value/g,
      /event\.target\.value/g
    ],
    message: '发现 e.target.value，Taro 中应使用 e.detail.value'
  },
  {
    id: 'onchange-handler',
    severity: 'warning',
    description: 'Input 不应使用 onChange',
    patterns: [
      /onChange\s*=\s*\{[^}]*\}/g
    ],
    message: 'Input 组件应使用 onInput 而非 onChange'
  },
  {
    id: 'view-inside-text',
    severity: 'warning',
    description: 'Text 内部不应有 View',
    patterns: [
      /<Text[^>]*>[\s\S]*?<View/g
    ],
    message: 'Text 组件内部不能包含 View，请重构结构'
  },
  {
    id: 'undefined-state',
    severity: 'warning',
    description: '不应使用 undefined 作为 state 值',
    patterns: [
      /setState\([^)]*undefined/g,
      /useState\(\s*undefined\s*\)/g
    ],
    message: 'Mini Program 不支持 undefined，请使用 null'
  },
  {
    id: 'double-quotes',
    severity: 'info',
    description: '建议使用单引号',
    patterns: [
      /=\s*"[^"]+"/g
    ],
    check: (line) => {
      // 排除 JSX 属性
      return !line.includes('className=') && !line.includes('style=')
    },
    message: 'Taro 建议使用单引号，避免编译问题'
  },
  {
    id: 'process-env-destructure',
    severity: 'warning',
    description: '不应解构 process.env',
    patterns: [
      /const\s*\{[^}]+\}\s*=\s*process\.env/g
    ],
    message: '不要解构 process.env，直接使用 process.env.XXX'
  },
  {
    id: 'missing-taro-import',
    severity: 'error',
    description: '缺少 Taro 导入',
    check: (content) => {
      const hasTaroComponent = /<(View|Text|Image|Button|Input|ScrollView)/.test(content)
      const hasTaroImport = /import\s+.*from\s*['"]@tarojs\/(taro|components)['"]/.test(content)
      return hasTaroComponent && !hasTaroImport
    },
    message: '使用了 Taro 组件但未导入 @tarojs/components'
  },
  {
    id: 'function-prop-naming',
    severity: 'warning',
    description: '函数 props 应以 on 开头',
    patterns: [
      /(?:handle|callback|action)\w*\s*=\s*\{[^}]*\}/gi
    ],
    message: '传递给子组件的函数 props 应以 on 开头'
  }
]

// ============================================
// 验证函数
// ============================================

function validateFile(filePath, content) {
  const results = {
    file: filePath,
    errors: [],
    warnings: [],
    info: []
  }

  const lines = content.split('\n')

  RULES.forEach(rule => {
    // 使用自定义检查函数
    if (rule.check && typeof rule.check === 'function') {
      if (rule.check(content)) {
        const result = {
          id: rule.id,
          message: rule.message,
          description: rule.description
        }
        results[rule.severity === 'error' ? 'errors' : rule.severity === 'warning' ? 'warnings' : 'info'].push(result)
      }
      return
    }

    // 使用正则模式
    rule.patterns?.forEach(pattern => {
      lines.forEach((line, index) => {
        const lineNum = index + 1
        pattern.lastIndex = 0

        if (pattern.test(line)) {
          // 如果有额外的检查函数
          if (rule.check && !rule.check(line)) return

          const result = {
            id: rule.id,
            line: lineNum,
            code: line.trim().substring(0, 60),
            message: rule.message,
            description: rule.description
          }

          if (rule.severity === 'error') {
            results.errors.push(result)
          } else if (rule.severity === 'warning') {
            results.warnings.push(result)
          } else {
            results.info.push(result)
          }
        }
      })
    })
  })

  // 去重
  results.errors = dedupeResults(results.errors)
  results.warnings = dedupeResults(results.warnings)
  results.info = dedupeResults(results.info)

  return results
}

function dedupeResults(results) {
  const seen = new Set()
  return results.filter(r => {
    const key = `${r.id}-${r.line || 0}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============================================
// 输出格式化
// ============================================

function formatResults(results) {
  const output = []

  const hasIssues = results.errors.length > 0 || results.warnings.length > 0

  if (!hasIssues) {
    output.push(`  ✅ ${results.file} - 验证通过`)
    return output.join('\n')
  }

  output.push(`\n📁 ${results.file}`)
  output.push('─'.repeat(50))

  if (results.errors.length > 0) {
    output.push('\n🔴 错误:')
    results.errors.forEach(e => {
      output.push(`  L${e.line || '?'}: [${e.id}] ${e.message}`)
      if (e.code) output.push(`       ${e.code}`)
    })
  }

  if (results.warnings.length > 0) {
    output.push('\n🟡 警告:')
    results.warnings.forEach(w => {
      output.push(`  L${w.line || '?'}: [${w.id}] ${w.message}`)
      if (w.code) output.push(`       ${w.code}`)
    })
  }

  if (results.info.length > 0 && process.env.VERBOSE) {
    output.push('\n🔵 建议:')
    results.info.forEach(i => {
      output.push(`  L${i.line || '?'}: [${i.id}] ${i.message}`)
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
    console.log('用法: node validate.js <file-or-directory>')
    console.log('选项:')
    console.log('  VERBOSE=1 node validate.js <path>  显示所有信息级别提示')
    process.exit(1)
  }

  const target = args[0]
  const stat = fs.statSync(target)

  let files = []
  if (stat.isDirectory()) {
    files = scanDirectory(target)
    console.log(`\n🔍 验证目录: ${target}`)
    console.log(`📄 扫描 ${files.length} 个文件`)
  } else {
    files = [target]
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('🔎 Taro 代码验证器')
  console.log(`${'='.repeat(60)}`)

  let totalErrors = 0
  let totalWarnings = 0
  let passedFiles = 0

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8')
    const results = validateFile(file, content)

    totalErrors += results.errors.length
    totalWarnings += results.warnings.length

    if (results.errors.length === 0 && results.warnings.length === 0) {
      passedFiles++
    }

    console.log(formatResults(results))
  })

  // 总结
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 验证结果')
  console.log(`${'='.repeat(60)}`)
  console.log(`  📄 扫描文件: ${files.length}`)
  console.log(`  ✅ 通过: ${passedFiles}`)
  console.log(`  🔴 错误: ${totalErrors}`)
  console.log(`  🟡 警告: ${totalWarnings}`)

  if (totalErrors > 0) {
    console.log('\n❌ 验证失败，请修复上述错误')
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  验证通过，但有警告需要关注')
    process.exit(0)
  } else {
    console.log('\n✅ 验证通过!')
    process.exit(0)
  }
}

main()
