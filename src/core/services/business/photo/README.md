# photo 服务迁移与接口清单

## 目录结构规划

- `service/`：photo 业务服务实现
- `types/`：photo 相关类型定义
- `README.md`：迁移说明与接口清单

## 主要接口与方法清单

- `findByUserIdOrdered(userId: string): Promise<Photo[]>`  获取指定用户照片，按顺序返回
- `updateCaption(photoId: string, caption: string): Promise<void>`  更新照片标题
- `updateTags(photoId: string, tags: string[]): Promise<void>`  更新照片标签

> 可扩展：上传、删除、设置头像等

## 迁移说明

- 仅依赖 Repository 层，禁止直接操作 ORM
- 保证类型安全，所有类型定义集中于 `types/`
- 迁移后所有数据库操作均通过 `PhotoRepository` 封装

## 依赖说明

- 依赖 `PhotoRepository`（已存在于 `src/core/lib/db/repositories/impl/photo-repository.ts`）
- 依赖类型 `Photo`（定义于 `src/core/lib/db/types/photo.types.ts`）

## TODO

- [ ] 完成 service 迁移
- [ ] 完善类型定义
- [ ] 编写/补充测试用例
- [ ] 更新迁移任务表