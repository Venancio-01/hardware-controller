/**
 * 格式化工具函数
 */

/**
 * 格式化运行时间（uptime）
 *
 * 将毫秒数格式化为人类可读的时间字符串
 *
 * @param uptimeMs 运行时间（毫秒）
 * @returns 格式化后的时间字符串
 *
 * @example
 * formatUptime(null) // '--'
 * formatUptime(30000) // '30秒'
 * formatUptime(90000) // '1分钟'
 * formatUptime(3660000) // '1小时 1分钟'
 * formatUptime(90000000) // '1天 1小时'
 */
export function formatUptime(uptimeMs: number | null): string {
  if (uptimeMs === null || uptimeMs < 0) {
    return '--';
  }

  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天 ${hours % 24}小时`;
  }
  if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟`;
  }
  return `${seconds}秒`;
}
