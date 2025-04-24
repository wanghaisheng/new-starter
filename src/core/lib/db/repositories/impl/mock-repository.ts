/**
 * 通用 MockRepository 基类，适用于所有带 id 字段的实体类型
 */
export class MockRepository<T extends { id: string }> {
  private data: Map<string, T>;

  constructor(initialData: T[] = []) {
    this.data = new Map(initialData.map(item => [item.id, item]));
  }

  async findById(id: string): Promise<T | null> {
    return this.data.get(id) ?? null;
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    let items = Array.from(this.data.values());
    if (filter) {
      items = items.filter(item =>
        Object.entries(filter).every(([k, v]) => (item as any)[k] === v)
      );
    }
    return items;
  }

  async create(entity: T): Promise<T> {
    this.data.set(entity.id, entity);
    return entity;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const item = this.data.get(id);
    if (!item) return null;
    const updated = { ...item, ...updates };
    this.data.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  // 可扩展更多通用方法
}
