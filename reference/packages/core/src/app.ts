import { getConfigSummary, config } from './config/index.js';
import { createModuleLogger, logger, LogLevel } from 'shared';
import { HardwareCommunicationManager } from './hardware/manager.js';

/**
 * 字符串日志级别到 LogLevel 枚举的映射
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  trace: LogLevel.DEBUG, // trace 映射到 debug
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.ERROR, // fatal 映射到 error
};

/**
 * 根据配置文件初始化日志级别
 */
function initializeLogLevel(): void {
  const configLevel = config.LOG_LEVEL?.toLowerCase() ?? 'info';
  const logLevel = LOG_LEVEL_MAP[configLevel] ?? LogLevel.INFO;
  logger.setLevel(logLevel);
}
import { initializeHardware } from './hardware/initializer.js';
import { initializeVoiceBroadcast } from './voice-broadcast/initializer.js';
import { resetAllRelays } from './relay/index.js';
import { createMainActor } from './state-machines/main-machine.js';
import { sendReady, sendError, sendStatus } from './ipc/status-reporter.js';
import { forwardLog } from './ipc/log-forwarder.js';

/**
 * 启动应用程序
 */
export async function startApp() {
  // 首先初始化日志级别，确保所有后续日志使用正确的级别
  initializeLogLevel();

  // 使用标准 logger，关键日志通过 forwardLog 手动转发到 Backend
  const appLogger = createModuleLogger('App');
  const manager = new HardwareCommunicationManager();

  // Create Main State Machine Actor
  const mainActor = createMainActor(manager, appLogger);

  // 打印配置摘要
  appLogger.info('正在启动 Feed Control System 应用程序');
  appLogger.info('配置信息:', getConfigSummary());

  try {
    //  初始化硬件通信
    await initializeHardware(manager, appLogger);

    // 初始化语音播报
    await initializeVoiceBroadcast(manager, appLogger);

    // 重置继电器状态
    await resetAllRelays(manager, appLogger);

    // 启动主状态机
    mainActor.start();

    // 发送 CORE:READY 消息通知 Backend
    sendReady();

    // 发送初始连接状态
    const allStatus = manager.getAllConnectionStatus();
    const cabinetConnected = allStatus.tcp?.['cabinet'] === 'connected';
    const controlConnected = allStatus.serial?.['control'] === 'connected';

    // 发送 Running 状态以及当前的连接状态
    // 注意：sendStatus 需要 import ({ sendStatus })
    sendStatus('Running', undefined, { cabinet: cabinetConnected, control: controlConnected });
    // 需要检查 import 是否包含 sendStatus

    appLogger.info('Core 进程已就绪，已通知 Backend');

    // 关闭处理
    const shutdown = async () => {
      appLogger.info('\n正在关闭...');
      mainActor.stop();
      await manager.shutdown();
      appLogger.info('应用程序已停止');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendError(errorMessage);
    appLogger.error('启动应用程序失败', error as Error);
    process.exit(1);
  }
}

// 检查模块是否被直接运行（而不是被导入）
// 在 ESM 环境下，通过比较 import.meta.url 和 process.argv[1] 来确定是否直接运行
if (import.meta?.url) {
  try {
    // 解析当前文件路径和命令行参数中的脚本路径
    const currentFile = new URL(import.meta.url).pathname;
    const scriptFile = process.argv[1];

    // Check if this is the main module being executed directly
    // 支持 .js/.cjs (编译后) 和 .ts (tsx 直接运行) 两种情况
    const isAppFile = currentFile.includes('app.js') || currentFile.includes('app.ts') || currentFile.includes('app.cjs');
    const isScriptMatch = scriptFile.endsWith('app.js') || scriptFile.endsWith('app.ts') || scriptFile.endsWith('app.cjs');

    if (scriptFile && isAppFile && isScriptMatch) {
      startApp().catch(error => {
        console.error('Failed to start app:', error);
        process.exit(1);
      });
    }
  } catch (e) {
    // 如果 URL 解析失败，作为备选方案
    console.warn('Warning: Could not determine module execution context');
    // Only run if the process.argv contains our app file name and this is the main process
    if (process.argv[1] && (process.argv[1].includes('app') || process.argv[1].includes('core'))) {
      startApp().catch(error => {
        console.error('Failed to start app:', error);
        process.exit(1);
      });
    }
  }
}
