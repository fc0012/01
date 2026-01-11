/**
 * Property Test: 无悬空引用
 * 
 * **Feature: project-simplification, Property 1: 无悬空引用**
 * **Validates: Requirements 7.1**
 * 
 * *For any* 被移除的模块，系统中不应存在对该模块的 require/import 语句
 */

const fs = require('fs');
const path = require('path');
const fc = require('fast-check');

// 已移除的模块列表
const REMOVED_MODULES = [
  // 后端模块
  'IRC',
  'ExternalScript',
  'Watch',
  'WatchMod',
  'PushMod',
  // 下载器客户端
  'client/tr',
  'client/de',
  // 推送模块
  'libs/push/',
  // 前端模块
  'api/watch',
  'api/notification',
  'api/script',
  'api/linkRule',
  'pages/task/WatchCategory',
  'pages/task/Subscribe',
  'pages/task/Script',
  'pages/task/CodeScript',
  'pages/task/Link',
  'pages/task/BulkLink',
  'pages/history/WatchCategory',
  'pages/history/Subscribe',
  'pages/tool/MikanHistory',
  'pages/tool/NetworkTest',
  'pages/tool/Hosts',
  'pages/tool/Proxy',
  'pages/tool/PathGenerator',
  'pages/rule/Link'
];

// 递归获取所有 JS/Vue 文件
function getAllFiles(dir, extensions = ['.js', '.vue']) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git
      if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 检查文件内容是否包含对已移除模块的引用
function checkFileForRemovedModules(filePath, removedModule) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 构建正则表达式来匹配 require 或 import 语句
  const patterns = [
    new RegExp(`require\\s*\\([^)]*${removedModule}[^)]*\\)`, 'i'),
    new RegExp(`import\\s+.*from\\s+['"'][^'"]*${removedModule}[^'"]*['"]`, 'i'),
    new RegExp(`import\\s+['"'][^'"]*${removedModule}[^'"]*['"]`, 'i')
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      return {
        found: true,
        file: filePath,
        module: removedModule
      };
    }
  }
  
  return { found: false };
}

describe('Property 1: 无悬空引用', () => {
  const appFiles = getAllFiles(path.join(__dirname, '../../app'));
  const webuiFiles = getAllFiles(path.join(__dirname, '../../webui/src'));
  const allFiles = [...appFiles, ...webuiFiles];
  
  test('后端代码不应包含对已移除模块的引用', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...REMOVED_MODULES),
        fc.constantFrom(...appFiles.filter(f => f.endsWith('.js'))),
        (removedModule, filePath) => {
          const result = checkFileForRemovedModules(filePath, removedModule);
          if (result.found) {
            throw new Error(`发现悬空引用: ${result.file} 引用了已移除的模块 ${result.module}`);
          }
          return true;
        }
      ),
      { numRuns: Math.min(100, appFiles.length * REMOVED_MODULES.length) }
    );
  });
  
  test('前端代码不应包含对已移除模块的引用', () => {
    if (webuiFiles.length === 0) {
      console.log('跳过: 没有找到前端文件');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...REMOVED_MODULES),
        fc.constantFrom(...webuiFiles),
        (removedModule, filePath) => {
          const result = checkFileForRemovedModules(filePath, removedModule);
          if (result.found) {
            throw new Error(`发现悬空引用: ${result.file} 引用了已移除的模块 ${result.module}`);
          }
          return true;
        }
      ),
      { numRuns: Math.min(100, webuiFiles.length * REMOVED_MODULES.length) }
    );
  });
  
  test('所有文件都不应包含对已移除模块的引用 (全量检查)', () => {
    const violations = [];
    
    for (const file of allFiles) {
      for (const module of REMOVED_MODULES) {
        const result = checkFileForRemovedModules(file, module);
        if (result.found) {
          violations.push(result);
        }
      }
    }
    
    if (violations.length > 0) {
      const message = violations.map(v => `${v.file} -> ${v.module}`).join('\n');
      throw new Error(`发现 ${violations.length} 个悬空引用:\n${message}`);
    }
  });
});
