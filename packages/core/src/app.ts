import { getConfigSummary } from './config/index.js';
import { createModuleLogger } from './logger/index.js';
import { HardwareCommunicationManager } from './hardware/manager.js';
import { initializeHardware } from './hardware/initializer.js';
import { initializeVoiceBroadcast } from './voice-broadcast/initializer.js';
import { resetAllRelays } from './relay/index.js';
import { createMainActor } from './state-machines/main-machine.js';

/**
 * 启动应用程序
 */
export async function startApp() {
  const appLogger = createModuleLogger('App');
  const manager = new HardwareCommunicationManager();

  // Create Main State Machine Actor
  const mainActor = createMainActor(manager, appLogger);

  // 打印配置摘要
  appLogger.info('正在启动 Node Switch 应用程序');
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
    // 支持 .js (编译后) 和 .ts (tsx 直接运行) 两种情况
    const isAppFile = currentFile.includes('app.js') || currentFile.includes('app.ts');
    const isScriptMatch = scriptFile.endsWith('app.js') || scriptFile.endsWith('app.ts');

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
