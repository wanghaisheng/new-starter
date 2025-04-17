// 新架构 AppService 入口初始化脚本
import { AppService } from './app-service';

/**
 * 初始化新版 AppService 并支持远程配置热更新
 */
export async function initAppService() {
  await AppService.getInstance().initialize();
  // 启动远程配置定时热更新（每30分钟）
  setInterval(() => {
    // 只需热更新 phone 能力配置
    AppService.getInstance().initialize(); // 可根据需要优化为只调用 fetchAndRegisterPhoneServices
  }, 1000 * 60 * 30);
}

// 若需立即调用（如入口直接引入）可取消注释
// initAppService();
