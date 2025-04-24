import { GiftConfig } from "../gift.types";

export const mockGiftConfig: GiftConfig = {
  version: "1.0.0",
  items: [
    {
      id: "rose",
      name: "玫瑰",
      nameI18n: { zh: "玫瑰", en: "Rose" },
      price: 10,
      currency: "CNY",
      image: "/gifts/rose.png",
      category: "flower",
      isActive: true,
      analyticsId: "gift_rose",
      unlockLevel: 1, // 普通会员即可解锁
    },
    {
      id: "chocolate",
      name: "巧克力",
      nameI18n: { zh: "巧克力", en: "Chocolate" },
      price: 25,
      currency: "CNY",
      image: "/gifts/chocolate.png",
      category: "snack",
      isActive: true,
      analyticsId: "gift_chocolate",
      unlockLevel: 2, // 活跃会员解锁
    },
    {
      id: "diamond",
      name: "钻石",
      nameI18n: { zh: "钻石", en: "Diamond" },
      price: 100,
      currency: "CNY",
      image: "/gifts/diamond.png",
      category: "jewel",
      isActive: false,
      analyticsId: "gift_diamond",
      unlockLevel: 3, // 高级会员解锁
    },
    {
      id: "car",
      name: "豪车",
      nameI18n: { zh: "豪车", en: "Luxury Car" },
      price: 888,
      currency: "CNY",
      image: "/gifts/car.png",
      category: "luxury",
      isActive: true,
      analyticsId: "gift_car",
      unlockLevel: 3, // 高级会员解锁
    },
  ],
  updatedAt: "2025-04-21T16:04:00+08:00",
  updatedBy: "ops",
  metadata: { note: "真实场景模拟数据" },
};
