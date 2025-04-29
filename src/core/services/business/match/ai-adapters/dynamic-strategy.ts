import { STRATEGY_REGISTRY } from './strategy-registry';
import { CompositeMatchAdapter } from './composite-match-adapter';

/**
 * 根据全局配置、用户偏好、临时选项动态生成策略组合
 * @param configService 系统配置服务
 * @param matchPreference 用户匹配偏好（如 algoOrder、disableAlgos）
 * @param tempOpts 临时选项（如 disableAlgos）
 * @returns CompositeMatchAdapter 实例
 */
export function createDynamicCompositeAdapter(
  configService: any,
  matchPreference: { algoOrder?: string[]; disableAlgos?: string[] } | null,
  tempOpts: { disableAlgos?: string[] } | null
): CompositeMatchAdapter {
  // 1. 获取全局默认顺序
  let algoList: string[] = configService?.get?.('matchAlgoList') || ['location', 'tag', 'mbti', 'bazi'];
  // 2. 用户偏好可覆盖顺序或内容
  if (matchPreference?.algoOrder) {
    algoList = matchPreference.algoOrder;
  }
  if (matchPreference?.disableAlgos) {
    algoList = algoList.filter((a: string) => !matchPreference.disableAlgos!.includes(a));
  }
  // 3. 临时 opts 可进一步调整（如临时禁用某策略）
  if (tempOpts?.disableAlgos) {
    algoList = algoList.filter((a: string) => !tempOpts.disableAlgos!.includes(a));
  }
  // 4. 获取实例，random 始终兜底
  const adapters = algoList.map((k: string) => STRATEGY_REGISTRY[k]).filter(Boolean);
  adapters.push(STRATEGY_REGISTRY.random);
  return new CompositeMatchAdapter(adapters);
}
