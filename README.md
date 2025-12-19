# Node.js + TypeScript 硬件通信库

一个现代化的 Node.js + TypeScript 库，通过 UDP 和 TCP 协议与硬件设备进行通信。

## 特性

- 🚀 **现代 TypeScript**: 使用最新的 TypeScript 语法和特性
- 📡 **双协议支持**: 同时支持 UDP 和 TCP 通信
- 🔄 **异步/等待**: 完全基于 Promise 的 API
- 🛡️ **错误处理**: 内置重试机制和超时处理
- 📊 **统计信息**: 内置通信统计和监控
- 🔧 **可配置**: 灵活的配置选项
- 📝 **类型安全**: 完整的 TypeScript 类型定义

## 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd node-switch

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 开发模式运行
pnpm dev
```

### 基本使用

```typescript
import { HardwareCommunicationManager } from './src/index.js';

async function main() {
  const manager = new HardwareCommunicationManager();

  // 初始化连接
  await manager.initialize({
    udp: {
      host: '192.168.1.100',
      port: 8080,
      timeout: 5000,
    },
    tcp: {
      host: '192.168.1.101',
      port: 9000,
      timeout: 5000,
    },
  });

  // 发送命令
  const response = await manager.sendCommand('udp', 'GET_STATUS');
  console.log('响应:', response);

  // 关闭连接
  await manager.shutdown();
}
```

## API 文档

### HardwareCommunicationManager

主要的通信管理器类，提供统一的硬件通信接口。

#### 方法

- `initialize(configs)`: 初始化 UDP/TCP 客户端
- `sendCommand(protocol, command, parameters?)`: 发送硬件命令
- `sendRawData(protocol, data)`: 发送原始数据
- `getStats()`: 获取通信统计信息
- `getConnectionStatus()`: 获取连接状态
- `shutdown()`: 关闭所有连接

### UDPClient

UDP 客户端类，提供 UDP 通信功能。

#### 特性

- 支持同步和异步消息发送
- 内置超时和重试机制
- 消息监听器支持
- 统计信息收集

### TCPClient

TCP 客户端类，提供可靠的 TCP 通信。

#### 特性

- 消息分帧支持
- 连接状态管理
- Keep-alive 支持
- 流量控制选项

## 示例

### 基本使用

```typescript
import { HardwareCommunicationManager } from './src/index.js';

const manager = new HardwareCommunicationManager();

await manager.initialize({
  udp: { host: '192.168.1.100', port: 8080 },
  tcp: { host: '192.168.1.101', port: 9000 },
});

// 发送心跳
const heartbeat = await manager.sendCommand('udp', 'HEARTBEAT');

// 配置设备
const config = await manager.sendCommand('tcp', 'CONFIG', {
  mode: 'auto',
  interval: 5000,
});
```

### 直接使用客户端

```typescript
import { UDPClient, TCPClient } from './src/index.js';

const udpClient = new UDPClient({
  host: '192.168.1.100',
  port: 8080,
});

await udpClient.connect();

// 添加消息监听器
udpClient.addMessageListener((data, remote) => {
  console.log('收到消息:', data.toString());
});

// 发送消息
const response = await udpClient.send('HELLO');
```

## 配置

### 网络配置

```typescript
interface NetworkConfig {
  host: string;        // 目标主机地址
  port: number;        // 目标端口
  timeout?: number;    // 超时时间（毫秒）
  retries?: number;    // 重试次数
}
```

### 硬件命令

```typescript
interface HardwareCommand {
  command: string;           // 命令名称
  parameters?: Record<string, unknown>; // 参数
  expectResponse?: boolean;  // 是否期待响应
  timeout?: number;         // 超时时间
}
```

## 工具

### 序列化器

```typescript
import { HardwareCommandSerializer } from './src/utils/serializer.js';

const serializer = new HardwareCommandSerializer();

// 序列化命令
const commandBuffer = serializer.serializeCommand('GET_STATUS');

// 创建特殊命令
const heartbeat = serializer.createHeartbeat();
const statusCmd = serializer.createStatusCommand();
```

### 错误处理

```typescript
try {
  const response = await manager.sendCommand('udp', 'INVALID_CMD');
} catch (error) {
  console.error('命令发送失败:', error);
}
```

## 开发

### 项目结构

```
src/
├── index.ts           # 主入口文件
├── types/            # 类型定义
│   └── index.ts
├── udp/              # UDP 客户端
│   └── client.ts
├── tcp/              # TCP 客户端
│   └── client.ts
└── utils/            # 工具函数
    └── serializer.ts
```

### 可用脚本

```bash
pnpm dev      # 开发模式运行
pnpm build    # 构建项目
pnpm start    # 运行构建后的代码
pnpm test     # 运行测试
pnpm clean    # 清理构建文件
```

## 服务部署

项目提供了 systemd 服务文件，支持开机自启、崩溃重启和服务管理。

### 安装步骤

```bash
# 1. 构建项目
pnpm build

# 2. 将项目复制到目标目录
sudo mkdir -p /opt/node-switch
sudo cp -r dist package.json .env /opt/node-switch/
cd /opt/node-switch && sudo pnpm install --prod

# 3. 复制服务文件到 systemd 目录
sudo cp config/node-switch.service /etc/systemd/system/

# 4. 重新加载 systemd 配置并启用服务
sudo systemctl daemon-reload
sudo systemctl enable node-switch
sudo systemctl start node-switch
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `sudo systemctl start node-switch` | 启动服务 |
| `sudo systemctl stop node-switch` | 停止服务 |
| `sudo systemctl restart node-switch` | 重启服务 |
| `sudo systemctl status node-switch` | 查看状态 |
| `journalctl -u node-switch -f` | 实时查看日志 |

### 服务特性

- **崩溃自动重启**: 服务崩溃后 5 秒自动重启
- **重启限制**: 60 秒内最多重启 5 次
- **日志集成**: 通过 `journalctl` 查看日志

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 更新日志

### v1.0.0

- 初始版本发布
- UDP 和 TCP 客户端支持
- 硬件命令序列化
- 完整的 TypeScript 类型定义
- 示例和文档
