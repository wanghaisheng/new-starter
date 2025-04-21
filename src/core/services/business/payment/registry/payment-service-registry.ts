// 支付服务注册表/单例工厂，支持多类型多实例注册与获取，并内置适配器注册机制
import type { IPaymentService } from '../types/payment-service';
import { createPaymentService, PaymentServiceType } from '../factory/payment-service-factory';
import { RevenueCatPaymentService } from '../adapters/in-app/revenuecat/revenuecat-payment-service';
import { CapacitorPurchasesPaymentService } from '../adapters/in-app/capacitor-purchases-payment-service';
import { StripePaymentService } from '../adapters/web/stripe/stripe-payment-service';
import { WechatPaymentService } from '../adapters/web/wechat/wechat-payment-service';

/**
 * 支付服务注册表，支持多实例、revenuecat/capacitor-purchases 等切换
 * 统一对外服务注册表，并内置适配器注册/获取接口，便于插件式扩展
 * 支持批量注册所有内置适配器
 */
export class PaymentServiceRegistry {
  private static instance: PaymentServiceRegistry;
  private registry: Record<string, IPaymentService> = {};
  // 适配器注册表，兼容插件式动态注册
  private static adapters: Record<string, () => IPaymentService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new PaymentServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取支付服务实例
   * @param type revenuecat/capacitor-purchases/stripe/wechat
   * @param name 实例名（默认 default）
   */
  createService(type: PaymentServiceType = 'revenuecat', name: string = 'default'): IPaymentService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    // 优先用插件式适配器，否则走工厂
    const adapter = PaymentServiceRegistry.adapters[type];
    const service = adapter ? adapter() : createPaymentService(type);
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: string, name: string = 'default'): IPaymentService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 适配器注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: string, factory: () => IPaymentService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: string): IPaymentService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }

  /**
   * 批量注册所有内置支付适配器（可在应用入口调用一次）
   */
  static registerAllAdapters() {
    PaymentServiceRegistry.registerAdapter('revenuecat', () => new RevenueCatPaymentService());
    PaymentServiceRegistry.registerAdapter('capacitor-purchases', () => new CapacitorPurchasesPaymentService());
    PaymentServiceRegistry.registerAdapter('stripe', () => new StripePaymentService());
    PaymentServiceRegistry.registerAdapter('wechat', () => new WechatPaymentService());
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): IPaymentService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock')
    );
  }
}

// 用法：在应用初始化时调用 PaymentServiceRegistry.registerAllAdapters()
// PaymentServiceRegistry.registerAllAdapters();
