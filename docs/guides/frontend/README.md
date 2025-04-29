# 移动端前端开发指南

## 移动端页面与后端服务映射矩阵（除设置页）

| 页面 | 前端 Hook/Service | Hooks Provider | 后端 Service/Repository | 主要业务功能说明 | 后端实现情况/缺口 |
|--|--|--|--|--|--|
| 登录 login | useAuth | 是 | AuthService / login | 用户登录、鉴权 | 已实现，支持多方式登录 |
| 注册 register | useAuth | 是 | AuthService / register | 用户注册、信息校验 | 已实现，支持邮箱/手机号注册 |
| 手机号登录 phone | useAuth | 是 | AuthService / phoneLogin | 手机号快捷登录 | 已实现，需完善短信验证 |
| 聊天会话 chat/conversation | useMessages | 是 | MessageService / sendMessage, fetchMessages | 聊天消息收发 | 已实现，支持基本消息功能 |
| 聊天列表 chat/list | useMessages | 是 | MessageService / fetchConversations | 聊天会话列表 | 已实现 |
| 发现页 discover | useApi, useRequireAuth | 否 | UserService / getRecommended | 推荐用户、滑动匹配 | 已实现，推荐算法可优化 |
| 首页 home | useAuth, useMatches, useRecommendedUsers | 是 | UserService / getRecommended, MatchService / createMatch | 推荐、滑动、配对 | 已实现，部分推荐逻辑可优化 |
| 配对列表 matches/page | useMatches | 是 | MatchService / getUserMatches | 展示用户配对 | 已实现 |
| 配对详情 matches/[id] | useUser, useMatches, useMessages | 是 | MatchService / getMatchDetail, MessageService | 配对详情、聊天入口 | 已实现 |
| 配对聊天 matches/chat | useMessages | 是 | MessageService | 配对内聊天 | 已实现 |
| 配对消息 matches/messages | useMessages | 是 | MessageService | 历史消息列表 | 已实现 |
| 配对弹窗 matches/match-screen | useRequireAuth | 否 | - | 新配对提示弹窗 | 纯前端，无后端依赖 |
| 会员中心 member-center | useMemberCenter, useRestorePurchases, usePaymentHistory | 是 | MemberService / getSubscriptions, PaymentService | 会员订阅、支付记录 | 已实现，支付需对接真实通道 |
| 新手引导 onboard | useOnboard, useAuth, useToast | 是 | UserService / onboard | 新用户引导流程 | 已实现，部分步骤可扩展 |
| 个人主页 profile/page | useUser | 是 | UserService / getUser | 展示个人信息 | 已实现 |
| 资料编辑 profile/edit | useUser, useRequireAuth, CameraServiceFactory | 是 | UserService / updateUser | 编辑个人资料、拍照上传 | 已实现，拍照依赖设备支持 |
| 资料设置 profile/setup | useRequireAuth | 否 | UserService / setupProfile | 首次资料完善 | 已实现 |
| 头像上传 profile/setup-photos | useImageUpload, useRequireAuth | 否 | UserService / uploadPhoto | 上传/删除头像 | 已实现 |
| 资料查看 profile/view | useRequireAuth | 否 | UserService / getUser | 查看他人资料 | 已实现 |
| 测验列表 quiz/page | useQuizzes, useRequireAuth | 是 | QuizService / fetchQuizzes | 展示测验列表 | 已实现 |
| 测验详情 quiz/[id]/info | useQuizService, useRequireAuth | 是 | QuizService / getQuiz, saveUserInfo | 展示测验信息、保存用户信息 | 已实现，保存用户信息需后端支持 |
| 测验答题 quiz/[id]/page | useQuizQuestions, useRequireAuth | 是 | QuizService / fetchQuestions, submitAnswers | 答题、保存进度 | 已实现，答题提交需后端完善 |
| 测验结果 quiz/[id]/result | useQuizResult | 是 | QuizService / fetchResult | 展示测验结果 | 已实现 |
| 订阅页 subscribe | useSubscribe, useRequireAuth, useLocale, useTranslations | 是 | SubscribeService / subscribe | 会员订阅购买 | 已实现，支付需对接真实通道 |

> 以上为 app/mobile 下除 settings 以外页面的前后端映射矩阵，便于团队发现遗漏服务或 provider，持续补齐优化。

## 移动端设置页面与后端服务映射矩阵
> 建议：
> 1. 持续完善矩阵中标记为“需完善”或“部分实现”的后端服务，确保所有页面的 hooks provider 和后端接口都能完整覆盖业务需求。
> 2. 对于尚未实现或仅为 mock 的功能（如设备管理、账号删除、支付通道等），应优先补齐后端实现。
> 3. 建议定期同步前后端开发进度，保持矩阵的实时更新，便于团队协作和问题追踪。
> 4. 新功能上线时，请同步维护此映射表，确保文档与实际开发保持一致，方便新成员快速了解系统结构。
## 说明
- 上述所有“SettingServiceRegistry”均为统一服务注册表，实际调用时由 useSetting 等 hook 内部自动获取。
- 部分页面如“关于”、“帮助”、“服务条款”为纯前端静态内容，无需后端支撑。
- 账号删除、设备管理等功能目前为 mock，需后端补齐真实接口。
- 具体接口定义与实现详见 src/core/services/business/user/setting-service 及相关类型定义。

## 后续计划
- 持续完善未实现或部分实现的后端服务，确保所有页面功能完整。
- 补齐和优化各页面 hooks provider，提升前后端协作效率。
- 定期同步前后端开发进度，保持映射表和文档实时更新。
- 优先补齐支付通道、设备管理、账号删除等 mock 功能的后端实现。
- 新功能上线时同步维护映射表，便于团队成员快速了解系统结构。
- 持续优化推荐算法、完善用户引导及支付体验。