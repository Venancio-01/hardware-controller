# Tech Stack - Node Switch

## 核心运行时与语言
- **TypeScript**: 强类型编程语言，确保硬件协议处理的准确性。
- **Bun**: 高性能 JavaScript 运行时，用于替代 Node.js，内置对 TypeScript 的原生支持。
- **Bun Test**: Bun 内置的测试运行器，用于实现高性能的单元测试和集成测试。

## 框架与库
- **Zod**: 用于环境变量和硬件通信协议的模式验证（Schema Validation），确保数据的强一致性。
- **Strategy Pattern**: 采用策略模式解耦复杂的硬件交互逻辑，通过 RelayContext 统一调度。
- **Pino**: 高性能、低开销的结构化日志库，适用于资源受限或高性能要求的工业环境。
- **iconv-lite**: 用于处理硬件模块可能使用的非 UTF-8 编码（如 GBK）。

## 通信协议
- **UDP (dgram)**: 用于与柜体端和控制端进行快速的状态查询和指令交互。
- **TCP (net)**: 用于与语音播报模块建立可靠的流式通信。

## 基础设施
- **Systemd**: 用于 Linux 环境下的服务管理，提供开机自启、崩溃重启和日志轮转集成。
