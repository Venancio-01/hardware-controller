import { setup, createActor, sendParent } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { type StructuredLogger } from 'shared';
import { VoiceBroadcast } from '../voice-broadcast/index.js';
import { RelayCommandBuilder, type RelayChannel } from '../relay/index.js';
import { config } from '../config/index.js';

export type AlarmEvent =
  | { type: 'ALARM_DETECTED' }
  | { type: 'VIBRATION_DETECTED' }
  | { type: 'KEY_DETECTED' }
  | { type: 'KEY_RESET' }
  | { type: 'ACKNOWLEDGE' }
  | { type: 'RESOLVE' }
  | { type: 'ALARM_CANCEL' }
  | { type: 'MONITOR_DETECTED'; reason: 'connection' | 'heartbeat' | 'network' }
  | { type: 'RECOVER' };

// 监控报警语音映射
const MONITOR_ALARM_MESSAGES: Record<string, string> = {
  connection: '设备连接异常',
  heartbeat: '设备心跳异常',
  network: '网络连接异常'
};

export const alarmMachine = setup({
  types: {
    context: {} as { hardware: HardwareCommunicationManager; logger: StructuredLogger; trigger?: string; monitorReason?: 'connection' | 'heartbeat' | 'network' },
    events: {} as AlarmEvent,
    input: {} as { hardware: HardwareCommunicationManager; logger: StructuredLogger; trigger?: string; monitorReason?: 'connection' | 'heartbeat' | 'network' }
  },
  actions: {
    broadcastVibrationAlarm: ({ context }) => {
      context.logger.info('[AlarmMachine] 触发震动报警');

      VoiceBroadcast.getInstance().cabinet.broadcast('柜体震动报警');
      VoiceBroadcast.getInstance().control.broadcast('柜体震动报警');

      const cabinetCommand = RelayCommandBuilder.close(config.ALARM_LIGHT_INDEX as RelayChannel);
      context.hardware.queueCommand('tcp', cabinetCommand, 'cabinet', false);

      const controlCommand = RelayCommandBuilder.close(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.hardware.queueCommand('serial', controlCommand, 'control', false);
    },
    resetAlarm: ({ context }) => {
      context.logger.info('[AlarmMachine] 解除报警');

      VoiceBroadcast.getInstance().cabinet.broadcast('取消报警');
      VoiceBroadcast.getInstance().control.broadcast('取消报警');

      const cabinetCommand = RelayCommandBuilder.open(config.ALARM_LIGHT_INDEX as RelayChannel);
      context.hardware.queueCommand('tcp', cabinetCommand, 'cabinet', false);

      const controlCommand = RelayCommandBuilder.open(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.hardware.queueCommand('serial', controlCommand, 'control', false);
    },
    broadcastKeyAlarm: ({ context }) => {
      context.logger.info('[AlarmMachine] 触发钥匙报警');

      VoiceBroadcast.getInstance().cabinet.broadcast('钥匙开门请核实');
      VoiceBroadcast.getInstance().control.broadcast('钥匙开门请核实');

      const cabinetCommand = RelayCommandBuilder.close(config.ALARM_LIGHT_INDEX as RelayChannel);
      context.hardware.queueCommand('tcp', cabinetCommand, 'cabinet', false);

      const controlCommand = RelayCommandBuilder.close(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.hardware.queueCommand('serial', controlCommand, 'control', false);
    },
    broadcastKeyReset: ({ context }) => {
      context.logger.info('[AlarmMachine] 钥匙已复位');
      VoiceBroadcast.getInstance().cabinet.broadcast('钥匙已复位，请取消报警');
      VoiceBroadcast.getInstance().control.broadcast('钥匙已复位，请取消报警');
    },
    // 监控报警：仅控制端报警器和语音
    broadcastMonitorAlarm: ({ context }) => {
      const reason = context.monitorReason || 'heartbeat';
      const message = MONITOR_ALARM_MESSAGES[reason] || '设备状态异常';
      context.logger.info(`[AlarmMachine] 触发监控报警: ${reason}`);

      // 仅控制端语音播报和报警器
      VoiceBroadcast.getInstance().control.broadcast(message);

      const controlCommand = RelayCommandBuilder.close(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.hardware.queueCommand('serial', controlCommand, 'control', false);
    },
    resetMonitorAlarm: ({ context }) => {
      context.logger.info('[AlarmMachine] 解除监控报警');

      // 仅控制端
      VoiceBroadcast.getInstance().control.broadcast('取消报警');

      const controlCommand = RelayCommandBuilder.open(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.hardware.queueCommand('serial', controlCommand, 'control', false);
    },
    silentResetMonitorAlarm: ({ context }) => {
      context.logger.info('[AlarmMachine] 静默解除监控报警');

      // 仅关闭控制端报警器，无语音
      const controlCommand = RelayCommandBuilder.open(config.RELAY_CONTROL_ALARM_INDEX as RelayChannel);
      context.hardware.queueCommand('serial', controlCommand, 'control', false);
    }
  }
}).createMachine({
  id: 'alarm',
  context: ({ input }) => ({
    hardware: input.hardware,
    logger: input.logger,
    trigger: input.trigger,
    monitorReason: input.monitorReason
  }),
  initial: 'determining',
  states: {
    determining: {
      always: [
        { guard: ({ context }) => context.trigger === 'KEY_DETECTED', target: 'key_alarm' },
        { guard: ({ context }) => context.trigger === 'VIBRATION_DETECTED', target: 'vibration_alarm' },
        { guard: ({ context }) => context.trigger === 'MONITOR_DETECTED', target: 'monitor_alarm' },
        { target: 'idle' } // Default if no trigger matched (shouldn't happen broadly)
      ]
    },
    idle: {
      on: {
        KEY_DETECTED: 'key_alarm',
        VIBRATION_DETECTED: 'vibration_alarm',
        ALARM_DETECTED: 'active'
      }
    },
    key_alarm: {
      entry: 'broadcastKeyAlarm',
      on: {
        KEY_RESET: {
          actions: 'broadcastKeyReset'
        },
        VIBRATION_DETECTED: {
          actions: 'broadcastVibrationAlarm'
        },
        MONITOR_DETECTED: {
          actions: 'broadcastMonitorAlarm'
        },
        ALARM_CANCEL: {
          actions: ['resetAlarm', sendParent({ type: 'alarm_cancelled' })],
          target: 'idle'
        }
      }
    },
    vibration_alarm: {
      entry: 'broadcastVibrationAlarm',
      on: {
        VIBRATION_DETECTED: {
          actions: 'broadcastVibrationAlarm'
        },
        KEY_DETECTED: {
          actions: 'broadcastKeyAlarm',
          target: 'key_alarm'
          // 钥匙报警优先级更高，切换到钥匙报警状态
        },
        KEY_RESET: {
          actions: 'broadcastKeyReset'
          // 即使在震动报警状态也播放钥匙复位，以防遗漏
        },
        MONITOR_DETECTED: {
          actions: 'broadcastMonitorAlarm'
          // 保持当前状态，只播放监控报警
        },
        ALARM_CANCEL: {
          actions: ['resetAlarm', sendParent({ type: 'alarm_cancelled' })],
          target: 'idle'
        }
      }
    },
    monitor_alarm: {
      entry: 'broadcastMonitorAlarm',
      on: {
        KEY_DETECTED: {
          actions: 'broadcastKeyAlarm',
          target: 'key_alarm'
          // 钥匙报警优先级更高，切换到钥匙报警状态
        },
        KEY_RESET: {
          actions: 'broadcastKeyReset'
        },
        VIBRATION_DETECTED: {
          actions: 'broadcastVibrationAlarm',
          target: 'vibration_alarm'
          // 切换到震动报警状态
        },
        ALARM_CANCEL: {
          actions: ['resetMonitorAlarm', sendParent({ type: 'alarm_cancelled' })],
          target: 'idle'
        },
        RECOVER: {
          actions: ['silentResetMonitorAlarm', sendParent({ type: 'alarm_cancelled' })],
          target: 'idle'
        }
      }
    },
    active: {
      on: {
        ACKNOWLEDGE: 'acknowledged',
        RESOLVE: 'idle'
      }
    },
    acknowledged: {
      on: {
        RESOLVE: 'idle'
      }
    }
  }
});

export function createAlarmActor(hardware: HardwareCommunicationManager, logger: StructuredLogger) {
  return createActor(alarmMachine, { input: { hardware, logger } });
}
