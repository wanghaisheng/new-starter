# 前端组件目录结构与使用规范

本项目采用分层组件结构，统一管理通用与端专属组件，提升复用性和可维护性。本文档说明 `src/core/components` 与 `src/mobile/components` 的分工、使用场景与最佳实践。

---

## 目录结构约定

```
src/
├── core/
│   └── components/
│       ├── ui/                # 通用基础UI组件（Button、Card、LoadingSpinner等）
│       ├── quiz/              # Quiz/测评业务通用组件（QuizTypeCard、QuizInfoForm等）
│       ├── common/            # 通用功能组件（LoadingScreen、ErrorScreen等）
│       └── ...                # 其它业务无关、可复用组件
├── mobile/
│   └── components/
│       ├── navigation/        # 移动端导航相关组件
│       ├── cards/             # 移动端专属卡片交互（如滑动卡片）
│       ├── messages/          # 移动端聊天专属组件
│       ├── profile/           # 移动端用户资料专属组件
│       └── ...                # 仅移动端使用的 UI/功能组件
```

---

## 组件分工原则

### 1. `src/core/components/`
- **职责：** 所有“通用组件”与“业务通用组件”统一放在此目录。
- **适用范围：** web端、移动端均可直接 import 使用。
- **示例：**
  - `ui/`：Button、Card、Input、LoadingSpinner、Icon 等原子级UI。
  - `quiz/`：QuizTypeCard、QuizInfoForm、QuizQuestionCard、QuizResultCard 等测评业务通用组件。
  - `common/`：LoadingScreen、ErrorScreen 等常用页面级反馈组件。
- **命名建议：** 组件名用业务+功能组合（如 QuizTypeCard、ProfileEditor）。

### 2. `src/mobile/components/`
- **职责：** 仅用于移动端专属 UI/交互组件。
- **适用范围：** 仅移动端页面 import。
- **示例：**
  - `navigation/`：BottomNavBar、NavigationBar。
  - `cards/`：SwipeCard、CardStack。
  - `messages/`：ChatList、MessageBubble、MessageInput。
  - `profile/`：UserProfileCard、InterestTags。
- **命名建议：** 强调端专属、交互特性。

---

## 组件开发与引用规范

1. **优先复用 core/components 下的通用组件，避免重复实现。**
2. 如需新建 quiz、profile、chat 等业务组件，优先在 core/components/业务/ 下实现，必要时通过 props 适配不同端。
3. 仅当组件高度依赖移动端交互（如手势、原生导航、端专属动画）时，才放入 mobile/components/。
4. 页面 import 路径统一用 `@/core/components/...` 或 `@/mobile/components/...`，禁止相对路径跨层引用。
5. 组件文档、示例代码建议同步补充到 `docs/guides/` 或 Storybook。

---

## 典型用法示例

```tsx
// 通用 quiz 业务组件
import { QuizTypeCard } from '@/core/components/quiz';

// 移动端专属导航栏
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
```

---

## FAQ
- **Q: 某组件 web/mobile 都要用，放哪？**
  - 答：放 core/components/，通过 props 适配各端需求。
- **Q: 目录下发现重复组件怎么办？**
  - 答：优先合并到 core/components/，并全局替换引用，删除冗余实现。

---

如有疑问或需新增业务组件，请先查阅本规范并在 PR 中说明归属理由。
