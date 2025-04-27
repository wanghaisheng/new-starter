import { useDatabase } from './DatabaseProvider'
import type { User } from '@/core/lib/db/types/user.types'
import type { QueryOptions, QueryResult } from '@/core/services/data/types'

/**
 * 业务 Hook：用户仓储
 * 可在组件/服务中直接调用
 */
export function useUserRepository() {
  const db = useDatabase()

  return {
    async findById(id: string): Promise<User | null> {
      return db.findById('users', id)
    },
    async query(options: QueryOptions): Promise<QueryResult<User>> {
      return db.query('users', options)
    },
    async create(user: User): Promise<User> {
      return db.create('users', user)
    },
    async update(id: string, data: Partial<User>): Promise<void> {
      return db.update('users', id, data)
    },
    async delete(id: string): Promise<void> {
      return db.delete('users', id)
    }
  }
}
