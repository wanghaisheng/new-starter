import { LocationMatchAdapter } from './location-match-adapter';
import { TagMatchAdapter } from './tag-match-adapter';
import { MBTIMatchAdapter } from './mbti-match-adapter';
import { BaziMatchAdapter } from './bazi-match-adapter';
import { RandomMatchAdapter } from './random-match-adapter';
import type { MatchStrategyMap } from './match-ai-adapter';

/**
 * 注册表：所有可用的策略适配器
 * key 为策略名，value 为对应适配器实例
 */
export const STRATEGY_REGISTRY: MatchStrategyMap = {
  location: new LocationMatchAdapter(),
  tag: new TagMatchAdapter(),
  mbti: new MBTIMatchAdapter(),
  bazi: new BaziMatchAdapter(),
  random: new RandomMatchAdapter(),
};

/**
 * 工具方法：根据配置服务动态加载系统支持的匹配机制（random 始终兜底，无需配置）
 * @param configService 系统配置服务，需实现 get('matchAlgoList')
 */
export function getEnabledStrategies(configService: any): string[] {
  // 不包含 random，random 始终作为兜底
  const configured = configService?.get?.('matchAlgoList') || Object.keys(STRATEGY_REGISTRY);
  return configured.filter((k: string) => k !== 'random');
}

/**
 * 工具方法：根据配置服务返回的算法名列表，组合出启用的适配器实例数组，random 始终自动兜底
 */
export function getStrategyInstances(configService: any): any[] {
  const enabled = getEnabledStrategies(configService);
  const adapters = enabled.map((key) => STRATEGY_REGISTRY[key]).filter(Boolean);
  // random 始终兜底
  adapters.push(STRATEGY_REGISTRY.random);
  return adapters;
}
