/**
 * 网络配置验证 Schema
 *
 * 定义网络配置的 Zod 验证模式,包括 IP 地址、子网掩码、网关和 DNS
 */

import { z } from 'zod';
import { isIpInSubnet } from '../utils/ip-utils.js';

/**
 * IPv4 地址验证正则表达式
 */
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv4 地址 Schema
 * 使用 Regex 进行验证，因为当前 Zod 版本似乎不支持 .ip()
 */
export const ipv4Schema = z.string().regex(ipv4Regex, {
  message: 'IP 地址格式无效,请输入如 192.168.1.100 的格式',
});

/**
 * 端口号 Schema
 * 端口号必须在 1-65535 范围内
 */
export const portSchema = z.number().int().min(1).max(65535, {
  message: '端口号必须在 1-65535 范围内',
});

/**
 * 网络配置 Schema
 *
 * 包含 IP 地址、子网掩码、网关、端口和 DNS 服务器列表
 */
export const networkConfigSchema = z
  .object({
    /**
     * IP 地址
     */
    ipAddress: ipv4Schema.optional().default('127.0.0.1'),

    /**
     * 子网掩码
     * 需符合 IPv4 格式
     */
    subnetMask: ipv4Schema.optional().default('255.255.255.0'),

    /**
     * 网关地址
     */
    gateway: ipv4Schema.optional().default('127.0.0.1'),

    /**
     * 服务端口
     */
    port: portSchema.optional().default(80),

    /**
     * DNS 服务器列表(可选)
     */
    dns: z.array(ipv4Schema)
      .max(4, { message: '最多只能配置4个DNS服务器' })
      .optional()
      .default([]),
  })
  .refine((data) => {
    // 验证网关是否在子网内
    return isIpInSubnet(data.gateway, data.ipAddress, data.subnetMask);
  }, {
    message: '网关必须与 IP 地址在同一子网内',
    path: ['gateway'],
  });

/**
 * 网络配置类型定义
 */
export type NetworkConfig = z.infer<typeof networkConfigSchema>;
