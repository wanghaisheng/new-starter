export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  startAt?: string;
  endAt?: string;
  [key: string]: any;
}

export interface EventSkin {
  id: string;
  name: string;
  theme: string;
  background: string;
  startAt: string;
  endAt: string;
  description?: string;
}

export interface SkinTargetingRule {
  skinId: string;
  region?: string;
  userSegment?: string;
  enabled: boolean;
}

export interface GlobalConfig {
  apiBaseUrl: string;
  cdnBaseUrl: string;
  featureFlags: FeatureFlag[];
  eventSkins: EventSkin[];
  activeSkinId?: string;
  skinTargetingRules?: SkinTargetingRule[];
  // ...扩展其他配置项
}
