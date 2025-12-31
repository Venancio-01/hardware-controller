
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HardwareCommunicationManager } from '../../src/hardware/manager.js';

// Mock TCPClient - 使用 class 形式 mock
vi.mock('../../src/tcp/client.js', () => {
  return {
    TCPClient: class {
      connect = vi.fn().mockResolvedValue(undefined);
      send = vi.fn().mockResolvedValue({ data: Buffer.from('OK') });
      sendNoWait = vi.fn().mockResolvedValue(undefined);
      addMessageListener = vi.fn();
      getRemoteAddress = vi.fn().mockReturnValue({ address: '127.0.0.1', port: 1234 });
      disconnect = vi.fn().mockResolvedValue(undefined);
      getStatus = vi.fn().mockReturnValue('connected');
    }
  };
});

describe('HardwareCommunicationManager Queue', () => {
  let manager: HardwareCommunicationManager;
  let mockTcpClient: any;
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  beforeEach(async () => {
    // 不使用 Fake Timers
    manager = new HardwareCommunicationManager();

    // 初始化一个 TCP 客户端用于测试
    await manager.initialize({
      tcpClients: [{
        id: 'test-client',
        targetHost: '127.0.0.1',
        targetPort: 8080
      }]
    });

    // 获取 mock 实例
    // @ts-ignore - 访问私有属性用于测试
    mockTcpClient = manager.clients.tcp.get('test-client');
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  it('应该按顺序把命令加入队列并执行', async () => {
    const cmd1 = Buffer.from('CMD1');
    const cmd2 = Buffer.from('CMD2');

    // 两个命令同时入队
    const p1 = manager.queueCommand('tcp', cmd1, 'test-client');
    const p2 = manager.queueCommand('tcp', cmd2, 'test-client');

    // 等待第一个命令执行 (异步 sendCommand)
    await wait(20);

    // 初始状态：第一个命令应该已经尝试发送
    expect(mockTcpClient.send).toHaveBeenCalledTimes(1);
    expect(mockTcpClient.send).toHaveBeenLastCalledWith(cmd1);

    // 等待间隔 (50ms) + 缓冲
    await wait(80);

    // 第二个命令应该发送
    expect(mockTcpClient.send).toHaveBeenCalledTimes(2);
    expect(mockTcpClient.send).toHaveBeenLastCalledWith(cmd2);

    await Promise.all([p1, p2]);
  });

  it('应该遵守设定的间隔', async () => {
    manager.setQueueInterval(200);

    const cmd1 = Buffer.from('CMD1');
    const cmd2 = Buffer.from('CMD2');

    manager.queueCommand('tcp', cmd1, 'test-client');
    manager.queueCommand('tcp', cmd2, 'test-client');

    await wait(20);
    expect(mockTcpClient.send).toHaveBeenCalledTimes(1);

    // 等待 150ms，不应触发第二次调用
    await wait(150);
    expect(mockTcpClient.send).toHaveBeenCalledTimes(1);

    // 再等待 100ms (总共 270ms > 200ms)，应触发
    await wait(100);
    expect(mockTcpClient.send).toHaveBeenCalledTimes(2);
  });

  it('应该正确处理命令失败', async () => {
    mockTcpClient.send.mockRejectedValueOnce(new Error('Send failed'));

    const cmd1 = Buffer.from('CMD1');
    const cmd2 = Buffer.from('CMD2');

    const p1 = manager.queueCommand('tcp', cmd1, 'test-client');
    const p2 = manager.queueCommand('tcp', cmd2, 'test-client');

    await wait(20);

    // p1 应该 resolve，但包含错误信息，因为 sendCommand 捕获了错误并返回
    const result1 = await p1;

    expect(result1).toBeDefined();
    expect(result1['test-client']).toBeDefined();
    expect(result1['test-client']!.success).toBe(false);
    expect(result1['test-client']!.error).toBe('Send failed');

    // 即使第一个失败，队列应该继续处理第二个
    await wait(80);

    expect(mockTcpClient.send).toHaveBeenCalledTimes(2);
    expect(mockTcpClient.send).toHaveBeenLastCalledWith(cmd2);

    const result2 = await p2;
    expect(result2['test-client']?.data).toEqual(Buffer.from('OK'));
  });
});
