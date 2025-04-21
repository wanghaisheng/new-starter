import React from 'react';
import { render, act, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAiImageTaskQueue } from '@/core/hooks/useAiImageTaskQueue';
import { vi } from 'vitest';

function MockComponent({ userId }: { userId: string }) {
  const { tasks, uploading, error, enqueueAiTask, retryTask, removeTask } = useAiImageTaskQueue('/mock-api/ai-task');

  return (
    <div>
      <input type="file" data-testid="file-input" />
      <button
        data-testid="upload-btn"
        disabled={uploading}
        onClick={async () => {
          // 模拟文件上传
          const fakeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
          await enqueueAiTask(userId, fakeFile);
        }}
      >上传</button>
      {error && <div data-testid="error">{error}</div>}
      <ul data-testid="task-list">
        {tasks.map(task => (
          <li key={task.taskId}>
            <span>{task.status}</span>
            {task.status === 'failed' && (
              <button data-testid={`retry-${task.taskId}`} onClick={() => retryTask(task)}>重试</button>
            )}
            <button data-testid={`remove-${task.taskId}`} onClick={() => removeTask(task.taskId)}>移除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('用户AI图片上传与队列 userflow', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url, opts) => {
      if (typeof url === 'string' && url.endsWith('/upload')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ imageUrl: 'mock-url', taskId: 'mock-task-1' })
        }) as any;
      }
      if (typeof url === 'string' && url.includes('/status/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'done', result: { url: 'mock-url?processed' } })
        }) as any;
      }
      return Promise.resolve({ ok: false }) as any;
    });
  });

  it('完整用户flow：上传-队列-进度-完成-移除', async () => {
    render(<MockComponent userId="user1" />);
    const uploadBtn = screen.getByTestId('upload-btn');
    // 上传
    await act(async () => {
      fireEvent.click(uploadBtn);
    });
    // 等待队列出现
    await waitFor(() => {
      expect(screen.getByTestId('task-list').children.length).toBeGreaterThan(0);
    });
    // 等待状态变为 done
    await waitFor(() => {
      expect(screen.getByText('done')).toBeInTheDocument();
    });
    // 移除任务
    const removeBtn = screen.getByTestId('remove-mock-task-1');
    fireEvent.click(removeBtn);
    await waitFor(() => {
      expect(screen.queryByTestId('remove-mock-task-1')).not.toBeInTheDocument();
    });
  });

  it('失败任务可重试', async () => {
    // mock fetch: /upload 失败
    (global.fetch as any) = vi.fn((url, opts) => {
      if (typeof url === 'string' && url.endsWith('/upload')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'fail' })
        }) as any;
      }
      if (typeof url === 'string' && url.includes('/status/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'failed' })
        }) as any;
      }
      return Promise.resolve({ ok: false }) as any;
    });
    render(<MockComponent userId="user2" />);
    const uploadBtn = screen.getByTestId('upload-btn');
    // 上传
    await act(async () => {
      fireEvent.click(uploadBtn);
    });
    // 等待状态变为 failed
    await waitFor(() => {
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
    // 重试
    const retryBtn = screen.getByTestId('retry-mock-task-1');
    fireEvent.click(retryBtn);
    // 这里可根据需要补充更多断言
  });
});
