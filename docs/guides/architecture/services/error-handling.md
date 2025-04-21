# 错误处理服务设计指南

## 概述

错误处理服务是 HeyTCM 的核心组件之一，负责统一管理和处理系统中的各种错误。该服务采用分层设计，实现了错误捕获、分类、处理和报告的完整流程。

### 核心优势

1. **统一的错误处理**
   - 所有错误使用相同的处理流程
   - 标准化的错误格式
   - 一致的错误响应

2. **智能的错误分类**
   - 自动错误分类
   - 错误严重程度评估
   - 错误影响分析

3. **完整的错误追踪**
   - 错误上下文记录
   - 错误堆栈追踪
   - 错误传播路径

4. **灵活的错误恢复**
   - 自动重试机制
   - 降级策略
   - 错误恢复方案

## 架构设计

### 核心组件

1. **错误捕获器 (Error Catcher)**
   - 全局错误捕获
   - 错误上下文收集
   - 错误预处理

2. **错误分类器 (Error Classifier)**
   - 错误类型识别
   - 错误严重程度评估
   - 错误影响分析

3. **错误处理器 (Error Handler)**
   - 错误处理策略
   - 错误恢复机制
   - 错误通知

4. **错误报告器 (Error Reporter)**
   - 错误日志记录
   - 错误监控告警
   - 错误统计分析

### 目录结构

```
src/core/services/error/
├── types/               # 错误处理类型
│   ├── error-service.ts  # 错误服务接口
│   ├── error-types.ts    # 错误类型定义
│   ├── error-context.ts  # 错误上下文
│   └── error-handler.ts  # 错误处理器
├── catchers/            # 错误捕获器
│   ├── global/          # 全局错误捕获
│   ├── api/             # API错误捕获
│   ├── ui/              # UI错误捕获
│   └── service/         # 服务错误捕获
├── classifiers/         # 错误分类器
│   ├── type/            # 类型分类
│   ├── severity/        # 严重程度分类
│   └── impact/          # 影响分类
├── handlers/            # 错误处理器
│   ├── retry/           # 重试处理器
│   ├── fallback/        # 降级处理器
│   └── recovery/        # 恢复处理器
└── reporters/           # 错误报告器
    ├── logger/          # 日志报告
    ├── monitor/         # 监控报告
    └── analytics/       # 分析报告
```

### 配置示例

```typescript
{
  "error": {
    "catchers": {
      "global": {
        "enabled": true,
        "ignorePatterns": ["/favicon.ico"]
      },
      "api": {
        "enabled": true,
        "timeout": 5000
      },
      "ui": {
        "enabled": true,
        "captureUnhandledRejections": true
      }
    },
    "classifiers": {
      "type": {
        "enabled": true,
        "customTypes": ["BusinessError", "ValidationError"]
      },
      "severity": {
        "enabled": true,
        "levels": ["critical", "error", "warning", "info"]
      }
    },
    "handlers": {
      "retry": {
        "enabled": true,
        "maxAttempts": 3,
        "backoff": "exponential"
      },
      "fallback": {
        "enabled": true,
        "strategies": ["cache", "mock", "offline"]
      }
    },
    "reporters": {
      "logger": {
        "enabled": true,
        "level": "error",
        "format": "json"
      },
      "monitor": {
        "enabled": true,
        "service": "sentry",
        "dsn": "..."
      }
    }
  }
}
```

### 接口定义

```typescript
interface IErrorService {
  // 错误捕获
  catch(error: Error, context?: ErrorContext): Promise<void>;
  catchGlobal(error: Error): Promise<void>;
  catchApi(error: Error, request: Request): Promise<void>;
  catchUI(error: Error, component: string): Promise<void>;
  
  // 错误分类
  classify(error: Error): Promise<ErrorClassification>;
  getSeverity(error: Error): Promise<ErrorSeverity>;
  getImpact(error: Error): Promise<ErrorImpact>;
  
  // 错误处理
  handle(error: Error, options?: ErrorHandlerOptions): Promise<ErrorHandlingResult>;
  retry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
  fallback<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T>;
  
  // 错误报告
  report(error: Error, options?: ReportOptions): Promise<void>;
  getErrorStats(options?: StatsOptions): Promise<ErrorStats>;
  getErrorTrends(options?: TrendOptions): Promise<ErrorTrends>;
}

// 错误上下文
interface ErrorContext {
  timestamp: Date;
  source: string;
  component?: string;
  request?: Request;
  user?: User;
  metadata?: Record<string, any>;
}

// 错误分类
interface ErrorClassification {
  type: string;
  severity: ErrorSeverity;
  impact: ErrorImpact;
  category: string;
  tags: string[];
}

// 错误处理结果
interface ErrorHandlingResult {
  handled: boolean;
  recovered: boolean;
  action: string;
  details?: any;
}

// 错误统计
interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byComponent: Record<string, number>;
  trends: ErrorTrends;
}
```

## 实现建议

### 1. 错误捕获

1. **全局错误捕获**
   - 实现全局错误处理器
   - 捕获未处理的异常
   - 收集错误上下文
   - 预处理错误信息

2. **API错误捕获**
   - 拦截API请求
   - 捕获网络错误
   - 处理超时错误
   - 记录请求上下文

3. **UI错误捕获**
   - 捕获组件错误
   - 处理渲染错误
   - 记录用户操作
   - 保存UI状态

### 2. 错误分类

1. **类型分类**
   - 识别错误类型
   - 自定义错误类型
   - 错误类型映射
   - 类型优先级

2. **严重程度分类**
   - 评估错误影响
   - 确定错误级别
   - 设置处理优先级
   - 触发告警阈值

3. **影响分析**
   - 分析错误范围
   - 评估业务影响
   - 确定恢复策略
   - 制定处理方案

### 3. 错误处理

1. **重试机制**
   - 实现重试策略
   - 设置重试次数
   - 配置退避算法
   - 处理重试超时

2. **降级策略**
   - 实现降级方案
   - 使用缓存数据
   - 返回默认值
   - 启用离线模式

3. **恢复机制**
   - 实现恢复策略
   - 数据一致性检查
   - 状态恢复
   - 资源清理

### 4. 错误报告

1. **日志记录**
   - 结构化日志
   - 错误上下文
   - 堆栈追踪
   - 性能指标

2. **监控告警**
   - 实时监控
   - 告警规则
   - 通知渠道
   - 告警升级

3. **统计分析**
   - 错误趋势
   - 影响分析
   - 性能影响
   - 改进建议

## 最佳实践

1. **错误预防**
   - 输入验证
   - 边界检查
   - 资源管理
   - 状态检查

2. **错误处理**
   - 优雅降级
   - 自动恢复
   - 用户通知
   - 问题追踪

3. **错误分析**
   - 根因分析
   - 趋势分析
   - 影响评估
   - 改进建议

4. **错误监控**
   - 实时监控
   - 性能监控
   - 用户监控
   - 系统监控

## 示例

### 错误捕获示例

```typescript
// 全局错误捕获
window.addEventListener('error', (event) => {
  errorService.catchGlobal(event.error);
});

// API错误捕获
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }
} catch (error) {
  await errorService.catchApi(error, request);
}

// UI错误捕获
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    errorService.catchUI(error, this.props.component);
  }
}
```

### 错误处理示例

```typescript
// 重试机制
const result = await errorService.retry(
  async () => {
    return await fetchData();
  },
  {
    maxAttempts: 3,
    backoff: 'exponential'
  }
);

// 降级策略
const data = await errorService.fallback(
  async () => {
    return await fetchData();
  },
  async () => {
    return await getCachedData();
  }
);

// 错误报告
await errorService.report(error, {
  level: 'error',
  tags: ['api', 'critical'],
  notify: true
});
```

## 注意事项

1. **错误分类**
   - 清晰的错误类型
   - 合理的严重程度
   - 准确的影响评估
   - 完整的错误上下文

2. **错误处理**
   - 适当的重试策略
   - 有效的降级方案
   - 可靠的恢复机制
   - 及时的错误通知

3. **错误报告**
   - 详细的错误信息
   - 完整的错误上下文
   - 准确的错误统计
   - 有效的监控告警

4. **性能考虑**
   - 错误处理开销
   - 日志记录性能
   - 监控系统负载
   - 资源使用优化 