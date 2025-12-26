// ==================== 基础设施 ====================
export * from './config/index.js';
export * from 'shared';

// ==================== 类型定义 ====================
export * from './types/index.js';
export * from './types/state-machine.js';

// ==================== 网络通信 ====================
export * from './tcp/client.js';
export * from './udp/client.js';

// ==================== 硬件抽象 ====================
export * from './hardware/manager.js';
export * from './hardware/initializer.js';

// ==================== 语音播报 ====================
export * from './voice-broadcast/index.js';

// ==================== 状态机 ====================
export * from './state-machines/main-machine.js';
export * from './state-machines/monitor-machine.js';
export * from './state-machines/alarm-machine.js';
export * from './state-machines/apply-ammo-machine.js';

// ==================== 继电器控制 ====================
export * from './relay/index.js';

// ==================== 业务逻辑 ====================
export * from './business-logic/index.js';

// ==================== 应用入口 ====================
export { startApp } from './app.js';
