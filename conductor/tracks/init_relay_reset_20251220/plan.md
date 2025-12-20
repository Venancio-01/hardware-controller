# 实施计划 - 继电器状态初始化

## 第一阶段：准备工作与环境检查
- [x] 任务：审阅 `BusinessLogicManager.initialize` 逻辑及 `HardwareCommunicationManager.sendCommand` 方法签名，确保调用方式正确。
- [x] 任务：确认 `RelayCommandBuilder.open('all')` 确实生成了 `dooff99` 指令。
- [~] 任务：Conductor - 用户手册验证 '第一阶段：准备工作与环境检查' (参考 workflow.md 协议)

## 第二阶段：核心功能实现 [checkpoint: e54a8d1]
- [x] 任务：在 `BusinessLogicManager` 中增加私有方法 `resetAllRelays()`，负责向 'cabinet' 和 'control' 发送 `dooff99` 指令。 b5c038b
- [x] 任务：在 `resetAllRelays()` 中实现异常处理逻辑：捕获错误并记录日志，但不抛出异常，以确保非阻塞行为。 b5c038b
- [x] 任务：在 `BusinessLogicManager.initialize()` 中调用 `resetAllRelays()`，位置安排在硬件初始化之后、设置数据处理器 (`setupDataHandler`) 之前。 b5c038b
- [x] 任务：添加结构化日志，记录初始化重置动作的开始、成功及失败结果。 b5c038b
- [x] 任务：Conductor - 用户手册验证 '第二阶段：核心功能实现' (参考 workflow.md 协议) e54a8d1

## 第三阶段：测试与验证
- [ ] 任务：编写测试用例（或进行手动验证），确认在启动时程序确实向两个设备发送了 `dooff99`。
- [ ] 任务：模拟网络失败场景，验证当一个设备重置失败时，系统是否仍能正常进入查询循环。
- [ ] 任务：验证在成功和失败两种场景下，日志输出是否符合规范。
- [ ] 任务：运行现有测试套件，确保继电器控制和硬件通信功能没有出现回归问题。
- [ ] 任务：Conductor - 用户手册验证 '第三阶段：测试与验证' (参考 workflow.md 协议)
