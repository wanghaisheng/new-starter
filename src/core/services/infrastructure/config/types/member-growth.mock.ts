import { MemberGrowthConfig } from "./member-growth.types";

export const mockMemberGrowthConfig: MemberGrowthConfig = {
  version: "1.0.0",
  levels: [
    {
      level: 1,
      name: "普通会员",
      expRequired: 0,
      privileges: ["基础聊天", "浏览公开资料"],
      icon: "/icons/level1.png",
      color: "#B0E0E6",
      descriptionI18n: { zh: "普通用户等级", en: "Basic User" },
    },
    {
      level: 2,
      name: "活跃会员",
      expRequired: 200,
      privileges: ["基础聊天", "浏览公开资料", "查看访客", "解锁更多匹配"],
      icon: "/icons/level2.png",
      color: "#87CEFA",
      descriptionI18n: { zh: "活跃用户等级", en: "Active User" },
    },
    {
      level: 3,
      name: "高级会员",
      expRequired: 1000,
      privileges: ["全部功能", "无限喜欢", "专属身份标识", "优先推荐"],
      icon: "/icons/level3.png",
      color: "#FFD700",
      descriptionI18n: { zh: "高级用户等级", en: "Premium User" },
    },
  ],
  segment: "all",
  region: "CN",
  updatedAt: "2025-04-21T16:00:00+08:00",
  updatedBy: "admin",
  permissions: ["admin", "ops"],
  metadata: { note: "真实场景模拟数据" },
};
