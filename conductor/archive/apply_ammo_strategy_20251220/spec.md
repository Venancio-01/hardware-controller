# Track Specification: Apply for Ammo Strategy Implementation

## Overview
在 `node-switch` 系统中实现“申请供弹”业务逻辑。该功能通过监控特定继电器的状态组合，触发语音播报模块进行语音反馈。

## Functional Requirements

### 1. 继电器策略扩展
- **状态维护**：在 `RelayContext` 或策略类中引入状态对比机制，记录“上一次状态”以支持边沿触发。
- **信号映射**：
    - **柜体端 1 号位 (Cabinet 1)**: 映射至 `CombinedRelayState` 的 Index 0。
    - **控制端 4 号位 (Control 4)**: 映射至 `CombinedRelayState` 的 Index 11。

### 2. 策略触发逻辑 (ApplyAmmoStrategy)
- **触发条件 1（申请中）**：
    - 条件：当柜子端 1 号位 **闭合** (True)。
    - 动作：调用语音播报 “已申请，请等待授权”。
    - 去重：仅在 Index 0 从 False 变为 True 时触发一次。
- **触发条件 2（授权通过）**：
    - 条件：当柜子端 1 号位 **闭合** (True) 且 控制端 4 号位 **发生变化** (True <-> False)。
    - 动作：调用语音播报 “授权通过，已开锁请打开柜门”。
    - 去重：仅在 Index 11 状态发生跳变且 Index 0 维持 True 时触发。

### 3. 语音播报集成
- 使用 `VoiceBroadcastController.getInstance().broadcast()` 执行播报。
- 播报参数建议：使用默认音量和语速。

## Non-Functional Requirements
- **健壮性**：如果语音模块未连接或发送失败，不应导致主业务循环中断。
- **日志**：记录策略匹配和执行的关键日志。

## Acceptance Criteria
- [ ] 创建 `src/relay-strategies/apply-ammo.ts` 并实现 `RelayStrategy` 接口。
- [ ] 在 `RelayContext` 或 `RelayStrategy` 接口中支持历史状态传递。
- [ ] 在 `BusinessLogicManager` 中注册该新策略。
- [ ] 通过单元测试验证 Index 0 为 True 时触发“已申请”播报。
- [ ] 通过单元测试验证 Index 0 为 True 且 Index 11 变化时触发“授权通过”播报。
- [ ] 确保状态保持不变时不会重复播报。

## Out of Scope
- 其他继电器位逻辑。
- 语音播报模块的硬件配置修改（仅使用现有配置）。
