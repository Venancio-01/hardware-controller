/**
 * 共享工具函数
 *
 * 该模块包含项目中前端和后端共享的工具函数。
 */

/**
 * 深度合并对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target } as T;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      // 使用类型断言避免 TypeScript 泛型索引错误
      const sourceValue = (source as Record<string, any>)[key];
      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue });
        } else {
          const targetValue = (target as Record<string, any>)[key];
          (output as Record<string, any>)[key] = deepMerge(targetValue, sourceValue);
        }
      } else {
        Object.assign(output, { [key]: sourceValue });
      }
    });
  }

  return output;
}

/**
 * 检查是否为对象
 * @param item 要检查的项目
 * @returns 是否为对象
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 验证 IP 地址是否在同一子网内
 * @param ip1 第一个IP地址
 * @param ip2 第二个IP地址
 * @param subnetMask 子网掩码
 * @returns 是否在同一子网
 */
export function isSameSubnet(ip1: string, ip2: string, subnetMask: string): boolean {
  const ip1Parts = ip1.split('.').map(Number);
  const ip2Parts = ip2.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);

  for (let i = 0; i < 4; i++) {
    if ((ip1Parts[i] & maskParts[i]) !== (ip2Parts[i] & maskParts[i])) {
      return false;
    }
  }

  return true;
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}