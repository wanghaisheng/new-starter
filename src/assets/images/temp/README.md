# 临时SVG图标

本目录存放项目开发过程中使用的临时SVG图标和插图资源，遵循UI素材管理指南中的规范。

## 使用说明

1. 临时SVG图标用于在设计素材尚未最终确定或提供时，提供临时替代品
2. 所有临时SVG文件应遵循命名规范：`{name}-temp.svg`
3. 临时SVG应简洁明了，使用最少的元素表达图标/图片的核心含义

## 已有临时图标

- `home-icon-temp.svg` - 首页导航图标
- `loading-animation-temp.svg` - 加载动画
- `empty-state-temp.svg` - 空状态插图

## 使用方法

在React组件中使用临时图标：

```tsx
import { TempIcon } from '@/core/components/ui/icons';

function MyComponent() {
  return (
    <div>
      <TempIcon name="home" size={24} color="#333" />
      <TempIcon name="loading" size={32} />
      <TempIcon name="empty-state" size={48} />
    </div>
  );
}
```

## 注意事项

1. 临时SVG仅用于开发阶段，最终会被实际设计替换
2. 添加新的临时SVG时，请同时更新TempIcon组件和assets-inventory.csv文件
3. 临时SVG应保持简洁，避免使用复杂的SVG特性