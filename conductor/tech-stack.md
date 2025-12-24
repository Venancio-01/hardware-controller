# Tech Stack - Node Switch

## 核心运行时与语言
- **TypeScript**: 强类型编程语言，确保硬件协议处理的准确性。
- **Node.js (LTS v22)**: 稳定可靠的 JavaScript 运行时，提供广泛的生态支持和长期维护。
- **pnpm**: 高效的包管理器，节省磁盘空间并提升安装速度。
- **Vitest**: 高性能的单元测试框架，兼容 Vite 生态，提供极速的测试执行体验。

## 框架与库
- **Zod**: 用于环境变量和硬件通信协议的模式验证（Schema Validation），确保数据的强一致性。
- **Strategy Pattern**: 采用策略模式解耦复杂的硬件交互逻辑，通过 RelayContext 统一调度。
- **XState**: 用于管理复杂的硬件轮询（PollerMachine）和业务流程（ApplyAmmoMachine）状态机。
- **Pino**: 高性能、低开销的结构化日志库，适用于资源受限或高性能要求的工业环境。
- **iconv-lite**: 用于处理硬件模块可能使用的非 UTF-8 编码（如 GBK）。
- **dotenv**: 用于在 Node.js 环境中加载 `.env` 环境变量文件。

## 通信协议
- **UDP (dgram)**: 用于与柜体端和控制端进行快速的状态查询和指令交互。
- **TCP (net)**: 用于与语音播报模块建立可靠的流式通信。

## 基础设施
- **Systemd**: 用于 Linux 环境下的服务管理，提供开机自启、崩溃重启和日志轮转集成。