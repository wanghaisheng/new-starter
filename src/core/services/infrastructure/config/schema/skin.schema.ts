import { z } from "zod";

export const SkinSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameI18n: z.record(z.string()).optional(),
  theme: z.string(),
  background: z.string(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  region: z.string().optional(),
  segment: z.string().optional(),
  isActive: z.boolean(),
  analyticsId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  ext: z.record(z.any()).optional(),
});

export const SkinConfigSchema = z.object({
  version: z.string(),
  skins: z.array(SkinSchema),
  updatedAt: z.string(),
  updatedBy: z.string(),
  metadata: z.record(z.any()).optional(),
});
