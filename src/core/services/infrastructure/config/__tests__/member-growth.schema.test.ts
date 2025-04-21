import { MemberGrowthConfigSchema } from "../schema/member-growth.schema";
import { mockMemberGrowthConfig } from "../types/member-growth.mock";

test("会员成长配置 mock 数据校验通过", () => {
  expect(() => MemberGrowthConfigSchema.parse(mockMemberGrowthConfig)).not.toThrow();
});
