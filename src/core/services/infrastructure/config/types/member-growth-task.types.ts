// 成长任务与成就体系类型定义

export type GrowthRewardType = "gift" | "vip" | "skin" | "exp" | "badge";

export interface GrowthTask {
  id: string;
  day: number; // 第几天/阶段
  title: string;
  description: string;
  exp: number; // 完成获得成长值
  reward: {
    type: GrowthRewardType;
    value: string | number;
    desc?: string;
  };
  isClaimed?: boolean;
  ext?: Record<string, any>;
}

export interface GrowthAchievement {
  id: string;
  name: string;
  condition: string; // 获得条件说明
  icon: string;
  reward?: {
    type: GrowthRewardType;
    value: string | number;
  };
  ext?: Record<string, any>;
}

export interface GrowthTaskPlanConfig {
  type: "rookie7" | "rookie30" | "custom";
  tasks: GrowthTask[];
  achievements?: GrowthAchievement[];
  startAt?: string;
  endAt?: string;
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
