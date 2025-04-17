import { ServiceConfig } from '../../types';
import { BaseServiceFactory } from './base-factory';
import { IInfrastructureService, InfrastructureServiceConfig, InfrastructureServiceType } from '../types';
import { NetworkService } from '../providers/network/network-service';
import { LoggerService } from '../providers/logger/logger-service';

/**
 * 基础设施服务工厂
 */
export class InfrastructureServiceFactory extends BaseServiceFactory<IInfrastructureService> {
  private static instance: InfrastructureServiceFactory;

  private constructor(config: InfrastructureServiceConfig) {
    super(config);
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config: InfrastructureServiceConfig): InfrastructureServiceFactory {
    if (!InfrastructureServiceFactory.instance) {
      InfrastructureServiceFactory.instance = new InfrastructureServiceFactory(config);
    }
    return InfrastructureServiceFactory.instance;
  }

  /**
   * 创建服务实例
   */
  public createService(config: InfrastructureServiceConfig): IInfrastructureService {
    const serviceType = config.services[config.environment]?.adapter as InfrastructureServiceType;
    if (!serviceType) {
      throw new Error(`Service type not specified for environment: ${config.environment}`);
    }

    const serviceConfig = {
      ...config,
      network: config.services[config.environment]?.options?.network,
      logger: config.services[config.environment]?.options?.logger
    };

    switch (serviceType) {
      case InfrastructureServiceType.NETWORK:
        return new NetworkService(serviceConfig);
      case InfrastructureServiceType.LOGGER:
        return new LoggerService(serviceConfig);
      default:
        throw new Error(`Unsupported service type: ${serviceType}`);
    }
  }

  /**
   * 获取服务类型
   */
  protected getServiceType(): string {
    return 'infrastructure';
  }
} 