import { SkinConfigSchema } from "../schema/skin.schema";
import { mockSkinConfig } from "../types/skin.mock";

test("皮肤配置 mock 数据校验通过", () => {
  expect(() => SkinConfigSchema.parse(mockSkinConfig)).not.toThrow();
});
