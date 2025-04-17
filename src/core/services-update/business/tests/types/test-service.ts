import { IService } from '@/core/services-update/types';

export interface ITestService extends IService {
  runTest(testName: string, params?: any): Promise<any>;
  getTestResult(testName: string): Promise<any>;
}
