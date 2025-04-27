// 支付服务类型与 options 类型定义
import { PaymentServiceType } from '@/core/lib/db/types/common';
export type PaymentServiceTypeAlias = PaymentServiceType;
export type PaymentServiceOptions = {
  [key: string]: any;
};

import type { IPaymentService } from '../types/payment-service';
import { PaymentServiceFactory } from '../factory/payment-service-factory';
import { RevenueCatPaymentService } from '../adapters/in-app/revenuecat/revenuecat-payment-service';
import { CapacitorPurchasesPaymentService } from '../adapters/in-app/capacitor-purchases-payment-service';
import { StripePaymentService } from '../adapters/web/stripe/stripe-payment-service';
import { WechatPaymentService } from '../adapters/web/wechat/wechat-payment-service';
import { MockPaymentService } from '../adapters/mock-payment-service';

/**
 * 支付服务注册表，支持多实例、revenuecat/capacitor-purchases 等切换
 * 统一对外服务注册表，并内置适配器注册/获取接口，便于插件式扩展
 * 支持批量注册所有内置适配器
 */
export class PaymentServiceRegistry {
  private static instance: PaymentServiceRegistry;
  private registry: Record<string, IPaymentService> = {};
  // 适配器注册表，兼容插件式动态注册
  private static adapters: Partial<Record<PaymentServiceTypeAlias, () => IPaymentService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new PaymentServiceRegistry();
    return this.instance;
  }

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   * @param type 服务类型（revenuecat/capacitor-purchases/stripe/wechat）
   * @param name 实例名，默认 'default'
   * @param dataService 预留，兼容统一签名
   * @param options 其它扩展参数，预留
   */
  getProvider(type: PaymentServiceTypeAlias = PaymentServiceType.REVENUECAT, name: string = 'default', dataService?: any, options?: PaymentServiceOptions): (() => IPaymentService) {
    return () => this.createService(type, name, dataService, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   */
  createService(type: PaymentServiceTypeAlias = PaymentServiceType.REVENUECAT, name: string = 'default', dataService?: any, options?: PaymentServiceOptions): IPaymentService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = PaymentServiceRegistry.adapters[type];
    const service = adapter
      ? adapter()
      : PaymentServiceFactory.createService({ type, dataService, options });
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: PaymentServiceTypeAlias, name: string = 'default'): IPaymentService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 适配器注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: PaymentServiceTypeAlias, factory: () => IPaymentService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: PaymentServiceTypeAlias): (() => IPaymentService) | undefined {
    return this.adapters[type];
  }

  /**
   * 批量注册所有内置支付适配器（可在应用入口调用一次）
   */
  static registerAllAdapters() {
    PaymentServiceRegistry.registerAdapter(PaymentServiceType.REVENUECAT, () => new RevenueCatPaymentService());
    PaymentServiceRegistry.registerAdapter(PaymentServiceType.CAPACITOR_PURCHASES, () => new CapacitorPurchasesPaymentService());
    PaymentServiceRegistry.registerAdapter(PaymentServiceType.STRIPE, () => new StripePaymentService());
    PaymentServiceRegistry.registerAdapter(PaymentServiceType.WECHAT, () => new WechatPaymentService());
    PaymentServiceRegistry.registerAdapter(PaymentServiceType.MOCK, () => new MockPaymentService());
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 revenuecat，其次 capacitor-purchases，其次 stripe，其次 wechat
   */
  getDefaultService(dataService?: any, options?: PaymentServiceOptions): IPaymentService {
    const DEFAULT_PAYMENT_TYPES = [
      PaymentServiceType.REVENUECAT,
      PaymentServiceType.CAPACITOR_PURCHASES,
      PaymentServiceType.STRIPE,
      PaymentServiceType.WECHAT,
      PaymentServiceType.MOCK,
    ];
    return DEFAULT_PAYMENT_TYPES.reduce((service, type) => service || this.getService(type), undefined) ||
      this.createService(PaymentServiceType.REVENUECAT, 'default', dataService, options);
  }
}

// 用法：在应用初始化时调用 PaymentServiceRegistry.registerAllAdapters()
// PaymentServiceRegistry.registerAllAdapters();
