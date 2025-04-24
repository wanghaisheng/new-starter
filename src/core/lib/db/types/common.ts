// 通用异步状态类型
export type AsyncState<T, E = any> = {
  data: T;
  loading: boolean;
  error: E | null;
  empty?: boolean;
};

// 统一应用错误类型
export type AppError = {
  code: string | number;
  message: string;
  detail?: any;
};
