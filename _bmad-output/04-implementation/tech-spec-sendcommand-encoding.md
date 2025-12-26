# Tech-Spec: sendCommand 编码参数重构

**Created:** 2025-12-26
**Status:** Ready for Development

## Overview

### Problem Statement

`HardwareCommunicationManager.sendCommand` 方法目前的编码逻辑是：
- UDP 协议固定使用 ASCII 编码
- 其他协议固定使用 UTF-8 编码

这无法满足以下需求：
1. **继电器控制**：需要发送十六进制命令（当前通过传入 Buffer 绕过）
2. **语音播报**：需要 GB2312 编码（当前在模块内部预处理后传入 Buffer）
3. **未来扩展**：可能需要更灵活的编码控制

### Solution

为 `sendCommand` 方法添加可选的 `encoding` 参数，允许调用方指定字符串到 Buffer 的编码方式：
- **默认行为**：`'hex'`（十六进制），适合大多数硬件控制场景
- **可选**：`'ascii'` 用于语音播报文本命令，`'utf-8'` 用于其他场景
- **Buffer 输入**：直接使用，不做任何编码转换

### Scope

**In Scope:**
- 修改 `sendCommand` 方法签名，添加 `encoding` 参数
- 更新编码转换逻辑
- 保持向后兼容（现有调用无需修改）

**Out of Scope:**
- 修改语音播报模块（已自行处理 GB2312 编码，传入 Buffer）
- 修改继电器模块（已传入 Buffer）

## Context for Development

### Codebase Patterns

1. **方法签名风格**：使用可选参数，默认值在方法签名中定义
2. **Buffer 处理**：`Buffer.isBuffer()` 检查输入类型
3. **日志记录**：使用 `this.log.debug()` 记录命令详情

### Files to Reference

| 文件 | 用途 |
|------|------|
| [manager.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/hardware/manager.ts) | 主要修改文件 |
| [voice-broadcast/index.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/voice-broadcast/index.ts) | 调用示例（传入 Buffer） |
| [relay/reset.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/relay/reset.ts) | 调用示例（传入 Buffer） |

### Technical Decisions

1. **默认编码选择 `hex`**：
   - 大多数硬件控制命令是十六进制格式
   - 与现有 Buffer 传入方式保持语义一致

2. **保持 Buffer 优先级**：
   - 如果传入 Buffer，直接使用，忽略 encoding 参数
   - 这保证了向后兼容性

3. **类型定义**：
   ```typescript
   type CommandEncoding = 'hex' | 'ascii' | 'utf-8';
   ```

## Implementation Plan

### Tasks

- [ ] Task 1: 在 `types/index.ts` 中添加 `CommandEncoding` 类型
- [ ] Task 2: 修改 `sendCommand` 方法签名和编码逻辑
- [ ] Task 3: 更新日志输出，显示使用的编码方式
- [ ] Task 4: 添加单元测试

### 详细改动

#### Task 2: 修改 sendCommand

**修改前 (Line 160-173):**
```typescript
async sendCommand(
  protocol: Protocol,
  command: string | Buffer,
  parameters?: Record<string, unknown>,
  clientId?: string,
  expectResponse = true
): Promise<Record<string, HardwareResponse | undefined>> {
  let commandBuffer: Buffer;
  if (Buffer.isBuffer(command)) {
    commandBuffer = command;
  } else {
    const encoding = protocol === 'udp' ? 'ascii' : 'utf-8';
    commandBuffer = Buffer.from(String(command), encoding);
  }
```

**修改后:**
```typescript
async sendCommand(
  protocol: Protocol,
  command: string | Buffer,
  parameters?: Record<string, unknown>,
  clientId?: string,
  expectResponse = true,
  encoding: CommandEncoding = 'hex'
): Promise<Record<string, HardwareResponse | undefined>> {
  let commandBuffer: Buffer;
  if (Buffer.isBuffer(command)) {
    commandBuffer = command;
  } else if (encoding === 'hex') {
    // 将十六进制字符串转换为 Buffer
    // 例如: "48454C4C4F" -> <Buffer 48 45 4c 4c 4f>
    commandBuffer = Buffer.from(String(command).replace(/\s/g, ''), 'hex');
  } else {
    commandBuffer = Buffer.from(String(command), encoding);
  }
```

### Acceptance Criteria

- [ ] AC 1: `sendCommand(..., 'hex')` 能正确将十六进制字符串转为 Buffer
- [ ] AC 2: `sendCommand(..., 'ascii')` 能正确进行 ASCII 编码
- [ ] AC 3: 传入 Buffer 时，不受 encoding 参数影响
- [ ] AC 4: 默认行为为 hex 编码
- [ ] AC 5: 现有调用（传入 Buffer）无需修改

## Additional Context

### Dependencies

无新增依赖

### Testing Strategy

```typescript
describe('sendCommand encoding', () => {
  it('should convert hex string to buffer when encoding is hex', () => {
    // 输入: "48454C4C4F"
    // 期望: Buffer.from([0x48, 0x45, 0x4C, 0x4C, 0x4F])
  });

  it('should use ascii encoding when specified', () => {
    // 输入: "HELLO", encoding: 'ascii'
    // 期望: Buffer.from("HELLO", 'ascii')
  });

  it('should pass Buffer directly without encoding', () => {
    // 输入: Buffer.from([0x01, 0x02])
    // 期望: 原样传入底层客户端
  });
});
```

### Notes

- 语音播报模块已在内部使用 `iconv.encode(..., 'gb2312')` 处理编码，无需修改
- 继电器模块已传入 Buffer，无需修改
- 此重构主要为未来新增功能提供更灵活的编码选项
