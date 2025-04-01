import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { Report } from '../types';

/**
 * 举报仓储类
 * 处理用户举报相关的数据访问
 */
export class ReportRepository extends BaseRepository<Report> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'reports');
  }

  /**
   * 根据举报者ID查找举报
   * @param reporterId 举报者ID
   * @returns 举报列表
   */
  async findByReporterId(reporterId: string): Promise<Report[]> {
    return this.query({
      where: { reporterId }
    });
  }

  /**
   * 根据被举报用户ID查找举报
   * @param targetUserId 被举报用户ID
   * @returns 举报列表
   */
  async findByTargetUserId(targetUserId: string): Promise<Report[]> {
    return this.query({
      where: { targetUserId }
    });
  }

  /**
   * 根据状态查找举报
   * @param status 举报状态
   * @returns 举报列表
   */
  async findByStatus(status: Report['status']): Promise<Report[]> {
    return this.query({
      where: { status }
    });
  }

  /**
   * 更新举报状态
   * @param id 举报ID
   * @param status 新状态
   * @param resolution 解决方案（可选）
   * @returns 更新后的举报
   */
  async updateStatus(id: string, status: Report['status'], resolution?: Report['resolution']): Promise<Report> {
    const updateData: Partial<Report> = { status };
    if (resolution) {
      updateData.resolution = resolution;
    }
    
    await this.update(id, updateData);
    const report = await this.findById(id);
    if (!report) throw new Error(`Report not found: ${id}`);
    return report;
  }
}