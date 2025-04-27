# 业务服务设计规范（2025重构实践）

> 本文档聚焦于业务服务（business service）分层、职责与最佳实践，所有内容以 src/core/services/business/user 等实际实现为标准。
> 
> - 数据服务设计规范详见 [../data/README.md](../data/README.md)
> - 基础服务设计规范详见 [../infrastructure/README.md](../infrastructure/README.md)

---

## 一、分层定位与原则

- **业务服务层（business）**：只负责领域业务逻辑聚合、编排、业务规则和跨模块协调，不直接实现或管理底层 provider/adapter/注册表/工厂。
- **数据服务层（data）**：聚合多数据源和仓储，向业务服务提供统一数据访问接口。
- **基础服务层（infrastructure）**：负责通用技术能力、三方服务、端适配、provider/mock/remote 等。
- 业务服务通过依赖注入数据服务和基础服务能力实现解耦，严禁跨层直接依赖底层实现。

---

## 二、目录结构与职责示例

```text
src/core/services/business/user/
├── service/             # 业务聚合服务实现（如 user-service.ts）
├── types/               # 业务服务接口定义（如 user-service.ts）
└── ...                  # 其它业务相关文件
```
- service/ 仅实现领域聚合逻辑，所有数据访问通过注入的数据服务/仓储接口完成。
- types/ 只定义聚合服务接口，不包含 adapter/provider/工厂等插件化相关类型。

---

## 三、业务服务设计实践（以 user 为例）

### 1. 接口定义（types/user-service.ts）

```typescript
export interface IUserService {
  getCurrentUser(): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  saveCurrentUser(user: User): Promise<void>;
  getUsers(): Promise<QueryResult<User>>;
  saveUsers(users: User[]): Promise<void>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  syncOfflineProfileUpdates(): Promise<number>;
  // ...如需聚合更多业务逻辑可继续扩展
}
```

### 2. 业务服务实现（service/user-service.ts）

```typescript
export class UserService implements IUserService {
  private userRepo: IUserRepository;
  private dataService: any;

  constructor(dataService: IDataService, userRepo: IUserRepository) {
    this.dataService = dataService;
    this.userRepo = userRepo;
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.userRepo.findById('current');
  }
  // ...其余方法同接口定义
}
```
- 业务服务通过构造函数依赖注入数据服务和仓储接口，便于测试和解耦。
- 不涉及 provider/adapter/工厂/注册表等插件化逻辑。

---

## 四、最佳实践与注意事项

- 业务服务只负责领域逻辑聚合与编排，所有底层能力通过依赖注入获取。
- 禁止在业务服务层实现/管理 provider/adapter/工厂/注册表等插件化能力。
- 业务服务接口和实现应聚焦于领域模型和业务规则，便于团队协作和自动化测试。
- 如需扩展业务逻辑，仅在业务服务层聚合，不影响底层实现。
- 业务服务变更需同步更新 types/ 和 service/，保持类型安全和一致性。

---

> 如需了解数据服务和基础服务的插件化、注册表、工厂等架构模式，请参阅对应目录下 README。