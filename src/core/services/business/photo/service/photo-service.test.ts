import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotoService } from './photo-service';
import type { Photo } from '@/core/lib/db/types/photo.types';

// Mock PhotoRepository
class MockPhotoRepository {
  findByUserIdOrdered = vi.fn();
  updateCaption = vi.fn();
  updateTags = vi.fn();
  create = vi.fn();
  delete = vi.fn();
}

describe('PhotoService', () => {
  let repo: MockPhotoRepository;
  let service: PhotoService;

  beforeEach(() => {
    repo = new MockPhotoRepository();
    service = new PhotoService(repo as any);
  });

  it('findByUserIdOrdered 应调用 repo.findByUserIdOrdered', async () => {
    const userId = 'user1';
    const photos: Photo[] = [{ id: '1', userId, url: '', caption: '', tags: [], createdAt: '', updatedAt: '' }];
    repo.findByUserIdOrdered.mockResolvedValue(photos);
    const result = await service.findByUserIdOrdered(userId);
    expect(repo.findByUserIdOrdered).toHaveBeenCalledWith(userId);
    expect(result).toBe(photos);
  });

  it('updateCaption 应调用 repo.updateCaption', async () => {
    await service.updateCaption('pid', 'new caption');
    expect(repo.updateCaption).toHaveBeenCalledWith('pid', 'new caption');
  });

  it('updateTags 应调用 repo.updateTags', async () => {
    await service.updateTags('pid', ['tag1', 'tag2']);
    expect(repo.updateTags).toHaveBeenCalledWith('pid', ['tag1', 'tag2']);
  });

  it('uploadPhoto 应上传文件并创建照片', async () => {
    const userId = 'user2';
    const file = {} as File;
    const photoUrl = 'http://mock.url/photo.jpg';
    const createdPhoto: Photo = { id: '2', userId, url: photoUrl, caption: '', tags: [], createdAt: '', updatedAt: '' };
    globalThis.fileUploader = { upload: vi.fn().mockResolvedValue(photoUrl) };
    repo.create.mockResolvedValue(createdPhoto);
    const result = await service.uploadPhoto(userId, file);
    expect(globalThis.fileUploader.upload).toHaveBeenCalledWith(file, userId);
    expect(repo.create).toHaveBeenCalled();
    expect(result).toBe(createdPhoto);
  });

  it('uploadPhoto 上传失败应抛出异常', async () => {
    const userId = 'user3';
    const file = {} as File;
    globalThis.fileUploader = { upload: vi.fn().mockRejectedValue(new Error('上传失败')) };
    await expect(service.uploadPhoto(userId, file)).rejects.toThrow('上传失败');
  });

  it('deletePhoto 应调用 repo.delete', async () => {
    repo.delete.mockResolvedValue(true);
    const result = await service.deletePhoto('pid');
    expect(repo.delete).toHaveBeenCalledWith('pid');
    expect(result).toBe(true);
  });

  it('deletePhoto 删除不存在的照片应返回 false', async () => {
    repo.delete.mockResolvedValue(false);
    const result = await service.deletePhoto('not-exist-id');
    expect(repo.delete).toHaveBeenCalledWith('not-exist-id');
    expect(result).toBe(false);
  });

  it('setAvatar 应调用 dbClient.update', async () => {
    const updateMock = vi.fn().mockReturnThis();
    const setMock = vi.fn().mockReturnThis();
    const whereMock = vi.fn();
    globalThis.dbClient = { update: vi.fn(() => ({ set: setMock, where: whereMock })) };
    await service.setAvatar('uid', 'pid');
    expect(globalThis.dbClient.update).toHaveBeenCalledWith('user');
    expect(setMock).toHaveBeenCalledWith({ avatarPhotoId: 'pid' });
    expect(whereMock).toHaveBeenCalledWith('id', 'uid');
  });

  it('setAvatar 设置头像时 dbClient.update 抛出异常应正确抛出', async () => {
    globalThis.dbClient = { update: vi.fn(() => { throw new Error('数据库错误'); }) };
    await expect(service.setAvatar('uid', 'pid')).rejects.toThrow('数据库错误');
  });
});