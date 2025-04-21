import { z } from "zod";

export const FeatureFlagSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

export const EventSkinSchema = z.object({
  id: z.string(),
  name: z.string(),
  theme: z.string(),
  background: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  description: z.string().optional(),
});

export const SkinTargetingRuleSchema = z.object({
  skinId: z.string(),
  region: z.string().optional(),
  userSegment: z.string().optional(),
  enabled: z.boolean(),
});

export const GlobalConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  cdnBaseUrl: z.string().url(),
  featureFlags: z.array(FeatureFlagSchema),
  eventSkins: z.array(EventSkinSchema),
  activeSkinId: z.string().optional(),
  skinTargetingRules: z.array(SkinTargetingRuleSchema).optional(),
  // ...其他字段
});
