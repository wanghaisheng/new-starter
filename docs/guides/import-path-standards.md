# 导入路径规范

## 导入路径标准化

为了提高代码的可读性、可维护性和一致性，本项目采用绝对导入路径而非相对导入路径。这份文档详细说明了我们的导入路径规范和最佳实践。

## 1. 核心原则

### 1.1 使用 `@/` 前缀进行导入

**必须使用** 以 `@/` 开头的绝对路径进行模块导入，而非相对路径。

```typescript
// ✅ 推荐
import { Button } from '@/core/components/ui/Button';
import { useUserStore } from '@/core/stores/user-store';
import { formatDate } from '@/utils/date-utils';

// ❌ 避免
import { Button } from '../../../core/components/ui/Button';
import { useUserStore } from '../../stores/user-store';
import { formatDate } from './date-utils';
```

### 1.2 导入顺序规范

导入语句应按以下顺序组织：

```typescript
// 1. React/Next.js导入
import React, { useState } from 'react';
import { useRouter } from 'next/router';

// 2. 第三方库导入
import { IonButton } from '@ionic/react';
import clsx from 'clsx';

// 3. 项目内导入（使用 @/ 前缀）
import { useI18n } from '@/core/lib/i18n/config';
import { Button } from '@/core/components/ui/Button';
import { formatDate } from '@/utils/date-utils';

// 4. 类型导入
import type { User } from '@/core/models/user';

// 5. 样式导入
import styles from './Component.module.css';
```

## 2. 优势与理由

### 2.1 使用绝对路径的优势

1. **清晰明确** - 立即显示模块在项目结构中的位置
2. **重构友好** - 文件移动时不需要更新导入路径
3. **避免路径地狱** - 不会出现多级 `../../../` 嵌套导入
4. **提高可读性** - 新团队成员更容易理解依赖关系
5. **简化维护** - IDE 自动导入更加准确可靠

### 2.2 示例对比

考虑以下场景：

```
src/
├── core/
│   ├── components/
│   │   └── Button.tsx
│   └── utils/
│       └── format.ts
└── features/
    └── user/
        └── Profile.tsx
```

在 `Profile.tsx` 中导入 `Button.tsx` 和 `format.ts`：

```typescript
// ✅ 绝对路径（推荐）
import { Button } from '@/core/components/Button';
import { formatDate } from '@/core/utils/format';

// ❌ 相对路径（避免）
import { Button } from '../../core/components/Button';
import { formatDate } from '../../core/utils/format';
```

如果 `Profile.tsx` 文件位置改变，使用绝对路径则无需更新导入语句。

## 3. 配置与实现

### 3.1 TypeScript 配置

项目的 `tsconfig.json` 已配置好路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 3.2 ESLint 规则

我们使用 ESLint 规则强制执行导入路径规范：

```js
module.exports = {
  rules: {
    'no-relative-import-paths/no-relative-import-paths': [
      'error',
      { allowSameFolder: true, rootDir: 'src', prefix: '@' }
    ]
  }
};
```

## 4. 实际应用示例

### 4.1 组件导入

```typescript
// src/features/user/UserProfile.tsx
import { Avatar } from '@/core/components/ui/Avatar';
import { Card } from '@/core/components/ui/Card';
import { formatDateRelative } from '@/utils/date-utils';
import { useUserData } from '@/features/user/hooks/useUserData';
```

### 4.2 服务层导入

```typescript
// src/core/services/user-service.ts
import { api } from '@/core/lib/api';
import { logger } from '@/core/lib/logger';
import { UserNotFoundError } from '@/core/errors/user-errors';
import type { User, UserPreference } from '@/core/models/user';
```

### 4.3 库和工具导入

```typescript
// src/core/lib/db/clients/firebase/firebase-client.ts
import { collection, query, where } from 'firebase/firestore';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import { FirebaseError } from '@/core/lib/db/errors/database-errors';
import { logger } from '@/core/lib/logger';
```

## 5. 迁移指南

对于现有代码库，按照以下步骤迁移到绝对导入路径：

1. 使用 IDE 的"查找并替换"功能搜索相对导入
2. 使用 ESLint 规则 `no-relative-import-paths` 检测违规情况
3. 优先迁移核心组件和共享模块
4. 在代码审查中强制执行此规范

## 6. 常见问题解答

**问：为什么不使用相对路径导入同一目录下的文件？**  
答：为了一致性，我们建议对所有导入使用 `@/` 前缀。唯一的例外是样式导入（`.css`、`.scss` 等）。

**问：如何处理测试文件的导入？**  
答：测试文件也应使用 `@/` 前缀导入，确保与源代码保持一致的导入风格。

**问：如何处理类型导入？**  
答：类型导入也应使用 `@/` 前缀，并优先使用 `import type` 语法。 