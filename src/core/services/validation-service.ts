import { User, Message, Match } from '@/core/lib/db/types';

/**
 * 验证服务接口
 * 定义验证服务应提供的方法
 */
export interface IValidationService {
  validateUser(user: Partial<User>): ValidationResult;
  validateMessage(message: Partial<Message>): ValidationResult;
  validateMatch(match: Partial<Match>): ValidationResult;
  validateEmail(email: string): ValidationResult;
  validatePassword(password: string): ValidationResult;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证服务
 * 提供数据验证功能，确保数据符合业务规则
 */
export class ValidationService implements IValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * 验证用户信息
   * @param user 用户数据
   * @returns 验证结果
   */
  public validateUser(user: Partial<User>): ValidationResult {
    const errors: string[] = [];

    // 验证姓名
    if (user.name !== undefined) {
      if (user.name.trim().length < 2) {
        errors.push('姓名至少需要2个字符');
      }
      if (user.name.trim().length > 50) {
        errors.push('姓名不能超过50个字符');
      }
    }

    // 验证电子邮件
    if (user.email !== undefined) {
      if (!this.isValidEmail(user.email)) {
        errors.push('请输入有效的电子邮件地址');
      }
    }

    // 验证生日
    if (user.birthDate !== undefined) {
      const birthDate = new Date(user.birthDate);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      
      if (isNaN(birthDate.getTime())) {
        errors.push('请输入有效的出生日期');
      } else if (age < 18) {
        errors.push('年龄必须大于18岁');
      } else if (age > 120) {
        errors.push('请输入有效的出生日期');
      }
    }

    // 验证个人简介
    if (user.bio !== undefined) {
      if (user.bio.trim().length > 500) {
        errors.push('个人简介不能超过500个字符');
      }
    }

    // 验证兴趣爱好
    if (user.interests !== undefined) {
      if (!Array.isArray(user.interests)) {
        errors.push('兴趣爱好必须是数组');
      } else if (user.interests.length > 10) {
        errors.push('兴趣爱好不能超过10个');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证消息内容
   * @param message 消息数据
   * @returns 验证结果
   */
  public validateMessage(message: Partial<Message>): ValidationResult {
    const errors: string[] = [];

    // 验证消息内容
    if (message.content !== undefined) {
      if (message.content.trim().length === 0) {
        errors.push('消息内容不能为空');
      }
      if (message.content.length > 2000) {
        errors.push('消息内容不能超过2000个字符');
      }
    }

    // 验证消息类型
    if (message.type !== undefined) {
      if (!['text', 'image', 'video', 'audio', 'file'].includes(message.type)) {
        errors.push('无效的消息类型');
      }
    }

    // 验证匹配ID
    if (message.matchId !== undefined) {
      if (!message.matchId || typeof message.matchId !== 'string') {
        errors.push('匹配ID无效');
      }
    }

    // 验证发送者ID
    if (message.senderId !== undefined) {
      if (!message.senderId || typeof message.senderId !== 'string') {
        errors.push('发送者ID无效');
      }
    }

    // 验证接收者ID
    if (message.receiverId !== undefined) {
      if (!message.receiverId || typeof message.receiverId !== 'string') {
        errors.push('接收者ID无效');
      }
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

  /**
   * 验证电子邮件地址
   * @param email 电子邮件地址
   * @returns 验证结果
   */
  public validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!this.isValidEmail(email)) {
      errors.push('请输入有效的电子邮件地址');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 验证结果
   */
  public validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || password.length < 8) {
      errors.push('密码长度至少为8个字符');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查电子邮件格式是否有效
   * @param email 电子邮件地址
   * @returns 是否有效
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
} 