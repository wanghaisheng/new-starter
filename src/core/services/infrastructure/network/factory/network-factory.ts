// network-factory.ts
import { NetworkService } from '@/core/services/infrastructure/network/service/network-service';
import { INetworkService } from '@/core/services/infrastructure/types';

export function createNetworkService(): INetworkService {
  return NetworkService.getInstance();
}
