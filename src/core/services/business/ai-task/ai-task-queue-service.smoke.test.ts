import { AiTaskQueueService } from '@/core/services/business/ai-task/ai-task-queue-service';

describe('AiTaskQueueService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new AiTaskQueueService();
    expect(service).toBeDefined();
    if (service.getTasks) {
      const tasks = await service.getTasks();
      expect(Array.isArray(tasks)).toBe(true);
    }
  });
});
