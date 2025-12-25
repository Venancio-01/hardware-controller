/**
 * 网络配置验证 Schema
 *
 * 定义网络配置的 Zod 验证模式,包括 IP 地址、子网掩码、网关和 DNS
 */

import { z } from 'zod';

/**
 * IPv4 地址验证正则表达式
 */
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv4 地址 Schema
 */
export const ipv4Schema = z.string().regex(ipv4Regex, {
  message: 'IP 地址格式无效,请输入如 192.168.1.100 的格式',
});

/**
 * 检查网关是否在指定的子网范围内
 *
 * @param gateway - 网关 IP 地址
 * @param ipAddress - 本机 IP 地址
 * @param subnetMask - 子网掩码
 * @returns 如果网关在子网内返回 true,否则返回 false
 */
function isGatewayInSubnet(gateway: string, ipAddress: string, subnetMask: string): boolean {
  // 将 IP 地址字符串转换为数字数组
  const gatewayParts = gateway.split('.').map(Number);
  const ipParts = ipAddress.split('.').map(Number);
  const maskParts = subnetMask.split('.').map(Number);

  // 计算网络地址
  for (let i = 0; i < 4; i++) {
    const gatewayNetworkPart = gatewayParts[i] & maskParts[i];
    const ipNetworkPart = ipParts[i] & maskParts[i];

    if (gatewayNetworkPart !== ipNetworkPart) {
      return false;
    }
  }

  return true;
}

/**
 * 网络配置 Schema
 *
 * 包含 IP 地址、子网掩码、网关和 DNS 服务器列表
 */
export const networkConfigSchema = z
  .object({
    /**
     * IP 地址
     */
    ipAddress: ipv4Schema,

    /**
     * 子网掩码
     */
    subnetMask: ipv4Schema,

    /**
     * 网关地址
     */
    gateway: ipv4Schema,

    /**
     * DNS 服务器列表(可选)
     */
    dns: z.array(ipv4Schema).optional(),
  })
  .refine((data) => isGatewayInSubnet(data.gateway, data.ipAddress, data.subnetMask), {
    message: '网关地址不在配置的子网范围内',
    path: ['gateway'],
  });
