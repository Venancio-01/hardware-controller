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
const HEARTBEAT_FAILURE_THRESHOLD = 3; // 连续3次失败

type MonitorContext = {
  hardware: HardwareCommunicationManager;
  aggregator: RelayStatusAggregator;
  lastVibrationTime: number;
  lastHeartbeatTime: number;        // 上次心跳时间（ms）
  heartbeatFailureCount: number;    // 连续失败次数
  isMonitorAlarming: boolean;       // 是否正在监控报警中
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
  context: ({ input }) => ({
    hardware: input.hardware,
    aggregator: new RelayStatusAggregator(),
    lastVibrationTime: 0,
    lastHeartbeatTime: Date.now(),
    heartbeatFailureCount: 0,
    isMonitorAlarming: false
  }),
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

          // 更新心跳时间
          context.lastHeartbeatTime = Date.now();
          context.heartbeatFailureCount = 0;

          // 如果当前正在监控报警中且收到有效帧，发送恢复事件
          if (context.isMonitorAlarming) {
            log.info('监控恢复，发送 monitor_recover 事件');
            context.isMonitorAlarming = false;
            enqueue.sendParent({
              type: 'monitor_recover',
              priority: EventPriority.P2
            });
          }

          // 处理申请逻辑
          if (hasEdgeChanged(report, clientId, config.APPLY_INDEX)) {
            const isClosed = combinedUpdate.combinedState[config.APPLY_INDEX];
            log.info(`APPLY_INDEX (申请) 已变化. 闭合: ${isClosed}`);
            if (isClosed) {
              enqueue.sendParent({
                type: 'apply_request',
                priority: EventPriority.P2
              });
            }
          }

          // 处理授权通过逻辑
          if (hasEdgeChanged(report, clientId, config.AUTH_PASS_INDEX)) {
            const isClosed = combinedUpdate.combinedState[config.AUTH_PASS_INDEX];
            log.info(`AUTH_PASS_INDEX (授权) 已变化. 闭合: ${isClosed}`);
            if (isClosed) {
              enqueue.sendParent({
                type: 'authorize_request',
                priority: EventPriority.P2
              });
            }
          }

          // 处理授权拒绝逻辑
          if (hasEdgeChanged(report, clientId, config.AUTH_CANCEL_INDEX)) {
            const isClosed = combinedUpdate.combinedState[config.AUTH_CANCEL_INDEX];
            log.info(`AUTH_CANCEL_INDEX (授权拒绝) 已变化. 闭合: ${isClosed}`);
            if (isClosed) {
              enqueue.sendParent({
                type: 'refuse_request',
                priority: EventPriority.P2
              });
            }
          }


          // 处理柜门状态逻辑
          // INVERT_SENSOR_STATE 为 true 时: 闭合状态为报警状态，断开状态为正常状态
          // INVERT_SENSOR_STATE 为 false 时: 断开状态为报警状态，闭合状态为正常状态
          if (hasEdgeChanged(report, clientId, config.CABINET_DOOR_INDEX)) {
            const rawState = combinedUpdate.combinedState[config.CABINET_DOOR_INDEX]; // true = 闭合，false = 断开
            // true: 闭合(报警) -> 开门, 断开(正常) -> 关门
            // false: 断开(报警) -> 开门, 闭合(正常) -> 关门
            const isOpen = config.INVERT_SENSOR_STATE ? rawState : !rawState;
            log.info(`CABINET_DOOR_INDEX (柜门) 已变化. 原始状态: ${rawState}, 反转: ${config.INVERT_SENSOR_STATE}, 开门: ${isOpen}`);
            enqueue.sendParent({
              type: 'cabinet_lock_changed',
              priority: EventPriority.P2,
              isClosed: !isOpen  // true = 关门，false = 开门
            });
          }

          // 处理门锁开关逻辑
          // INVERT_SENSOR_STATE 为 true 时: 闭合状态为触发状态，断开状态为正常状态
          // INVERT_SENSOR_STATE 为 false 时: 断开状态为触发状态，闭合状态为正常状态
          if (hasEdgeChanged(report, clientId, config.DOOR_LOCK_SWITCH_INDEX)) {
            const rawState = combinedUpdate.combinedState[config.DOOR_LOCK_SWITCH_INDEX]; // true = 闭合，false = 断开
            // true: 闭合 -> 触发, 断开 -> 未触发
            // false: 断开 -> 触发, 闭合 -> 未触发
            const isTriggered = config.INVERT_SENSOR_STATE ? rawState : !rawState;
            log.info(`DOOR_LOCK_SWITCH_INDEX (门锁开关) 已变化. 原始状态: ${rawState}, 反转: ${config.INVERT_SENSOR_STATE}, 触发: ${isTriggered}`);
            enqueue.sendParent({
              type: 'door_jump_switch_changed',
              priority: EventPriority.P2,
              isTriggered  // true = 触发，false = 未触发
            });
          }

          // 处理钥匙开关逻辑
          // INVERT_SENSOR_STATE 为 true 时: 闭合状态为触发状态，断开状态为正常状态
          // INVERT_SENSOR_STATE 为 false 时: 断开状态为触发状态，闭合状态为正常状态
          if (hasEdgeChanged(report, clientId, config.KEY_SWITCH_INDEX)) {
            const rawState = combinedUpdate.combinedState[config.KEY_SWITCH_INDEX]; // true = 闭合，false = 断开
            // true: 闭合 -> 触发, 断开 -> 未触发
            // false: 断开 -> 触发, 闭合 -> 未触发
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
          if (hasEdgeChanged(report, clientId, config.VIBRATION_SWITCH_INDEX)) {
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

          // 处理报警取消按钮逻辑
          if (hasEdgeChanged(report, clientId, config.ALARM_CANCEL_INDEX)) {
            log.info(`ALARM_CANCEL_INDEX (报警取消) 已变化`);
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
            const elapsed = now - context.lastHeartbeatTime;

            if (elapsed > HEARTBEAT_INTERVAL_MS) {
              context.heartbeatFailureCount++;
              log.warn(`心跳检测失败 (${context.heartbeatFailureCount}/${HEARTBEAT_FAILURE_THRESHOLD})，距离上次心跳: ${elapsed}ms`);

              if (context.heartbeatFailureCount >= HEARTBEAT_FAILURE_THRESHOLD && !context.isMonitorAlarming) {
                log.error('心跳检测连续失败，触发监控报警');
                context.isMonitorAlarming = true;
                enqueue.sendParent({
                  type: 'monitor_anomaly',
                  priority: EventPriority.P1,
                  reason: 'heartbeat'
                });
              }
            } else {
              log.debug(`心跳正常，距离上次心跳: ${elapsed}ms`);
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

function hasEdgeChanged(
  report: { risingEdge: number[]; fallingEdge: number[] },
  clientId: string,
  index: number
): boolean {
  const offset = clientId === 'control' ? 8 : 0;
  const localIndex = index - offset;

  if (localIndex < 0 || localIndex > 7) {
    return false;
  }

  return report.risingEdge.includes(localIndex) || report.fallingEdge.includes(localIndex);
}
