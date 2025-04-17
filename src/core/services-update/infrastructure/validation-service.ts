// 数据校验基础服务（infrastructure 层）
// 迁移自 src/core/services/data/validation-service.ts

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface Match {
  users: string[];
  status: string;
}

export class ValidationService {
  /**
   * 验证用户ID
   * @param userId 用户ID
   * @returns 验证结果
   */
  public validateUserId(userId: string): ValidationResult {
    const errors: string[] = [];
    if (!userId || typeof userId !== 'string' || userId.length < 3) {
      errors.push('用户ID无效');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证消息内容
   * @param message 消息内容
   * @returns 验证结果
   */
  public validateMessage(message: { senderId: string; receiverId: string; content: string }): ValidationResult {
    const errors: string[] = [];
    if (!message.content || message.content.trim().length === 0) {
      errors.push('消息内容不能为空');
    }
    if (!message.senderId || typeof message.senderId !== 'string') {
      errors.push('发送者ID无效');
    }
    if (!message.receiverId || typeof message.receiverId !== 'string') {
      errors.push('接收者ID无效');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证匹配信息
   * @param match 匹配数据
   * @returns 验证结果
   */
  public validateMatch(match: Partial<Match>): ValidationResult {
    const errors: string[] = [];
    // 验证用户ID
    if (match.users !== undefined) {
      if (!Array.isArray(match.users)) {
        errors.push('用户列表必须是数组');
      } else if (match.users.length !== 2) {
        errors.push('匹配必须包含两个用户');
      } else if (match.users[0] === match.users[1]) {
        errors.push('用户不能与自己匹配');
      }
    }
    // 验证状态
    if (match.status !== undefined) {
      if (!['pending', 'matched', 'rejected', 'expired'].includes(match.status)) {
        errors.push('无效的匹配状态');
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
