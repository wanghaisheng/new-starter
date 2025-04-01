module.exports = {
  extends: ['next/core-web-vitals'],
  plugins: ['no-relative-import-paths'],
  rules: {
    // 禁止使用相对导入路径，强制使用 @/ 前缀的绝对路径
    'no-relative-import-paths/no-relative-import-paths': [
      'error',
      { allowSameFolder: true, rootDir: '.', prefix: '@' }
    ],
    // 导入排序规则
    'import/order': [
      'warn',
      {
        groups: [
          'builtin', // 内置模块
          'external', // 第三方库
          'internal', // 项目内部模块（使用别名的导入）
          ['parent', 'sibling'], // 父目录和兄弟目录
          'index', // 当前目录
          'object', // 对象导入
          'type' // 类型导入
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        },
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before'
          },
          {
            pattern: 'next/**',
            group: 'builtin',
            position: 'after'
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before'
          }
        ],
        pathGroupsExcludedImportTypes: ['react']
      }
    ]
  }
}; 