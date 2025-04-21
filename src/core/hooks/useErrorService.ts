// useErrorService.ts
import { useMemo } from 'react';
import { getErrorService } from '@/core/services/infrastructure/error/registry/error-registry';
import type { IErrorService, ErrorLevel } from '@/core/services/infrastructure/error/types/error-types';

/**
 * useErrorService - 获取全局 ErrorService 单例
 * 推荐所有 hooks/页面通过本 hook 获取 error service，禁止直接 factory/Service 直连
 */
export function useErrorService(): IErrorService {
  // 始终通过 registry 获取，保证 mock/切换/热更新一致
  return useMemo(() => getErrorService(), []);
}

/**
 * useCaptureError - 便捷错误捕获 hook
 * @returns captureError(error, context)
 */
export function useCaptureError() {
  const errorService = useErrorService();
  return errorService.capture.bind(errorService);
}

/**
 * useReportError - 便捷错误上报 hook
 * @returns reportError(error, context)
 */
export function useReportError() {
  const errorService = useErrorService();
  return errorService.report.bind(errorService);
}

/**
 * useShowUserError - 便捷用户提示 hook
 * @returns showUserError(message, options)
 */
export function useShowUserError() {
  const errorService = useErrorService();
  return errorService.showUserError.bind(errorService);
}
