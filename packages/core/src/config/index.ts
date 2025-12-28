/**
 * Core 包配置模块
 *
 * 从项目根目录的 JSON 配置文件读取配置。
 * 根据 NODE_ENV 环境变量选择对应的配置文件：
 * - development: config.development.json
 * - production: config.production.json
 */

import { createConfigReader } from 'shared/node';
import type { Config } from 'shared';

/**
 * 配置读取器实例
 * 在模块加载时创建，同步读取配置文件
 */
const configReader = createConfigReader();

/**
 * 导出验证后的配置对象
 * 这是应用中唯一的配置来源
 */
export const config = configReader.getAll();

/**
 * 导出配置类型
 */
export type { Config };

/**
 * 导出 Env 类型（向后兼容别名）
 */
export type Env = Config;

/**
 * 配置对象类型守卫
 * 用于运行时检查配置是否正确加载
 */
export function isConfigLoaded(): boolean {
  return config !== null && typeof config === 'object';
}

/**
 * 获取配置摘要（用于日志输出）
 * 不包含敏感信息
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    environment: config.NODE_ENV,
    server: {
      host: config.HOST,
      port: config.PORT,
    },
    hardware: {
      cabinet: {
        host: config.CABINET_HOST,
        port: config.CABINET_PORT,
      },
      control: {
        serialPath: config.CONTROL_SERIAL_PATH,
        baudRate: config.CONTROL_SERIAL_BAUDRATE,
      },
      voiceBroadcast: {
        cabinet: {
          volume: config.VOICE_CABINET_VOLUME,
          speed: config.VOICE_CABINET_SPEED,
        },
        control: {
          volume: config.VOICE_CONTROL_VOLUME,
          speed: config.VOICE_CONTROL_SPEED,
        },
      },
      timeout: config.HARDWARE_TIMEOUT,
      retryAttempts: config.HARDWARE_RETRY_ATTEMPTS,
      udpLocalPort: config.UDP_LOCAL_PORT,
      queryInterval: config.QUERY_INTERVAL,
      doorOpenTimeout: config.DOOR_OPEN_TIMEOUT_S,
      inputs: {
        apply: config.APPLY_INDEX,
        cabinetDoor: config.CABINET_DOOR_INDEX,
        doorJumpSwitch: config.DOOR_JUMP_SWITCH_INDEX,
        keySwitch: config.KEY_SWITCH_INDEX,
        vibrationSwitch: config.VIBRATION_SWITCH_INDEX,
        cabinetInput06: config.CABINET_INPUT_06_INDEX,
        cabinetInput07: config.CABINET_INPUT_07_INDEX,
        cabinetInput08: config.CABINET_INPUT_08_INDEX,
        storeReturn: config.STORE_RETURN_INDEX,
        controlInput: config.CONTROL_INPUT_INDEX,
        alarmCancel: config.ALARM_CANCEL_INDEX,
        authCancel: config.AUTH_CANCEL_INDEX,
        authPass: config.AUTH_PASS_INDEX,
      },
      relays: {
        lock: config.RELAY_LOCK_INDEX,
        cabinetAlarm: config.RELAY_CABINET_ALARM_INDEX,
        controlAlarm: config.RELAY_CONTROL_ALARM_INDEX,
      },
    },
    logging: {
      level: config.LOG_LEVEL,
      pretty: config.LOG_PRETTY,
    },
  };
}
