/**
 * 通用 parseEnum 工具：将字符串安全转换为指定 enum 类型，找不到时输出警告并返回 fallback。
 * 用法：parseEnum(DataMode, value, DataMode.ONLINE)
 */
export function parseEnum<T extends Record<string, string>>(
  enumObj: T,
  value?: string,
  fallback?: T[keyof T],
  logPrefix = 'parseEnum'
): T[keyof T] {
  if (!value) {
    console.warn(`[${logPrefix}] 未传入值，使用默认 fallback:`, fallback);
    return fallback!;
  }
  const enumValues = Object.values(enumObj);
  const found = enumValues.find(v => v === value);
  if (!found) {
    console.warn(`[${logPrefix}] 传入值 '%s' 不在枚举范围: [%s]，将使用 fallback: %s`, value, enumValues.join(','), fallback);
    // 你也可以用 logger.warn(...)
  }
  return (found as T[keyof T]) || fallback!;
}
