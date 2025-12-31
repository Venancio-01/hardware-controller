import { setup, createActor, sendParent, enqueueActions, fromCallback } from 'xstate';
import { type HardwareCommunicationManager } from '../hardware/manager.js';
import { parseActiveReportFrame, isActiveReportFrame, type RelayStatus } from '../relay/index.js';
import { EventPriority } from '../types/state-machine.js';
import { RelayStatusAggregator, type RelayClientId } from '../business-logic/index.js';
import { config } from '../config/index.js';
import { createModuleLogger } from 'shared';

const log = createModuleLogger('MonitorMachine');
// 心跳配置参数
const HEARTBEAT_INTERVAL_MS = 30000; // 30秒
type MonitorContext = {
  hardware: HardwareCommunicationManager;
  aggregator: RelayStatusAggregator;
  lastVibrationTime: number;
  lastCabinetHeartbeat: number;     // 柜体上次心跳时间
  lastControlHeartbeat: number;     // 控制台上次心跳时间
  cabinetConnected: boolean;        // 柜体连接状态
  controlConnected: boolean;        // 控制台连接状态
  isMonitorAlarming: boolean;       // 是否正在监控报警中 (legacy, might be specific to anomaly)
};
type MonitorEvent =
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'RELAY_DATA_RECEIVED'; clientId: string; data: Buffer }
  | { type: 'HEARTBEAT_CHECK' }
  | { type: 'HEARTBEAT_TIMEOUT' };
export const monitorMachine = setup({
  types: {
    context: {} as MonitorContext,
    events: {} as MonitorEvent,
    input: {} as { hardware: HardwareCommunicationManager }
  },
  actors: {
    heartbeatChecker: fromCallback<MonitorEvent>(({ sendBack }) => {
      const intervalId = setInterval(() => {
        sendBack({ type: 'HEARTBEAT_CHECK' });
      }, HEARTBEAT_INTERVAL_MS);
      return () => {
        clearInterval(intervalId);
      };
    })
  }
}).createMachine({
  id: 'monitor',
  initial: 'idle',
  context: ({ input }) => {
    const allStatus = input.hardware.getAllConnectionStatus();
    // 假设 'cabinet' 是 tcp, 'control' 是 serial。根据 initializeHardware 确认。
    const cabinetConnected = allStatus.tcp?.['cabinet'] === 'connected';
    const controlConnected = allStatus.serial?.['control'] === 'connected';
    const now = Date.now();
    return {
      hardware: input.hardware,
      aggregator: new RelayStatusAggregator(),
      lastVibrationTime: 0,
      lastCabinetHeartbeat: cabinetConnected ? now : 0,
      lastControlHeartbeat: controlConnected ? now : 0,
      cabinetConnected,
      controlConnected,
      isMonitorAlarming: false
    };
  },
  entry: [
    ({ context, self }) => {
      // 监听所有协议的数据（TCP 和 Serial）
      context.hardware.onIncomingData = (protocol, clientId, data) => {
        log.debug(`收到硬件数据: protocol=${protocol}, clientId=${clientId}, data=${data.toString('hex')}`);
        self.send({ type: 'RELAY_DATA_RECEIVED', clientId, data });
      };
    }
  ],
  on: {
    RELAY_DATA_RECEIVED: {
      actions: enqueueActions(({ context, event, enqueue }) => {
        const { clientId, data } = event;
        log.debug(`正在处理来自 ${clientId} 的继电器数据: ${data.toString('hex')}`);
        try {
          if (!isActiveReportFrame(data)) {
            log.debug(`跳过非主动上报帧: ${data.toString('hex')}`);
            return;
          }
          const report = parseActiveReportFrame(data);
          const status: RelayStatus = {
            rawHex: report.rawHex,
            channels: report.inputState
          };
          const combinedUpdate = context.aggregator.update(clientId as RelayClientId, status);
          if (!combinedUpdate) return;
          // TRACE DEBUG: 追踪取消按钮状态 (Index 8)
          if (clientId === 'control') {
            const idx = config.ALARM_CANCEL_SWITCH_INDEX;
            const p = combinedUpdate.previousCombined ? combinedUpdate.previousCombined[idx] : 'N/A';
            const c = combinedUpdate.combinedState[idx];
            const hasChanged = context.aggregator.hasIndexChanged(idx, combinedUpdate);
            log.info(`[TRACE] Control Data. Cancel(${idx}): ${p} -> ${c}. Changed: ${hasChanged}. Raw: ${status.rawHex}`);
          }
          // 更新心跳时间
          // const now = Date.now();
          // if (clientId === 'cabinet') {
          //   context.lastCabinetHeartbeat = now;
          //   if (!context.cabinetConnected) {
          //     context.cabinetConnected = true;
          //     log.info('柜体连接已恢复');
          //     enqueue.sendParent({
          //       type: 'monitor_connection_update',
          //       priority: EventPriority.P2,
          //       connections: { cabinet: true, control: context.controlConnected }
          //     });
          //   }
          // } else if (clientId === 'control') {
          //   context.lastControlHeartbeat = now;
          //   if (!context.controlConnected) {
          //     context.controlConnected = true;
          //     log.info('控制台连接已恢复');
          //     enqueue.sendParent({
          //       type: 'monitor_connection_update',
          //       priority: EventPriority.P2,
          //       connections: { cabinet: context.cabinetConnected, control: true }
          //     });
          //   }
          // }
          // if (context.isMonitorAlarming) {
          //   if (context.cabinetConnected && context.controlConnected) {
          //     log.info('监控完全恢复，发送 monitor_recover 事件');
          //     context.isMonitorAlarming = false;
          //     enqueue.sendParent({
          //       type: 'monitor_recover',
          //       priority: EventPriority.P2
          //     });
          //   }
          // }
          // 处理申请逻辑
          if (context.aggregator.hasIndexChanged(config.APPLY_SWITCH_INDEX, combinedUpdate)) {
            const isClosed = combinedUpdate.combinedState[config.APPLY_SWITCH_INDEX];
            log.info(`APPLY_SWITCH_INDEX (申请) 已变化. 闭合: ${isClosed}`);
            if (isClosed) {
              enqueue.sendParent({
                type: 'apply_request',
                priority: EventPriority.P2
              });
            }
          }
          // 处理授权通过逻辑
          if (context.aggregator.hasIndexChanged(config.AUTH_PASS_SWITCH_INDEX, combinedUpdate)) {
            const isClosed = combinedUpdate.combinedState[config.AUTH_PASS_SWITCH_INDEX];
            log.info(`AUTH_PASS_SWITCH_INDEX (授权) 已变化. 闭合: ${isClosed}`);
            if (isClosed) {
              enqueue.sendParent({
                type: 'authorize_request',
                priority: EventPriority.P2
              });
            }
          }
          // 处理授权拒绝逻辑
          if (context.aggregator.hasIndexChanged(config.AUTH_CANCEL_SWITCH_INDEX, combinedUpdate)) {
            const isClosed = combinedUpdate.combinedState[config.AUTH_CANCEL_SWITCH_INDEX];
            log.info(`AUTH_CANCEL_SWITCH_INDEX (授权拒绝) 已变化. 闭合: ${isClosed}`);
            if (isClosed) {
              enqueue.sendParent({
                type: 'refuse_request',
                priority: EventPriority.P2
              });
            }
          }
          // 处理柜门状态逻辑
          if (context.aggregator.hasIndexChanged(config.CABINET_DOOR_SWITCH_INDEX, combinedUpdate)) {
            const rawState = combinedUpdate.combinedState[config.CABINET_DOOR_SWITCH_INDEX];
            const isOpen = config.INVERT_SENSOR_STATE ? rawState : !rawState;
            log.info(`CABINET_DOOR_SWITCH_INDEX (柜门) 已变化. 原始状态: ${rawState}, 反转: ${config.INVERT_SENSOR_STATE}, 开门: ${isOpen}`);
            enqueue.sendParent({
              type: 'cabinet_lock_changed',
              priority: EventPriority.P2,
              isClosed: !isOpen  // true = 关门，false = 开门
            });
          }
          // 处理门锁开关逻辑
          if (context.aggregator.hasIndexChanged(config.DOOR_LOCK_SWITCH_INDEX, combinedUpdate)) {
            const rawState = combinedUpdate.combinedState[config.DOOR_LOCK_SWITCH_INDEX];
            const isOpen = config.INVERT_SENSOR_STATE ? rawState : !rawState;
            log.info(`DOOR_LOCK_SWITCH_INDEX (门锁开关) 已变化. 原始状态: ${rawState}, 反转: ${config.INVERT_SENSOR_STATE}, 拧开: ${isOpen}`);
            enqueue.sendParent({
              type: 'door_lock_switch_changed',
              priority: EventPriority.P2,
              isOpen  // true = 拧开，false = 拧回
            });
          }
          // 处理钥匙开关逻辑
          if (context.aggregator.hasIndexChanged(config.KEY_SWITCH_INDEX, combinedUpdate)) {
            const rawState = combinedUpdate.combinedState[config.KEY_SWITCH_INDEX];
            const isTriggered = config.INVERT_SENSOR_STATE ? rawState : !rawState;
            log.info(`KEY_SWITCH_INDEX (钥匙开关) 已变化. 原始状态: ${rawState}, 反转: ${config.INVERT_SENSOR_STATE}, 触发: ${isTriggered}`);
            if (isTriggered) {
              // 钥匙触发 -> 发送报警事件
              enqueue.sendParent({
                type: 'key_detected',
                priority: EventPriority.P1
              });
            } else {
              // 钥匙复位 -> 发送复位事件
              enqueue.sendParent({
                type: 'key_reset',
                priority: EventPriority.P2
              });
            }
          }
          // 处理震动开关逻辑
          // 默认为 close 状态（false = 闭合），触发时为 open 状态（true = 断开）
          if (context.aggregator.hasIndexChanged(config.VIBRATION_SWITCH_INDEX, combinedUpdate)) {
            const isOpen = combinedUpdate.combinedState[config.VIBRATION_SWITCH_INDEX]; // false = close（默认），true = open（触发）
            log.info(`VIBRATION_SWITCH_INDEX (震动开关) 已变化. 触发: ${isOpen}`);
            if (isOpen) {
              const now = Date.now();
              // 节流：配置的时间间隔
              if (now - context.lastVibrationTime > config.VIBRATION_THROTTLE_INTERVAL_MS) {
                context.lastVibrationTime = now;
                enqueue.sendParent({
                  type: 'vibration_detected',
                  priority: EventPriority.P1
                });
              } else {
                log.info('震动报警节流中，跳过触发');
              }
            }
          }
          // 处理报警取消按钮逻辑 - 主动上报模式（硬件每次按下只上报一次 low->high）
          // 使用 hasActiveReportTrigger 检测触发，然后重置状态以便下次能再次检测
          if (context.aggregator.hasActiveReportTrigger(config.ALARM_CANCEL_SWITCH_INDEX, clientId as 'cabinet' | 'control', combinedUpdate)) {
            log.info(`ALARM_CANCEL_SWITCH_INDEX (报警取消) 主动上报触发`);
            // 重置状态，以便下次按下能再次触发
            context.aggregator.resetChannelState(clientId as 'cabinet' | 'control', config.ALARM_CANCEL_SWITCH_INDEX);
            enqueue.sendParent({
              type: 'alarm_cancel_toggled',
              priority: EventPriority.P2
            });
          }
          if (combinedUpdate.changed && combinedUpdate.changeDescriptions.length > 0) {
            log.info(`[combined] 继电器状态变化: ${combinedUpdate.changeDescriptions.join(', ')}`);
          }
        } catch (err) {
          log.error('在 MonitorMachine 中解析继电器状态失败', err as Error);
        }
      })
    }
  },
  states: {
    idle: {
      on: {
        START: 'waiting'
      }
    },
    waiting: {
      invoke: {
        src: 'heartbeatChecker',
        id: 'heartbeatChecker'
      },
      on: {
        STOP: 'idle',
        HEARTBEAT_CHECK: {
          actions: enqueueActions(({ context, enqueue }) => {
            const now = Date.now();
            let connectionChanged = false;
            // 检查柜体心跳
            // 如果 lastCabinetHeartbeat 为 0，说明还没连上过，或者初始化状态。
            // 简单起见，如果超过间隔没收到数据，就认为断开
            if (now - context.lastCabinetHeartbeat > HEARTBEAT_INTERVAL_MS) {
              if (context.cabinetConnected) {
                context.cabinetConnected = false;
                connectionChanged = true;
                log.warn(`柜体心跳超时，距离上次心跳: ${now - context.lastCabinetHeartbeat}ms`);
              }
            }
            // 检查控制台心跳
            if (now - context.lastControlHeartbeat > HEARTBEAT_INTERVAL_MS) {
              if (context.controlConnected) {
                context.controlConnected = false;
                connectionChanged = true;
                log.warn(`控制台心跳超时，距离上次心跳: ${now - context.lastControlHeartbeat}ms`);
              }
            }
            if (connectionChanged) {
              enqueue.sendParent({
                type: 'monitor_connection_update',
                priority: EventPriority.P2,
                connections: { cabinet: context.cabinetConnected, control: context.controlConnected }
              });
              // 如果断开，触发报警
              if (!context.isMonitorAlarming && (!context.cabinetConnected || !context.controlConnected)) {
                log.error('心跳检测失败，触发监控报警');
                context.isMonitorAlarming = true;
                enqueue.sendParent({
                  type: 'monitor_anomaly',
                  priority: EventPriority.P1,
                  reason: 'heartbeat'
                });
              }
            }
          })
        }
      }
    },
    error: {
      entry: sendParent(({ event }) => ({
        type: 'monitor_anomaly',
        priority: EventPriority.P1,
        data: (event as any).data
      })),
      always: 'waiting'
    }
  }
});
export function createMonitorActor(hardware: HardwareCommunicationManager) {
  return createActor(monitorMachine, { input: { hardware } });
}
