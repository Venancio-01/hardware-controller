# Tech-Spec: 修复 Relay Reset 执行失败问题

**Created:** 2025-12-26
**Status:** Implementation Complete

## 概述

### 问题描述

`packages/core/src/relay/reset.ts` 在应用启动时执行失败，错误信息：
```
TCP client 'control' not initialized
```

但手动测试 (`manual-test-relay.ts`) 可以成功与设备通信。

### 解决方案

修改 `reset.ts`，根据实际初始化的客户端动态选择协议，而不是硬编码同时发送 TCP 和 Serial。

### 范围

**In-Scope:**
- 修复 `reset.ts` 的发送目标逻辑
- 确保只向已初始化的客户端发送命令

**Out-of-Scope:**
- 修改硬件初始化配置
- 添加新的通信协议支持

## 问题根因分析

### 当前代码问题

**文件:** `packages/core/src/relay/reset.ts:13-16`
```typescript
const targets: { id: string; protocol: 'tcp' | 'serial' }[] = [];

targets.push({ id: 'control', protocol: 'serial' });
targets.push({ id: 'control', protocol: 'tcp' });  // ❌ 问题所在
```

**文件:** `packages/core/src/hardware/initializer.ts:17-28`
```typescript
// Control is now Serial-based
const serialClientsConfig = [
  {
    id: 'control',
    path: config.CONTROL_SERIAL_PATH,
    // ...
  }
];
```

**问题:** `reset.ts` 硬编码向 `control` 同时发送 TCP 和 Serial 命令，但 `initializer.ts` 只注册了 `control` 为 Serial 客户端，没有注册同名的 TCP 客户端。

### 手动测试成功的原因

`manual-test-relay.ts` 直接创建 TCP 连接到 `192.168.0.18:50000`，不依赖 `HardwareCommunicationManager` 的客户端注册机制。

## 实施计划

### 1. 修改 [reset.ts](file:///home/qingshan/workspace/front-end/node-switch/packages/core/src/relay/reset.ts)

**方案 A: 只保留 Serial（推荐）**

根据 `initializer.ts` 的注释 `// Control is now Serial-based`，控制端已迁移到 Serial，应该只发送到 Serial：

```diff
- targets.push({ id: 'control', protocol: 'serial' });
- targets.push({ id: 'control', protocol: 'tcp' });
+ // Control 设备通过 Serial 连接
+ targets.push({ id: 'control', protocol: 'serial' });
```

**方案 B: 从 Manager 动态获取可用客户端**

查询 `manager.getAllConnectionStatus()` 获取已初始化的客户端，只向已连接的发送：

```typescript
const status = manager.getAllConnectionStatus();
if (status.serial['control']) {
  targets.push({ id: 'control', protocol: 'serial' });
}
if (status.tcp['control']) {
  targets.push({ id: 'control', protocol: 'tcp' });
}
```

> [!IMPORTANT]
> **需要用户确认**: 请确认采用方案 A（只保留 Serial）还是方案 B（动态检测）。

## 验证计划

### 自动化测试

暂无现有的单元测试覆盖 `resetAllRelays` 函数。

### 手动验证

1. **验证命令发送成功:**
   ```bash
   cd packages/core
   pnpm build && node dist/app.js
   ```
   观察日志：
   - ✅ 应该看到: `[control] 继电器重置命令发送成功 { protocol: 'serial' }`
   - ❌ 不应该看到: `TCP client 'control' not initialized` 错误

2. **验证设备响应:**
   确认继电器设备实际执行了"全部断开"命令。

## 其他说明

### 依赖关系

- `HardwareCommunicationManager` 初始化按顺序执行
- `reset.ts` 依赖 `manager` 已完成初始化

### 测试策略

后续可以考虑添加单元测试：
- Mock `HardwareCommunicationManager`
- 验证 `resetAllRelays` 只调用已注册的客户端
