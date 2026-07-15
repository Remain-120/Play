#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🔍 开始检查构建配置...\n')

// 1. 检查 vite.config.js
const viteConfigPath = join(projectRoot, 'vite.config.js')
console.log('1. 检查 Vite 配置...')
if (existsSync(viteConfigPath)) {
  try {
    const viteConfigContent = readFileSync(viteConfigPath, 'utf-8')
    // 简单检查是否包含 uni 插件
    if (viteConfigContent.includes('@dcloudio/vite-plugin-uni')) {
      console.log('   ✅ vite.config.js 包含 uni-app 插件')
    } else {
      console.log('   ⚠️  vite.config.js 可能缺少 @dcloudio/vite-plugin-uni 插件')
    }
    // 检查是否配置了正确的 server 设置
    if (viteConfigContent.includes('host: true') || viteConfigContent.includes('host: \'true\'')) {
      console.log('   ✅ Vite server 配置了 host: true (支持局域网访问)')
    } else {
      console.log('   ℹ️  Vite server 未配置 host: true，可能无法通过 IP 访问')
    }
  } catch (err) {
    console.log('   ❌ 读取 vite.config.js 失败:', err.message)
  }
} else {
  console.log('   ❌ vite.config.js 不存在')
}

// 2. 检查 pages.json
const pagesJsonPath = join(projectRoot, 'pages.json')
console.log('\n2. 检查页面路由配置...')
if (existsSync(pagesJsonPath)) {
  try {
    const pagesJsonContent = readFileSync(pagesJsonPath, 'utf-8')
    const pagesConfig = JSON.parse(pagesJsonContent)
    
    // 检查 pages 数组
    if (pagesConfig.pages && Array.isArray(pagesConfig.pages)) {
      console.log(`   ✅ pages.json 包含 ${pagesConfig.pages.length} 个页面`)
      
      // 检查每个页面的 path 格式
      let hasInvalidPath = false
      pagesConfig.pages.forEach((page, index) => {
        if (!page.path || typeof page.path !== 'string') {
          console.log(`   ⚠️   第 ${index + 1} 个页面缺少 path 字段`)
          hasInvalidPath = true
        } else if (!page.path.startsWith('pages/')) {
          console.log(`   ⚠️   页面 "${page.path}" 的路径应以 "pages/" 开头`)
          hasInvalidPath = true
        }
      })
      if (!hasInvalidPath) {
        console.log('   ✅ 所有页面路径格式正确')
      }
    } else {
      console.log('   ⚠️  pages.json 缺少 pages 数组')
    }
    
    // 检查 tabBar 配置
    if (pagesConfig.tabBar && pagesConfig.tabBar.list) {
      console.log(`   ✅ 底部 tabBar 配置了 ${pagesConfig.tabBar.list.length} 个项目`)
    } else {
      console.log('   ℹ️  未配置底部 tabBar')
    }
  } catch (err) {
    console.log('   ❌ 解析 pages.json 失败:', err.message)
  }
} else {
  console.log('   ❌ pages.json 不存在')
}

// 3. 检查动态导入使用情况
console.log('\n3. 检查动态导入使用情况...')
function collectFiles(dir, extensions, ignoreDirs = ['node_modules']) {
  const files = []
  function scan(currentDir) {
    if (ignoreDirs.some(ignore => currentDir.includes(ignore))) {
      return
    }
    try {
      const items = readdirSync(currentDir)
      for (const item of items) {
        const fullPath = join(currentDir, item)
        try {
          const stat = statSync(fullPath)
          if (stat.isDirectory()) {
            scan(fullPath)
          } else if (extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath)
          }
        } catch (err) {
          // 忽略无法访问的文件
        }
      }
    } catch (err) {
      // 忽略无法读取的目录
    }
  }
  scan(dir)
  return files
}

try {
  const targetDirs = [
    join(projectRoot, 'pages'),
    join(projectRoot, 'components'),
    join(projectRoot, 'utils'),
    projectRoot
  ]
  const files = []
  for (const dir of targetDirs) {
    if (existsSync(dir)) {
      files.push(...collectFiles(dir, ['.vue', '.js']))
    }
  }
  
  let dynamicImportCount = 0
  const dynamicImportFiles = []
  
  for (const file of files.slice(0, 100)) { // 限制检查文件数量
    try {
      const content = readFileSync(file, 'utf-8')
      // 匹配 import() 语法
      const importRegex = /import\s*\(\s*['"`](.*?)['"`]\s*\)/g
      const matches = [...content.matchAll(importRegex)]
      if (matches.length > 0) {
        dynamicImportCount += matches.length
        dynamicImportFiles.push({
          file: file.replace(projectRoot, ''),
          matches: matches.map(m => m[1])
        })
      }
    } catch (err) {
      // 忽略读取错误
    }
  }
  
  if (dynamicImportCount === 0) {
    console.log('   ✅ 未检测到动态导入 (import()) 语法')
  } else {
    console.log(`   ⚠️  检测到 ${dynamicImportCount} 处动态导入，可能在小程序环境中存在问题:`)
    dynamicImportFiles.forEach(item => {
      console.log(`      - ${item.file}:`)
      item.matches.forEach(mod => console.log(`          import('${mod}')`))
    })
    console.log('\n   💡 建议:')
    console.log('      uni-app 小程序环境对动态导入支持有限，建议使用静态导入或条件加载')
    console.log('      如需代码分割，请使用 uni-app 官方推荐的分包加载机制')
  }
} catch (err) {
  console.log('   ⚠️  动态导入检查跳过:', err.message)
}

// 4. 检查分包配置
console.log('\n4. 检查分包配置...')
try {
  const pagesJsonContent = readFileSync(pagesJsonPath, 'utf-8')
  const pagesConfig = JSON.parse(pagesJsonContent)
  
  if (pagesConfig.subPackages && pagesConfig.subPackages.length > 0) {
    console.log(`   ✅ 配置了 ${pagesConfig.subPackages.length} 个分包`)
    pagesConfig.subPackages.forEach((sub, idx) => {
      console.log(`      ${idx + 1}. ${sub.root} (${sub.pages?.length || 0}个页面)`)
    })
  } else if (pagesConfig.subpackages && pagesConfig.subpackages.length > 0) {
    console.log(`   ✅ 配置了 ${pagesConfig.subpackages.length} 个分包 (subpackages 字段)`)
  } else {
    console.log('   ℹ️  未配置分包，如需优化首屏加载可考虑使用分包加载')
  }
} catch (err) {
  console.log('   ℹ️  分包检查跳过:', err.message)
}

// 5. 检查 manifest.json
const manifestPath = join(projectRoot, 'manifest.json')
console.log('\n5. 检查应用 manifest 配置...')
if (existsSync(manifestPath)) {
  try {
    const manifestContent = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)
    
    if (manifest['mp-weixin']) {
      console.log('   ✅ 存在微信小程序配置')
      const mpWeixin = manifest['mp-weixin']
      if (mpWeixin.appid) {
        console.log('   ✅ 已配置小程序 AppID')
      } else {
        console.log('   ⚠️  未配置小程序 AppID')
      }
    } else {
      console.log('   ℹ️  缺少微信小程序配置')
    }
  } catch (err) {
    console.log('   ⚠️  解析 manifest.json 失败:', err.message)
  }
} else {
  console.log('   ❌ manifest.json 不存在')
}

console.log('\n📋 检查完成！')
console.log('\n💡 预防动态导入错误的建议:')
console.log('   1. uni-app 小程序环境不支持标准的 dynamic import()')
console.log('   2. 如需按需加载，请使用 uni-app 的条件编译或分包机制')
console.log('   3. 确保所有页面路径在 pages.json 中正确定义')
console.log('   4. 使用 @dcloudio/vite-plugin-uni 插件进行构建')
console.log('   5. 开发时使用 HBuilderX 或运行 npm run dev 启动调试')
console.log('\n🔧 可执行的修复命令:')
console.log('   - 重新安装依赖: npm install')
console.log('   - 启动开发服务器: npm run dev')
console.log('   - 构建项目: npm run build')