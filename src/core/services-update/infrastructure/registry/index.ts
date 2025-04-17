export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  public registerService(serviceName: string, service: any): void {
    this.services.set(serviceName, service);
  }

  public getService(serviceName: string): any {
    return this.services.get(serviceName);
  }

  public hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  public removeService(serviceName: string): void {
    this.services.delete(serviceName);
  }
} 