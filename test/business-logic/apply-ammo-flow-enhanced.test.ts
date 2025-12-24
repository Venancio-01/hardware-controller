import { HardwareCommunicationManager } from '../../src/hardware/manager.js';
import { createModuleLogger } from '../../src/logger/index.js';
import { VoiceBroadcastController } from '../../src/voice-broadcast/index.js';
import { RelayStatusAggregator, type RelayClientId } from '../../src/business-logic/relay-status-aggregator.js';
import { ApplyAmmoFlow } from '../../src/business-logic/apply-ammo-flow.js';
import { parseStatusResponse, RelayCommandBuilder } from '../../src/relay/controller.js';

// Mock VoiceBroadcastController
const broadcastMock = vi.fn();

vi.mock('../../src/voice-broadcast/index.js', () => ({
  VoiceBroadcastController: {
    initialize: vi.fn(),
    getInstance: () => ({ broadcast: broadcastMock }),
    isInitialized: () => true,
    destroy: vi.fn()
  }
}));

describe('ApplyAmmoFlow Enhanced - Door Open Timeout Alarm', () => {
  let manager: HardwareCommunicationManager;
  let relayAggregator: RelayStatusAggregator;
  let applyAmmoFlow: ApplyAmmoFlow;
  const logger = createModuleLogger('Test');
  let sendCommandSpy: any;
  
  beforeEach(async () => {
    vi.useFakeTimers();
    manager = new HardwareCommunicationManager();
    relayAggregator = new RelayStatusAggregator();
    applyAmmoFlow = new ApplyAmmoFlow(logger, manager);
    
    // Mock hardware setup
    vi.spyOn(manager, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(manager, 'getAllConnectionStatus').mockReturnValue({ udp: {}, tcp: {} });
    sendCommandSpy = vi.spyOn(manager, 'sendCommand').mockResolvedValue({}); 

    // Setup manual routing logic (same as in index.ts)
    manager.onIncomingData = async (protocol, clientId, data, remote, parsedResponse) => {
        const rawStr = data.toString('utf8').trim();
        if (rawStr.startsWith('dostatus')) {
            const status = parseStatusResponse(rawStr, 'dostatus');
            if (clientId === 'cabinet' || clientId === 'control') {
                const combinedUpdate = relayAggregator.update(clientId as RelayClientId, status);
                if (combinedUpdate && combinedUpdate.changed) {
                    applyAmmoFlow.handleCombinedChange(combinedUpdate.previousCombined, combinedUpdate.combinedState);
                }
            }
        }
    };

    applyAmmoFlow.start();
    broadcastMock.mockClear();
    sendCommandSpy.mockClear();
  });

  afterEach(() => {
    applyAmmoFlow.stop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should trigger relay alarms and voice broadcast when door open timeout occurs', async () => {
    // 1. 初始化状态 (全开/Low)
    manager.onIncomingData!('udp', 'control', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1235 }, {});
    manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1234 }, {});

    // 2. 申请供弹 (Cabinet Index 0 closed)
    manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus10000000'), { address: '127.0.0.1', port: 1234 }, {});
    
    // 3. 授权通过 (Control Index 1 closed)
    manager.onIncomingData!('udp', 'control', Buffer.from('dostatus11000000'), { address: '127.0.0.1', port: 1235 }, {});

    // 4. 打开柜门 (Cabinet Index 1 closed)
    manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus11000000'), { address: '127.0.0.1', port: 1234 }, {});
    
    expect(broadcastMock).toHaveBeenCalledWith('已开门，请取弹[=dan4]，取弹[=dan4]后请关闭柜门，并复位按键');
    broadcastMock.mockClear();
    sendCommandSpy.mockClear();

    // 5. 等待超时 (30秒)
    await vi.advanceTimersByTime(31000);

    // 6. 验证语音播报
    expect(broadcastMock).toHaveBeenCalledWith('柜门超时未关');

    // 7. 验证继电器指令 (Cabinet 8, Control 1 High)
    // 检查调用参数
    const openCommand1 = RelayCommandBuilder.close(1);
    const openCommand8 = RelayCommandBuilder.close(8);

    expect(sendCommandSpy).toHaveBeenCalledWith('udp', openCommand8, {}, 'cabinet', false);
    expect(sendCommandSpy).toHaveBeenCalledWith('udp', openCommand1, {}, 'control', false);
    expect(sendCommandSpy).not.toHaveBeenCalledWith('udp', openCommand1, {}, 'cabinet', false);
    expect(sendCommandSpy).not.toHaveBeenCalledWith('udp', openCommand8, {}, 'control', false);
  });

  it('should stop relay alarms when door is closed after timeout', async () => {
    // 1. 复现超时报警场景
    manager.onIncomingData!('udp', 'control', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1235 }, {});
    manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus00000000'), { address: '127.0.0.1', port: 1234 }, {});
    manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus10000000'), { address: '127.0.0.1', port: 1234 }, {});
    manager.onIncomingData!('udp', 'control', Buffer.from('dostatus11000000'), { address: '127.0.0.1', port: 1235 }, {});
    manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus11000000'), { address: '127.0.0.1', port: 1234 }, {});
    
    await vi.advanceTimersByTime(31000);
    broadcastMock.mockClear();
    sendCommandSpy.mockClear();

    // 2. 关闭柜门 (Cabinet Index 1 open again)
    await manager.onIncomingData!('udp', 'cabinet', Buffer.from('dostatus10000000'), { address: '127.0.0.1', port: 1234 }, {});
    await vi.advanceTimersByTimeAsync(50);

    // 3. 验证语音播报
    expect(broadcastMock).toHaveBeenCalledWith('柜门已关闭');

    // 4. 验证继电器指令 (Cabinet 8, Control 1 Low)
    const closeCommand1 = RelayCommandBuilder.open(1);
    const closeCommand8 = RelayCommandBuilder.open(8);

    expect(sendCommandSpy).toHaveBeenCalledWith('udp', closeCommand8, {}, 'cabinet', false);
    expect(sendCommandSpy).toHaveBeenCalledWith('udp', closeCommand1, {}, 'control', false);
  });
});