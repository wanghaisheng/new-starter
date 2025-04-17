import { IService } from '../types/base';
import { ServiceConfig } from '../types/config';
import { logger } from '@/core/lib/logger';

/**
 * 服务提供者基类
 */
export abstract class BaseProvider<T extends IService> {
  protected service: T | null = null;
  protected initialized: boolean = false;

  /**
   * 构造函数
   */
  constructor(protected config: ServiceConfig) {}

  /**
   * 初始化提供者
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    logger.info('Provider initialized');
  }

  /**
   * 释放提供者资源
   */
  public async dispose(): Promise<void> {
    if (this.service) {
      await this.service.dispose();
      this.service = null;
    }
    this.initialized = false;
    logger.info('Provider disposed');
  }

  /**
   * 检查提供者是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取服务实例
   */
  public getService(): T | null {
    return this.service;
  }

  /**
   * 设置服务实例
   */
  public setService(service: T): void {
    this.service = service;
    logger.info('Service set in provider');
  }

  /**
   * 获取提供者配置
   */
  public getConfig(): ServiceConfig {
    return this.config;
  }
} 