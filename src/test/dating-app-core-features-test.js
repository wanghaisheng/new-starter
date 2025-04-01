/**
 * Dating App 核心功能测试
 * 本测试文件用于验证Dating App第二阶段核心功能的实现
 * 使用mock数据阶段的配置进行测试
 */

// 设置环境变量为mock模式
process.env.NEXT_PUBLIC_DATABASE_ENV = 'mock';

// 导入必要的服务
const { DataServiceFactory } = require('@/core/services/data-service-factory');
const { UserService } = require('@/core/services/user-service');
const { MessageService } = require('@/core/services/message-service');

// 测试函数
async function runTests() {
  console.log('===== Dating App 核心功能测试 =====');
  console.log('使用Mock数据阶段配置进行测试\n');

  try {
    // 获取数据服务实例
    const dataService = DataServiceFactory.getInstance();
    const userService = UserService.getInstance();
    const messageService = MessageService.getInstance();

    // 测试个人资料功能
    console.log('1. 测试个人资料功能');
    const users = await dataService.getUsers();
    console.log(`获取到 ${users.length} 个用户`);
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`用户示例: ${firstUser.name}, 兴趣: ${firstUser.interests.join(', ')}`);
      console.log('个人资料功能测试通过 ✓');
    } else {
      console.log('警告: 没有找到用户数据');
    }
    console.log('');

    // 测试匹配系统功能
    console.log('2. 测试匹配系统功能');
    const matches = await dataService.getMatches();
    console.log(`获取到 ${matches.length} 个匹配`);
    
    if (matches.length > 0) {
      const firstMatch = matches[0];
      console.log(`匹配示例: 用户 ${firstMatch.users[0]} 和用户 ${firstMatch.users[1]}`);
      console.log(`匹配状态: ${firstMatch.status}`);
      console.log('匹配系统功能测试通过 ✓');
    } else {
      console.log('警告: 没有找到匹配数据');
    }
    console.log('');

    // 测试消息系统功能
    console.log('3. 测试消息系统功能');
    const messages = await dataService.getMessages();
    console.log(`获取到 ${messages.length} 条消息`);
    
    if (messages.length > 0) {
      const firstMessage = messages[0];
      console.log(`消息示例: 从 ${firstMessage.senderId} 到 ${firstMessage.receiverId}`);
      console.log(`消息内容: ${firstMessage.content}`);
      console.log(`消息状态: ${firstMessage.status || (firstMessage.isRead ? '已读' : '未读')}`);
      console.log('消息系统功能测试通过 ✓');
    } else {
      console.log('警告: 没有找到消息数据');
    }
    console.log('');

    // 测试用户旅程
    console.log('4. 测试用户旅程: 从发现到匹配到聊天');
    if (users.length >= 2) {
      const user1 = users[0];
      const user2 = users[1];
      
      console.log(`模拟用户 ${user1.name} 对用户 ${user2.name} 右滑(喜欢)`);
      
      // 创建新的匹配
      const newMatch = await userService.createMatch(user1.id, user2.id);
      console.log(`创建了新的匹配: ${newMatch.id}`);
      
      // 发送消息
      const messageResult = await messageService.sendMessage(
        newMatch.id,
        user1.id,
        user2.id,
        '你好，很高兴认识你！'
      );
      
      if (messageResult.success) {
        console.log(`发送消息成功: ${messageResult.message.content}`);
        
        // 标记消息为已读
        await messageService.markMessageAsRead(messageResult.message.id);
        console.log('消息已标记为已读');
        
        // 回复消息
        const replyResult = await messageService.sendMessage(
          newMatch.id,
          user2.id,
          user1.id,
          '你好！我也很高兴认识你！'
        );
        
        if (replyResult.success) {
          console.log(`回复消息成功: ${replyResult.message.content}`);
          console.log('用户旅程测试通过 ✓');
        }
      }
    } else {
      console.log('警告: 没有足够的用户数据进行用户旅程测试');
    }

    console.log('\n===== 所有测试完成 =====');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
runTests();