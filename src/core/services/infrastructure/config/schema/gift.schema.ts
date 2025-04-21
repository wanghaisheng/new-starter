import { z } from "zod";

export const GiftItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameI18n: z.record(z.string()).optional(),
  price: z.number(),
  currency: z.string(),
  image: z.string(),
  category: z.string().optional(),
  isActive: z.boolean(),
  version: z.string().optional(),
  region: z.string().optional(),
  segment: z.string().optional(),
  analyticsId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  ext: z.record(z.any()).optional(),
});

export const GiftConfigSchema = z.object({
  version: z.string(),
  items: z.array(GiftItemSchema),
  updatedAt: z.string(),
  updatedBy: z.string(),
  metadata: z.record(z.any()).optional(),
});
