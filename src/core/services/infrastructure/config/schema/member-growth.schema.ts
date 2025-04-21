import { z } from "zod";

export const GrowthLevelSchema = z.object({
  level: z.number(),
  name: z.string(),
  expRequired: z.number(),
  privileges: z.array(z.string()),
  icon: z.string(),
  color: z.string().optional(),
  descriptionI18n: z.record(z.string()).optional(),
  ext: z.record(z.any()).optional(),
});

export const MemberGrowthConfigSchema = z.object({
  version: z.string(),
  levels: z.array(GrowthLevelSchema),
  segment: z.string().optional(),
  region: z.string().optional(),
  updatedAt: z.string(),
  updatedBy: z.string(),
  permissions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});
