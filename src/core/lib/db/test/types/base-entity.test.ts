import { describe, it, expect } from 'vitest';
import { BaseEntity, DatabaseRecord, CreateEntityData, UpdateEntityData, WithTimestamps } from '../../types/base-entity';

// 测试用实体
interface TestEntity extends BaseEntity {
  name: string;
  age: number;
}

describe('BaseEntity Types', () => {
  describe('BaseEntity Interface', () => {
    it('should validate id format', () => {
      const validEntity: BaseEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000', // 有效的 UUID
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(validEntity.id).toBeTruthy();
      expect(typeof validEntity.id).toBe('string');
    });

    it('should handle special characters in id', () => {
      const entityWithSpecialChars: BaseEntity = {
        id: 'test-123_456@789',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(entityWithSpecialChars.id).toBeTruthy();
      expect(typeof entityWithSpecialChars.id).toBe('string');
    });

    it('should validate timestamp fields', () => {
      const now = new Date();
      const entity: BaseEntity = {
        id: '1',
        createdAt: now,
        updatedAt: now
      };
      
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
      expect(entity.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(entity.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should handle different timezone timestamps', () => {
      const utcDate = new Date('2024-03-20T12:00:00Z');
      const entity: BaseEntity = {
        id: '1',
        createdAt: utcDate,
        updatedAt: utcDate
      };
      
      expect(entity.createdAt.toISOString()).toBe('2024-03-20T12:00:00.000Z');
      expect(entity.updatedAt.toISOString()).toBe('2024-03-20T12:00:00.000Z');
    });
  });

  describe('DatabaseRecord Interface', () => {
    it('should convert BaseEntity to DatabaseRecord', () => {
      const date = new Date('2024-03-20T12:00:00Z');
      const entity: BaseEntity = {
        id: '1',
        createdAt: date,
        updatedAt: date
      };

      const record: DatabaseRecord = {
        id: entity.id,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
      };

      expect(record.id).toBe(entity.id);
      expect(record.createdAt).toBe('2024-03-20T12:00:00.000Z');
      expect(record.updatedAt).toBe('2024-03-20T12:00:00.000Z');
    });

    it('should handle additional fields in DatabaseRecord', () => {
      const record: DatabaseRecord = {
        id: '1',
        createdAt: '2024-03-20T12:00:00.000Z',
        updatedAt: '2024-03-20T12:00:00.000Z',
        extraField: 'test',
        numericField: 123
      };

      expect(record.extraField).toBe('test');
      expect(record.numericField).toBe(123);
    });
  });

  describe('CreateEntityData Type', () => {
    it('should omit BaseEntity fields', () => {
      const createData: CreateEntityData<TestEntity> = {
        name: 'Test',
        age: 25
      };

      // @ts-expect-error - 这些字段应该被 Omit 类型移除
      createData.id;
      // @ts-expect-error
      createData.createdAt;
      // @ts-expect-error
      createData.updatedAt;

      expect(createData.name).toBe('Test');
      expect(createData.age).toBe(25);
    });
  });

  describe('UpdateEntityData Type', () => {
    it('should make all fields optional', () => {
      const updateData: UpdateEntityData<TestEntity> = {
        name: 'Updated'
      };

      const updateData2: UpdateEntityData<TestEntity> = {
        age: 26
      };

      const updateData3: UpdateEntityData<TestEntity> = {};

      expect(updateData.name).toBe('Updated');
      expect(updateData2.age).toBe(26);
      expect(Object.keys(updateData3).length).toBe(0);
    });
  });

  describe('WithTimestamps Type', () => {
    it('should add timestamp fields to any type', () => {
      interface SimpleType {
        value: string;
      }

      const timestampedData: WithTimestamps<SimpleType> = {
        value: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(timestampedData.value).toBe('test');
      expect(timestampedData.createdAt).toBeInstanceOf(Date);
      expect(timestampedData.updatedAt).toBeInstanceOf(Date);
    });
  });
}); 