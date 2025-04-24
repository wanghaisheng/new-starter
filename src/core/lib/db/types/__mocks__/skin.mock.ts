import { SkinConfig } from "./skin.types";

export const mockSkinConfig: SkinConfig = {
  version: "1.0.0",
  skins: [
    {
      id: "valentine",
      name: "情人节皮肤",
      nameI18n: { zh: "情人节皮肤", en: "Valentine Skin" },
      theme: "valentine",
      background: "/skins/valentine-bg.png",
      startAt: "2025-02-14",
      endAt: "2025-02-15",
      description: "情人节专属浪漫皮肤，粉色主题，心形元素点缀。",
      isActive: false,
      analyticsId: "skin_valentine",
    },
    {
      id: "summer2025",
      name: "盛夏清新",
      nameI18n: { zh: "盛夏清新", en: "Summer Breeze" },
      theme: "summer",
      background: "/skins/summer-bg.png",
      startAt: "2025-07-01",
      endAt: "2025-08-31",
      description: "夏日限定皮肤，蓝绿色调，清爽活力。",
      isActive: true,
      analyticsId: "skin_summer2025",
    },
    {
      id: "vip_gold",
      name: "VIP尊享金",
      nameI18n: { zh: "VIP尊享金", en: "VIP Gold" },
      theme: "gold",
      background: "/skins/vip-gold-bg.png",
      description: "高级会员专属金色皮肤，彰显尊贵身份。",
      isActive: true,
      analyticsId: "skin_vip_gold",
    },
  ],
  updatedAt: "2025-04-21T16:04:00+08:00",
  updatedBy: "admin",
  metadata: { note: "真实场景模拟数据" },
};
