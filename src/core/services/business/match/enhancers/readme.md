# Match Enhancers

本目录用于存放匹配服务的增强器（Enhancer）实现。

## 设计说明
- 每个 Enhancer 负责对匹配候选池进行后处理，如排序、去重、A/B 测试、灰度发布等。
- 可按需扩展不同类型的增强器，提升匹配结果的灵活性和个性化。

## 示例
- abtest-enhancer.ts：A/B 测试增强器
- deduplicate-enhancer.ts：去重增强器
- sort-enhancer.ts：排序增强器

## 使用方式
在 match-service 中通过配置动态组合 adapter 和 enhancer，实现灵活的匹配主流程。