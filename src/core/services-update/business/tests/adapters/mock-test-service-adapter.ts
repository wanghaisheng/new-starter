import { ITestService } from '../types/test-service';

export class MockTestServiceAdapter implements ITestService {
  async runTest(testName: string, params?: any): Promise<any> {
    // mock implementation
    return { name: testName, status: 'success', params };
  }
  async getTestResult(testName: string): Promise<any> {
    // mock implementation
    return { name: testName, result: 'mock result' };
  }
  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}
  getType(): string { return 'mock'; }
  isInitialized(): boolean { return true; }
}
