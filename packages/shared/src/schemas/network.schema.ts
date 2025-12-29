/**
 * 网络配置验证 Schema
 *
 * 定义网络配置的 Zod 验证模式,包括 IP 地址、子网掩码、网关和端口
 */

import { z } from 'zod';
import ipaddr from 'ipaddr.js';

/**
 * IPv4 地址验证正则表达式
 */
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv4 地址 Schema
 * 使用 Regex 进行基础格式验证
 */
export const ipv4Schema = z.string().regex(ipv4Regex, {
  message: 'IP 地址格式无效,请输入如 192.168.1.100 的格式',
});

/**
 * 验证是否为有效的子网掩码
 * 有效的子网掩码是由连续的 1 后跟连续的 0 组成的二进制数
 */
const validateSubnetMask = (mask: string): boolean => {
  try {
    if (!ipaddr.isValid(mask)) {
      return false;
    }

    const maskObj = ipaddr.parse(mask);
    if (maskObj.kind() !== 'ipv4') {
      return false;
    }

    const bytes = (maskObj as ipaddr.IPv4).toByteArray();

    // 转换为 32 位整数
    const maskInt = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];

    // 有效的子网掩码应该是连续的 1 后跟连续的 0
    // 例如: 11111111.11111111.11111111.00000000 (255.255.255.0)
    const inverted = ~maskInt & 0xFFFFFFFF; // 取反
    // 如果 (inverted & (inverted + 1)) === 0，说明是有效的子网掩码
    return (inverted & (inverted + 1)) === 0;
  } catch {
    return false;
  }
};

/**
 * 子网掩码 Schema
 * 验证格式正确性以及是否为有效的子网掩码
 */
export const subnetMaskSchema = ipv4Schema.refine(
  (mask) => validateSubnetMask(mask),
  {
    message: '子网掩码格式无效，必须是有效的网络掩码（如 255.255.255.0）',
  }
);

/**
 * 端口号 Schema
 * 端口号必须在 1-65535 范围内
 */
export const portSchema = z.number().int().min(1).max(65535, {
  message: '端口号必须在 1-65535 范围内',
});

/**
 * 计算子网的网络地址和广播地址
 * 如果 IP 或掩码无效，返回 null
 */
const calculateNetworkAddresses = (ip: string, mask: string) => {
  try {
    const ipObj = ipaddr.parse(ip) as ipaddr.IPv4;
    const maskObj = ipaddr.parse(mask) as ipaddr.IPv4;

    const ipBytes = ipObj.toByteArray();
    const maskBytes = maskObj.toByteArray();

    // 网络地址 = IP & Mask
    const networkBytes = ipBytes.map((byte, i) => byte & maskBytes[i]);

    // 广播地址 = 网络地址 | (~Mask)
    const broadcastBytes = networkBytes.map((byte, i) =>
      byte | (~maskBytes[i] & 0xFF)
    );

    return {
      networkAddress: ipaddr.fromByteArray(networkBytes as [number, number, number, number]).toString(),
      broadcastAddress: ipaddr.fromByteArray(broadcastBytes as [number, number, number, number]).toString(),
    };
  } catch {
    return null;
  }
};

/**
 * 验证 IP 地址是否为有效的主机地址（不是网络地址或广播地址）
 */
const isValidHostAddress = (ip: string, mask: string): boolean => {
  const addrs = calculateNetworkAddresses(ip, mask);
  if (!addrs) return false;
  const { networkAddress, broadcastAddress } = addrs;
  // IP 不能是网络地址或广播地址
  return ip !== networkAddress && ip !== broadcastAddress;
};

/**
 * 验证网关是否在子网内
 */
const validateGatewayInSubnet = (ip: string, mask: string, gateway: string): boolean => {
  try {
    if (!ipaddr.isValid(ip) || !ipaddr.isValid(mask) || !ipaddr.isValid(gateway)) {
      return false;
    }

    const ipObj = ipaddr.parse(ip);
    const maskObj = ipaddr.parse(mask);
    const gatewayObj = ipaddr.parse(gateway);

    // 仅支持 IPv4
    if (ipObj.kind() !== 'ipv4' || maskObj.kind() !== 'ipv4' || gatewayObj.kind() !== 'ipv4') {
      return false;
    }

    // 计算网络前缀
    // ipaddr.js 没有直接的 subnet 匹配函数可以接受 Mask 字符串，通常需要 CIDR。
    // 这里我们手动计算：(IP & Mask) === (Gateway & Mask)
    const ipBytes = (ipObj as ipaddr.IPv4).toByteArray();
    const maskBytes = (maskObj as ipaddr.IPv4).toByteArray();
    const gatewayBytes = (gatewayObj as ipaddr.IPv4).toByteArray();

    for (let i = 0; i < 4; i++) {
      if ((ipBytes[i] & maskBytes[i]) !== (gatewayBytes[i] & maskBytes[i])) {
        return false;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 网络配置 Schema
 *
 * 包含 IP 地址、子网掩码、网关和端口
 */
export const networkConfigSchema = z
  .object({
    /**
     * IP 地址
     */
    ipAddress: ipv4Schema.optional().default('127.0.0.1'),

    /**
     * 子网掩码
     * 需符合 IPv4 格式且为有效的子网掩码
     */
    subnetMask: subnetMaskSchema.optional().default('255.255.255.0'),

    /**
     * 网关地址
     */
    gateway: ipv4Schema.optional().default('127.0.0.1'),

    /**
     * 服务端口
     */
    port: portSchema.optional().default(80),


  })
  .superRefine((data, ctx) => {
    // 如果已有格式错误，先跳过逻辑验证
    if (!data.ipAddress || !data.subnetMask || !data.gateway) return;

    // 验证 IP 地址是否为有效的主机地址（不是网络地址或广播地址）
    if (!isValidHostAddress(data.ipAddress, data.subnetMask)) {
      const addrs = calculateNetworkAddresses(data.ipAddress, data.subnetMask);
      if (addrs) {
        const { networkAddress, broadcastAddress } = addrs;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `IP 地址 ${data.ipAddress}/${data.subnetMask} 无效：不能是网络地址 (${networkAddress}) 或广播地址 (${broadcastAddress})`,
          path: ['ipAddress'],
        });
      }
      return; // 如果 IP 本身无效，跳过后续网关验证
    }

    // 验证网关是否在子网内
    if (!validateGatewayInSubnet(data.ipAddress, data.subnetMask, data.gateway)) {
      const addrs = calculateNetworkAddresses(data.ipAddress, data.subnetMask);
      if (addrs) {
        const { networkAddress } = addrs;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `网关 ${data.gateway} 不在子网 ${data.ipAddress}/${data.subnetMask} (网络: ${networkAddress}) 内`,
          path: ['gateway'],
        });
      }
    }

    // 验证网关是否为有效的主机地址
    if (!isValidHostAddress(data.gateway, data.subnetMask)) {
      const addrs = calculateNetworkAddresses(data.gateway, data.subnetMask);
      if (addrs) {
        const { networkAddress, broadcastAddress } = addrs;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `网关不能是网络地址 (${networkAddress}) 或广播地址 (${broadcastAddress})`,
          path: ['gateway'],
        });
      }
    }
  });
