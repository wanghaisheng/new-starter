/**
 * Firebase 查询构建器
 * 用于构建 Firestore 查询，将标准查询参数转换为 Firestore 查询约束
 */

import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  startAt,
  endAt
} from 'firebase/firestore';
import { 
  QueryOptions, 
  ExtendedQueryOptions, 
  SortDirection, 
  QueryFilter 
} from '@/core/lib/db/types/database.types';
import { DatabaseLogger, getLogger } from '@/core/lib/db/errors/database-logger';

/**
 * Firebase 查询构建器
 * 将通用查询选项转换为 Firestore 特定的查询约束
 */
export class FirebaseQueryBuilder {
  private logger: DatabaseLogger;

  /**
   * 创建查询构建器实例
   */
  constructor() {
    this.logger = getLogger('FirebaseQueryBuilder');
  }

  /**
   * 构建查询约束
   * @param options 查询选项
   * @returns 查询约束数组
   */
  public buildQuery(options: QueryOptions | ExtendedQueryOptions): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    const extOptions = options as ExtendedQueryOptions;

    // 处理旧的查询格式
    if (options.where) {
      // 处理单个条件
      if ('field' in options.where) {
        const { field, operator, value } = options.where;
        const firestoreOperator = this.mapOperator(operator);
        constraints.push(where(field, firestoreOperator, this.formatValue(value)));
      } 
      // 处理复合条件 ($and/$or)
      else if (options.where.$and || options.where.$or) {
        this.logger.warn('复合查询条件 ($and/$or) 暂不完全支持，请使用 filters 数组代替');
        // 尝试处理简单的 $and 条件
        if (options.where.$and && Array.isArray(options.where.$and)) {
          options.where.$and.forEach((condition) => {
            if (condition && 'field' in condition) {
              const { field, operator, value } = condition;
              const firestoreOperator = this.mapOperator(operator);
              constraints.push(where(field, firestoreOperator, this.formatValue(value)));
            }
          });
        }
      }
    }

    // 处理新的查询格式
    if (extOptions.filters && extOptions.filters.length > 0) {
      extOptions.filters.forEach(filter => {
        const firestoreOperator = this.mapFilterOperator(filter.operator);
        const formattedValue = this.formatFilterValue(filter.value);
        this.logger.debug(`添加过滤条件: ${filter.field} ${firestoreOperator} ${formattedValue}`);
        constraints.push(where(filter.field, firestoreOperator, formattedValue));
      });
    }

    // 处理排序条件
    if (options.orderBy) {
      const { field, direction } = options.orderBy;
      const firestoreDirection: OrderByDirection = direction === 'desc' ? 'desc' : 'asc';
      constraints.push(orderBy(field, firestoreDirection));
    }

    // 处理新格式的排序
    if (extOptions.sort && typeof extOptions.sort === 'object') {
      Object.entries(extOptions.sort).forEach(([field, direction]) => {
        const firestoreDirection: OrderByDirection = direction === 'desc' ? 'desc' : 'asc';
        this.logger.debug(`添加排序: ${field} ${firestoreDirection}`);
        constraints.push(orderBy(field, firestoreDirection));
      });
    }

    // 添加边界处理
    if (extOptions.startAfter) {
      constraints.push(startAfter(extOptions.startAfter));
    }

    if (extOptions.startAt) {
      constraints.push(startAt(extOptions.startAt));
    }

    if (extOptions.endBefore) {
      constraints.push(endBefore(extOptions.endBefore));
    }

    if (extOptions.endAt) {
      constraints.push(endAt(extOptions.endAt));
    }

    // 添加分页
    if (options.limit && options.limit > 0) {
      constraints.push(limit(options.limit));
    }

    // Firestore 不支持传统的 offset 分页
    // 使用 startAfter 代替
    if (extOptions.offset && extOptions.offset > 0) {
      this.logger.warn('Firestore 不直接支持 offset 分页，请改用 startAfter');
    }

    return constraints;
  }

  /**
   * 构建完整的 Firestore 查询
   * @param db Firestore 实例
   * @param tableName 集合名称
   * @param options 查询选项
   * @returns 完整的 Firestore 查询对象
   */
  public buildFirestoreQuery(db: Firestore, tableName: string, options: QueryOptions | ExtendedQueryOptions) {
    const collectionRef = collection(db, tableName);
    const constraints = this.buildQuery(options);
    return query(collectionRef, ...constraints);
  }

  /**
   * 映射通用操作符到 Firestore 操作符
   * @param operator 通用操作符
   * @returns Firestore 操作符
   */
  private mapOperator(operator: string): WhereFilterOp {
    switch (operator) {
      case '==':
      case '$eq':
        return '==';
      case '!=':
      case '$ne':
        return '!=';
      case '>':
      case '$gt':
        return '>';
      case '>=':
      case '$gte':
        return '>=';
      case '<':
      case '$lt':
        return '<';
      case '<=':
      case '$lte':
        return '<=';
      case '$in':
        return 'in';
      case '$contains':
        return 'array-contains';
      default:
        this.logger.warn(`未知的操作符: ${operator}，默认使用 ==`);
        return '==';
    }
  }

  /**
   * 映射过滤操作符
   * @param operator 通用操作符
   * @returns Firestore 操作符
   */
  private mapFilterOperator(operator: string): WhereFilterOp {
    switch (operator) {
      case '==':
      case '=':
      case 'eq':
        return '==';
      case '!=':
      case 'ne':
      case 'neq':
        return '!=';
      case '>':
      case 'gt':
        return '>';
      case '>=':
      case 'gte':
        return '>=';
      case '<':
      case 'lt':
        return '<';
      case '<=':
      case 'lte':
        return '<=';
      case 'array-contains':
      case 'contains':
        return 'array-contains';
      case 'array-contains-any':
      case 'containsAny':
        return 'array-contains-any';
      case 'in':
        return 'in';
      case 'not-in':
      case 'notIn':
        return 'not-in';
      default:
        this.logger.warn(`未知的过滤操作符: ${operator}，默认使用 ==`);
        return '==';
    }
  }

  /**
   * 格式化值
   * @param value 原始值
   * @returns 格式化后的值
   */
  private formatValue(value: any): any {
    return this.formatFilterValue(value);
  }

  /**
   * 格式化过滤值，处理特殊值类型
   * @param value 原始值
   * @returns 格式化后的值
   */
  private formatFilterValue(value: any): any {
    // 如果是日期字符串，转换为Date对象
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) {
      return new Date(value);
    }
    
    // null 和 undefined 处理
    if (value === null || value === undefined) {
      return null;
    }
    
    return value;
  }

  /**
   * 创建 "in" 查询的值数组
   * @param field 字段名
   * @param values 值数组
   * @returns 查询约束
   */
  public createInQuery(field: string, values: any[]): QueryConstraint {
    if (!values || values.length === 0) {
      throw new Error(`"in" 查询的值数组不能为空: ${field}`);
    }
    
    // Firestore 限制: "in" 查询最多支持 10 个值
    if (values.length > 10) {
      this.logger.warn(`"in" 查询的值数组超过 Firestore 限制(10): ${field}, 长度: ${values.length}`);
    }
    
    return where(field, 'in', values);
  }

  /**
   * 创建文本搜索查询约束
   * 注意: Firestore 不直接支持全文搜索，此方法是近似实现
   * 
   * @param field 字段名
   * @param searchText 搜索文本
   * @returns 查询约束
   */
  public createTextSearchConstraint(field: string, searchText: string): QueryConstraint {
    // 对于简单的前缀搜索，可以使用 >= 和 < 操作符
    const searchTextLower = searchText.toLowerCase();
    const endText = searchTextLower.slice(0, -1) + 
                   String.fromCharCode(searchTextLower.charCodeAt(searchTextLower.length - 1) + 1);
    
    this.logger.debug(`创建文本搜索约束: ${field} >= ${searchTextLower} AND ${field} < ${endText}`);
    
    // 创建文本范围查询
    // 注意: 这只能匹配前缀，不是真正的全文搜索
    // 对于完整的全文搜索功能，应考虑使用 Firebase 的 Algolia 集成
    return where(field, '>=', searchTextLower);
  }
} 