export enum EventPriority {
  P0 = 0, // Critical: Key Open, Vibration Alarm
  P1 = 1, // High: Monitor Anomaly
  P2 = 2, // Normal: Business Flow
  P3 = 3  // Low: Maintenance
}

export enum MainState {
  IDLE = 'idle',
  NORMAL = 'normal',
  ALARM = 'alarm',
  ERROR = 'error'
}

export interface BaseEvent {
  type: string;
  priority: EventPriority;
  timestamp?: number;
}

// P0 Events
export type KeyDetectedEvent = BaseEvent & { type: 'key_detected'; priority: EventPriority.P0 };
export type VibrationDetectedEvent = BaseEvent & { type: 'vibration_detected'; priority: EventPriority.P0 };

// P1 Events
export type MonitorAnomalyEvent = BaseEvent & { type: 'monitor_anomaly'; priority: EventPriority.P1; data: any };

// P2 Events
export type ApplyRequestEvent = BaseEvent & { type: 'apply_request'; priority: EventPriority.P2 };
export type AuthorizeRequestEvent = BaseEvent & { type: 'authorize_request'; priority: EventPriority.P2 };
export type RefuseRequestEvent = BaseEvent & { type: 'refuse_request'; priority: EventPriority.P2 };
export type FinishRequestEvent = BaseEvent & { type: 'finish_request'; priority: EventPriority.P2 };
export type OperationCompleteEvent = BaseEvent & { type: 'operation_complete'; priority: EventPriority.P2 };
export type CabinetLockChangedEvent = BaseEvent & { type: 'cabinet_lock_changed'; priority: EventPriority.P2; isClosed: boolean };
export type AlarmCancelledEvent = BaseEvent & { type: 'alarm_cancelled'; priority: EventPriority.P2 };

// P3 Events
export type MaintenanceEvent = BaseEvent & { type: 'maintenance_check'; priority: EventPriority.P3 };
export type MonitorTickEvent = BaseEvent & { type: 'monitor_tick'; priority: EventPriority.P3 };

export type SystemEvent =
  | KeyDetectedEvent
  | VibrationDetectedEvent
  | MonitorAnomalyEvent
  | ApplyRequestEvent
  | AuthorizeRequestEvent
  | RefuseRequestEvent
  | FinishRequestEvent
  | OperationCompleteEvent
  | CabinetLockChangedEvent
  | AlarmCancelledEvent
  | MaintenanceEvent
  | MonitorTickEvent;