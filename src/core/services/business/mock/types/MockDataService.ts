/**
 * Mock 数据服务接口定义
 */
export interface IDataService {
  /** 获取全部数据 */
  getData(): any[];
  /** 批量设置数据 */
  setData(data: any[]): void;
  /** 新增一条数据 */
  addData(item: any): void;
  /** 按条件查找数据 */
  findData(predicate: (item: any) => boolean): any[];
  /** 更新数据 */
  updateData(id: string, patch: Partial<any>): void;
  /** 删除数据 */
  removeData(id: string): void;
}
