import { ImageService } from '@/core/services/business/image/service/image-service';

describe('ImageService 单元测试', () => {
  const mockAdapter = {
    uploadImage: jest.fn(() => Promise.resolve({ id: 'img1', url: 'mock-url' })),
    getImages: jest.fn(() => Promise.resolve([{ id: 'img1', url: 'mock-url' }])),
    deleteImage: jest.fn(() => Promise.resolve(true)),
  };

  let service: ImageService;

  beforeEach(() => {
    service = new ImageService(mockAdapter as any);
  });

  it('uploadImage: 应能上传图片', async () => {
    const img = await service.uploadImage({} as any);
    expect(img).toBeDefined();
    expect(img.url).toBe('mock-url');
  });

  it('getImages: 应能获取图片列表', async () => {
    const imgs = await service.getImages('user1');
    expect(Array.isArray(imgs)).toBe(true);
  });

  it('deleteImage: 应能删除图片', async () => {
    const res = await service.deleteImage('img1');
    expect(res).toBe(true);
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    const errorAdapter = {
      uploadImage: () => { throw new Error('fail'); },
      getImages: () => { throw new Error('fail'); },
      deleteImage: () => { throw new Error('fail'); },
    };
    const errorService = new ImageService(errorAdapter as any);
    await expect(errorService.uploadImage({})).rejects.toThrow('fail');
    await expect(errorService.getImages('u')).rejects.toThrow('fail');
    await expect(errorService.deleteImage('id')).rejects.toThrow('fail');
  });
});
