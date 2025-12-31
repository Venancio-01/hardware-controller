/**
 * Core Status Service - 追踪和管理 Core 进程的状态
 * @module services/core-status.service
 */
import { EventEmitter } from 'events';
import type { CoreStatus, CoreStatusResponse } from 'shared';
import { createModuleLogger } from 'shared';

const logger = createModuleLogger('CoreStatusService');

/**
 * Core 状态服务的状态快照
 */
export interface CoreStatusState {
  status: CoreStatus;
  startTime: number | null;
  lastError: string | null;
  lastUpdated: number;
  connections?: {
    cabinet: boolean;
    control: boolean;
  };
}

/**
 * Core 状态服务事件类型
 */
export interface CoreStatusEvents {
  statusChange: [CoreStatusResponse];
}

/**
 * Core 状态服务 - 单例模式
 * 负责追踪和管理 Core 进程的运行状态
 * 继承 EventEmitter 以支持状态变更事件
 */
class CoreStatusServiceClass extends EventEmitter {
  private state: CoreStatusState = {
    status: 'Starting',
    startTime: null,
    lastError: null,
    lastUpdated: Date.now(),
  };

  constructor() {
    super();
  }

  /**
   * 获取当前状态
   */
  getStatus(): CoreStatus {
    return this.state.status;
  }

  /**
   * 获取完整状态快照
   */
  getState(): Readonly<CoreStatusState> {
    return { ...this.state };
  }

  /**
   * 获取 API 响应格式的状态数据
   */
  getStatusResponse(): CoreStatusResponse {
    return {
      status: this.state.status,
      uptime: this.getUptime(),
      lastError: this.state.lastError,
      connections: this.state.connections,
    };
  }

  /**
   * 设置状态
   * @param status 新状态
   * @param error 可选的错误信息
   * @param connections 可选的连接状态
   */
  setStatus(status: CoreStatus, error?: string, connections?: { cabinet: boolean; control: boolean }): void {
    const previousStatus = this.state.status;
    this.state.status = status;
    this.state.lastUpdated = Date.now();

    if (connections) {
      this.state.connections = connections;
    }

    if (status === 'Running' && !this.state.startTime) {
      this.state.startTime = Date.now();
    }

    if (error) {
      this.state.lastError = error;
    }

    // 清除非错误状态的错误信息
    if (status === 'Running') {
      this.state.lastError = null;
    }

    // 总是发送变更，因为 connections 可能变了但 status 没变
    logger.info(`Core 状态更新: ${status}${error ? ` (错误: ${error})` : ''} ${connections ? `[Conns: Cab=${connections.cabinet}, Ctrl=${connections.control}]` : ''}`);
    // 发射状态变更事件
    this.emit('statusChange', this.getStatusResponse());
  }

  /**
   * 获取 Core 运行时间（毫秒）
   */
  getUptime(): number | null {
    if (!this.state.startTime || this.state.status !== 'Running') {
      return null;
    }
    return Date.now() - this.state.startTime;
  }

  /**
   * 获取最后一个错误信息
   */
  getLastError(): string | null {
    return this.state.lastError;
  }

  /**
   * 标记 Core 为已启动（接收到 CORE:READY）
   */
  markReady(): void {
    this.state.startTime = Date.now();
    this.setStatus('Running');
    logger.info('Core 进程已就绪');
  }

  /**
   * 标记 Core 为已停止
   * @param code 退出码
   * @param signal 信号
   */
  markStopped(code: number | null, signal: string | null): void {
    const isError = code !== null && code !== 0;
    const errorMsg = signal
      ? `进程被信号 ${signal} 终止`
      : code !== null
        ? `进程退出，退出码: ${code}`
        : null;

    if (isError && errorMsg) {
      this.setStatus('Error', errorMsg);
    } else {
      this.setStatus('Stopped', errorMsg || undefined);
    }
  }

  /**
   * 标记 Core 启动超时
   */
  markTimeout(): void {
    this.setStatus('Error', '启动超时：未在指定时间内接收到 CORE:READY');
    logger.error('Core 进程启动超时');
  }

  /**
   * 标记自动恢复失败
   * @param retryCount 已重试次数
   */
  markRecoveryFailed(retryCount: number): void {
    const errorMsg = `自动恢复失败：已重试 ${retryCount} 次，需要手动干预`;
    this.setStatus('Error', errorMsg);
    logger.error(errorMsg);
  }

  /**
   * 重置状态（用于重启）
   */
  reset(): void {
    this.state = {
      status: 'Starting',
      startTime: null,
      lastError: null,
      lastUpdated: Date.now(),
    };
    logger.debug('Core 状态已重置');
    // 发射状态变更事件
    this.emit('statusChange', this.getStatusResponse());
  }
}

// 单例实例
export const CoreStatusService = new CoreStatusServiceClass();

