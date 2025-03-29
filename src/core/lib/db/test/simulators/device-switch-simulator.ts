import { BaseClient } from '@/core/lib/db/clients/base-client';
import { User } from '@/core/lib/db/types/user.types';

export class DeviceSwitchSimulator {
  constructor(private client: BaseClient) {}

  async simulateDeviceLogin(user: User, deviceId: string): Promise<void> {
    const activeDevices = user.activeDevices || [];
    if (!activeDevices.includes(deviceId)) {
      await this.client.update('users', user.id, {
        ...user,
        activeDevices: [...activeDevices, deviceId],
        lastActiveDevice: deviceId,
        updatedAt: new Date(),
      });
    }
  }

  async simulateDeviceLogout(user: User, deviceId: string): Promise<void> {
    const activeDevices = user.activeDevices || [];
    if (activeDevices.includes(deviceId)) {
      await this.client.update('users', user.id, {
        ...user,
        activeDevices: activeDevices.filter((id: string) => id !== deviceId),
        updatedAt: new Date(),
      });
    }
  }

  async simulateDeviceSwitch(user: User, fromDevice: string, toDevice: string): Promise<void> {
    await this.simulateDeviceLogout(user, fromDevice);
    await this.simulateDeviceLogin(user, toDevice);
  }

  async simulateSessionSync(user: User, sessionData: any): Promise<void> {
    await this.client.update('users', user.id, {
      ...user,
      sessionState: {
        ...user.sessionState,
        ...sessionData,
        lastSync: new Date(),
      },
      updatedAt: new Date(),
    });
  }

  async simulateSessionConflict(user: User, session1: any, session2: any): Promise<void> {
    // Resolve conflict based on timestamp
    const latestSession = session1.timestamp > session2.timestamp ? session1 : session2;
    await this.simulateSessionSync(user, latestSession);
  }

  async simulateDataConsistency(user: User, updates: any[]): Promise<void> {
    // Apply updates sequentially to simulate real-world scenario
    for (const update of updates) {
      await this.client.update('users', user.id, {
        ...user,
        ...update,
        updatedAt: new Date(),
      });
    }
  }

  async simulateOfflineChanges(user: User, offlineChanges: any): Promise<void> {
    await this.client.update('users', user.id, {
      ...user,
      ...offlineChanges,
      updatedAt: new Date(),
      lastSync: new Date(),
    });
  }
} 