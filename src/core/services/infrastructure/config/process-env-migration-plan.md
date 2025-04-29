# process.env 直读用法整改计划

**目标**：全面消除代码库中直接读取 `process.env` 的用法，统一通过配置服务（`getConfigService()`）获取环境变量，提升多环境一致性与可维护性。

---

## 一、整改背景与风险

- 现状：全项目范围内存在大量 `process.env` 直读，分布于配置、注册表、工厂、适配器、服务入口等各层。
- 风险：
  - 多环境配置不一致，热更新与 mock/生产切换不可靠。
  - 代码分散、难以追踪和维护。
  - 配置变更需重启，无法动态热切换。

---

## 二、整改原则

1. **唯一入口**：所有环境变量、配置项统一通过 `getConfigService()` 获取。
2. **集中声明**：所有变量在 ConfigSchema 中集中声明，便于管理和类型校验。
3. **分阶段推进**：优先整改核心服务和工厂、注册表层，其次适配器、业务层。
4. **兼容性过渡**：必要时保留兼容逻辑，明确标注 deprecated，逐步淘汰。

---

## 三、整改步骤

### 1. 全量扫描与标记
- 已完成对 src 目录下所有 `process.env` 直读用法的扫描，生成待整改文件清单。
- 在每处直读代码处添加 `// TODO(process-env-migration):` 注释，便于追踪。

### 2. 优先级排序
- **优先级A（必须首批整改）**：
  - 配置服务相关（config/registry/factory/index.ts 等）
  - 服务工厂、注册表（如 logger-factory、network-factory、email-factory 等）
- **优先级B**：
  - 各类适配器（如 image-adapter、sensor-adapter、location-adapter 等）
  - 业务入口与初始化脚本
- **优先级C**：
  - 业务层零散用法、测试脚本、文档示例

### 3. 统一改造方案
- 将所有 `process.env.XXX` 替换为 `getConfigService().get('XXX')`，如需类型安全可补充 ConfigSchema。
- 工厂和注册表需注入 configService 实例或在构造时统一获取。
- 适配器层通过注入 config、options 等参数传递配置。
- 清理冗余的 fallback/process.env 逻辑。

### 4. 校验与测试
- 增加单元测试/集成测试，确保多环境下配置读取一致。
- 检查所有 mock/生产/本地/测试环境切换场景。

---

## 四、进度追踪与责任人

| 文件/模块 | 负责人 | 计划完成时间 | 备注 |
|-----------|--------|--------------|------|
| config/registry/factory | xxx | yyyy-mm-dd | 首批 |
| logger-factory          | xxx | yyyy-mm-dd | 首批 |
| network-factory         | xxx | yyyy-mm-dd | 首批 |
| email-factory           | xxx | yyyy-mm-dd | 首批 |
| ...（补充完整）         |      |            |      |

> 建议每次 PR 仅聚焦一类服务，便于回溯和 review。

---

## 五、豁免说明

**配置服务自身（config-factory.ts、config-registry.ts、config-service.ts 及其适配器）为配置根层，允许直接读取 process.env，不纳入本次整改范围。**

- 原因：配置服务根层负责初始化自身，不能依赖 getConfigService()，否则会导致循环依赖和初始化死锁。
- 业务层、外围服务、hooks、Provider 等必须通过 getConfigService() 获取配置变量，严禁 process.env 直读。
- 如需扩展豁免范围，请在本节补充说明。

---

## 六、附录：常见替换示例

```diff
- const env = process.env.NODE_ENV || 'production';
+ const env = getConfigService().get('NODE_ENV') || 'production';

- const provider = process.env.EMAIL_PROVIDER || 'default';
+ const provider = getConfigService().get('EMAIL_PROVIDER') || 'default';

- const logLevel = process.env.LOG_LEVEL || 'INFO';
+ const logLevel = getConfigService().get('LOG_LEVEL') || 'INFO';
```

---

如需自动化脚本或批量替换工具，请联系基础架构组。
