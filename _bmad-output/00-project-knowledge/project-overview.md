# 项目概述

## hardware-controller

**描述**: 基于 Bun + TypeScript 的硬件通信服务。

一个健壮的后端服务，通过网络协议（UDP/TCP）控制硬件设备（继电器、语音模块）。它使用 **XState** 进行确定性状态管理，确保对关键事件（如非法访问（振动/钥匙））和业务流程（弹药申请）的可靠操作。

## 快速信息

- **类型**: 后端服务（单体应用）
- **主要语言**: TypeScript
- **核心框架**: XState
- **架构**: 事件驱动状态机
- **通信**: UDP / TCP

## 文档地图

| 文档 | 描述 |
| :--- | :--- |
| [架构](./architecture.md) | 高级设计、组件和数据流 |
| [源码树](./source-tree-analysis.md) | 目录结构和代码组织 |
| [API 合约](./api-contracts-root.md) | 事件定义和硬件协议 |
| [数据模型](./data-models-root.md) | TypeScript 接口和模式 |
| [组件](./component-inventory-root.md) | 硬件控制器和逻辑模块 |
| [开发](./development-guide.md) | 设置、测试和部署指南 |

## 现有参考资料（在 `docs/` 目录中）
- `ETH 设备通信协议说明V42.md`: 继电器控制协议参考。
- `CX-815E 网口语音播报模块集成指南 (V1.0).md`: 语音模块参考。

## 仓库结构
该项目是一个 **单体应用**，所有逻辑都在 `src/` 中，测试在 `test/` 中。