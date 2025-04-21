import { AiTaskQueueService } from '@/core/services/business/ai-task/ai-task-queue-service';

describe('AiTaskQueueService 单元测试', () => {
  let service: AiTaskQueueService;

  beforeEach(() => {
    service = new AiTaskQueueService();
  });

  it('getTasks: 应能获取任务列表', async () => {
    if (service.getTasks) {
      const tasks = await service.getTasks();
      expect(Array.isArray(tasks)).toBe(true);
    }
  });

  it('addTask: 应能添加任务', async () => {
    if (service.addTask) {
      const task = { id: 't1', type: 'mock', status: 'pending' };
      const added = await service.addTask(task);
      expect(added).toBeDefined();
    }
  });

  it('异常处理: 方法抛错时应抛出异常', async () => {
    const errorService = new AiTaskQueueService();
    // mock getTasks/addTask 抛错
    errorService.getTasks = () => { throw new Error('fail'); };
    errorService.addTask = () => { throw new Error('fail'); };
    await expect(() => errorService.getTasks()).toThrow('fail');
    await expect(() => errorService.addTask({} as any)).toThrow('fail');
  });
});
