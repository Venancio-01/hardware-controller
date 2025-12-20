# Track Plan: 建立核心测试套件并完善硬件协议校验

## Phase 1: 基础设施与 Mock 准备
- [ ] Task: 配置 Bun 测试环境并建立测试目录结构
- [ ] Task: 实现 UDP 通信模拟器 (UDPSocketMock)
- [ ] Task: 实现 TCP 通信模拟器 (TCPSocketMock)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 基础设施与 Mock 准备' (Protocol in workflow.md)

## Phase 2: 协议校验增强
- [ ] Task: 继电器控制协议校验
    - [ ] Write Tests: 编写继电器协议的 Zod 校验单元测试
    - [ ] Implement Feature: 完善 `src/relay` 中的 Zod schema 和解析逻辑
- [ ] Task: 语音播报协议校验
    - [ ] Write Tests: 编写语音播报协议的 Zod 校验单元测试
    - [ ] Implement Feature: 完善 `src/voice-broadcast` 中的 Zod schema 和解析逻辑
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 协议校验增强' (Protocol in workflow.md)

## Phase 3: 核心逻辑测试与重试机制验证
- [ ] Task: 继电器控制器单元测试
    - [ ] Write Tests: 针对继电器开启、关闭、延时指令编写测试
- [ ] Task: 语音模块控制器单元测试
    - [ ] Write Tests: 针对 TTS 播报、音量控制编写测试
- [ ] Task: 通信客户端重试逻辑验证
    - [ ] Write Tests: 模拟超时并验证 `src/udp` 和 `src/tcp` 中的自动重试
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 核心逻辑测试与重试机制验证' (Protocol in workflow.md)
