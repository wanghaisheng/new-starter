import { GiftConfigSchema } from "../schema/gift.schema";
import { mockGiftConfig } from "../types/gift.mock";

test("礼物配置 mock 数据校验通过", () => {
  expect(() => GiftConfigSchema.parse(mockGiftConfig)).not.toThrow();
});
