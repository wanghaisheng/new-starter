import { User } from '../models/user';

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // 用户数据验证
  public validateUser(user: Partial<User>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (user.name && user.name.length < 2) {
      errors.push('姓名至少需要2个字符');
    }

    if (user.age) {
      if (user.age < 18) {
        errors.push('年龄必须大于18岁');
      }
      if (user.age > 100) {
        errors.push('请输入有效的年龄');
      }
    }

    if (user.bio && user.bio.length < 10) {
      errors.push('个人简介至少需要10个字符');
    }

    if (user.images && user.images.length === 0) {
      errors.push('请至少上传一张照片');
    }

    if (user.location && user.location.length < 2) {
      errors.push('请输入有效的地址');
    }

    if (user.interests && user.interests.length === 0) {
      errors.push('请至少选择一个兴趣爱好');
    }

    if (user.gender && !['male', 'female', 'other'].includes(user.gender)) {
      errors.push('请选择有效的性别');
    }

    if (user.lookingFor && user.lookingFor.length === 0) {
      errors.push('请至少选择一个期望的性别');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 消息验证
  public validateMessage(text: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('消息内容不能为空');
    }

    if (text.length > 1000) {
      errors.push('消息内容不能超过1000个字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 匹配验证
  public validateMatch(userId1: string, userId2: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userId1 || !userId2) {
      errors.push('用户ID不能为空');
    }

    if (userId1 === userId2) {
      errors.push('不能与自己匹配');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 