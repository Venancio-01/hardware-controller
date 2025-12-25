import { z } from "zod";

// IP 地址验证
const ipAddressSchema = z.string()
  .regex(
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    "IP 地址格式无效，请输入如 192.168.1.100 的格式"
  );

// 子网掩码验证
const subnetMaskSchema = z.string()
  .regex(
    /^(255|254|252|248|240|224|192|128|0)\.(255|254|252|248|240|224|192|128|0)\.(255|254|252|248|240|224|192|128|0)\.(255|254|252|248|240|224|192|128|0)$/,
    "子网掩码格式无效，请输入如 255.255.255.0 的格式"
  );

// 网络配置 Schema
export const networkConfigSchema = z.object({
  ipAddress: ipAddressSchema,
  subnetMask: subnetMaskSchema,
  gateway: ipAddressSchema.refine(
    () => true,
    { message: "网关地址格式无效" }
  ),
  port: z.coerce.number()
    .min(1, "端口号必须大于 0")
    .max(65535, "端口号必须小于 65536"),
});

// 设备配置 Schema
export const deviceConfigSchema = z.object({
  deviceId: z.string().min(1, "设备 ID 不能为空"),
  relayIndex: z.coerce.number()
    .min(0, "继电器索引必须大于等于 0")
    .max(255, "继电器索引必须小于 256"),
});

// 完整配置 Schema
export const configSchema = networkConfigSchema.merge(deviceConfigSchema);

export type NetworkConfig = z.infer<typeof networkConfigSchema>;
export type DeviceConfig = z.infer<typeof deviceConfigSchema>;
export type ConfigFormValues = z.infer<typeof configSchema>;
