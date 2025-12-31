---
project_name: 'hardware-controller'
user_name: '青山'
date: '2025-12-31'
sections_completed: ['technology_stack', 'language_specific', 'framework_specific', 'testing', 'critical_rules']
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_本文档包含 AI 代理在此项目中实现代码时必须遵循的关键规则和模式。重点关注代理可能忽略的细节。_

---

## 技术栈和版本

### 后端
- **运行时**: Go 1.21+
- **日志**: `log/slog` (标准库，零依赖)
- **配置**: JSON5 格式 (`github.com/titanous/json5`)
- **状态机**: `github.com/looplab/fsm` (成熟 FSM 框架，不要手动实现)
- **串口**: `go.bug.st/serial`
- **架构**: 单一进程 + goroutines，Manager-Worker 模式

### 前端
- **框架**: React 19.0.0
- **路由**: TanStack Router 1.31.15 (文件路由模式)
- **构建工具**: Vite 5.2.0
- **状态管理**: TanStack Query 5.28.9
- **样式**: Tailwind CSS 4.1.17 + Radix UI
- **验证**: Zod 4.2.1
- **运行时**: Node.js >=20.0.0

### 架构原则
- **后端**: Go 单一进程，使用 goroutines 实现并发（替代 XState + IPC）
- **状态管理**: 使用成熟 FSM 框架，避免手动实现状态机
- **配置重载**: 通过 channel 实现 Core Worker 配置热重载（而非重启进程）
- **前端**: 保持不变，HTTP/WebSocket API 兼容
- **部署**: Go 后端编译为单一二进制，嵌入前端资源

---

## 关键实现规则

### Go 语言特定规则

#### 项目布局
- `cmd/` - 主程序入口点
- `internal/` - 私有代码，不可被外部导入（Go 编译器强制）
- `pkg/` - 公共库，可被外部项目使用
- **严格边界**: `internal/` 中的代码绝不能被 `pkg/` 导入

#### Context 使用
- 所有需要取消或超时的函数必须接受 `context.Context` 作为第一个参数
- 使用 `context.WithCancel()` 管理 goroutine 生命周期
- 使用 `context.WithTimeout()` 处理硬件通信超时
- 永远不要忽略 context 的 Done 信号

#### 错误处理
- 使用 `errors.Is()` 和 `errors.As()` 进行错误检查和包装
- 错误消息使用中文（面向最终用户）或英文（面向开发者）
- 使用 `fmt.Errorf()` 包装错误上下文
- 硬件通信错误必须包含操作类型和设备信息

#### 并发模式
- 使用 `errgroup` 管理多个 goroutines 的生命周期
- 使用 `sync.RWMutex` 保护配置读写
- 使用 `channel` 而非共享内存进行 goroutine 通信
- 状态机事件通过 buffered channel (buffer=100) 传递

#### 命名约定
- 文件名: `lowercase.go` 或 `lowercase_test.go`
- 接口名: 动词+`er` (如 `Reader`, `Writer`)
- 常量: `PascalCase` 或 `UPPER_SNAKE_CASE`
- 私有变量: `camelCase` (小写开头)
- 导出变量: `PascalCase` (大写开头)

### 前端 (React/TypeScript) 特定规则

#### 文件路由 (TanStack Router)
- 路由文件放在 `src/routes/` 目录
- 文件名格式: `_auth.index.tsx` (布局.页面.tsx)
- 下划线前缀表示布局路由 (如 `_auth.tsx`)
- 使用 `$` 表示动态参数 (如 `$postId.tsx`)

#### React 19 规范
- 使用函数组件，禁止类组件
- 使用 `use` API 处理异步资源（React 19 新特性）
- Props 接口使用 `PascalCaseProps` 命名
- 事件处理器使用 `on` + 动作名词 (如 `onSubmit`, `onCancel`)

#### 导入顺序
```typescript
// 1. React 核心
import { useState } from 'react';
// 2. 第三方库
import { useQuery } from '@tanstack/react-query';
// 3. 绝对路径别名 (@/)
import { Button } from '@/components/ui/button';
// 4. 相对路径导入
import { MyComponent } from './MyComponent';
```

#### 状态管理
- 服务端状态: TanStack Query (API 数据)
- 表单状态: React Hook Form + Zod 验证
- UI 状态: React useState/useReducer
- 全局状态: React Context (少量使用)

### FSM 状态机框架规则 (looplab/fsm)

#### 状态机定义
```go
// 使用 looplab/fsm 定义状态机
fsm.NewFSM(
    "idle",  // 初始状态
    fsm.Events{
        {Name: "APPLY", Src: []string{"idle"}, Dst: "applying"},
        {Name: "DOOR_OPEN", Src: []string{"applying"}, Dst: "opened"},
    },
    fsm.Callbacks{
        "enter_state": func(ctx context.Context, e *fsm.Event) {
            // 状态进入回调
        },
    },
)
```

#### 关键约束
- 事件名称使用 `SCREAMING_SNAKE_CASE` (与原 Node.js IPC 命名保持一致)
- 回调函数必须接受 `context.Context` 作为第一个参数
- 状态转换失败返回错误，必须被处理
- 使用 `fsm.Current()` 获取当前状态，不要单独维护状态变量

#### 与 Goroutine 协作
- 状态机实例不能并发调用，使用 mutex 保护
- 事件通过 channel 传递到状态机 goroutine
- 回调中避免阻塞操作

### HTTP/WebSocket API 规则

#### 路由组织
```go
// 使用标准库 http.ServeMux
mux.HandleFunc("/api/status", s.handleStatus)
mux.HandleFunc("/api/config", s.handleConfig)
mux.HandleFunc("/ws", s.handleWebSocket)
```

#### 中间件模式
- 认证中间件检查请求头中的 token
- 日志中间件记录所有请求（使用 slog）
- CORS 中间件支持前端开发服务器

#### WebSocket
- 使用 `github.com/gorilla/websocket`
- 心跳间隔: 30秒
- 消息格式: JSON

### 测试规则

#### Go 测试

##### 测试文件组织
- 测试文件与源文件同目录：`worker.go` → `worker_test.go`
- 使用标准 `testing` 包
- 测试函数命名：`TestFunctionName` 或 `TestFunctionName_Scenario`

##### Mock 硬件依赖
```go
// 使用接口定义硬件客户端
type HardwareClient interface {
    Send(ctx context.Context, cmd []byte) ([]byte, error)
}

// 测试时使用 mock
type mockHardwareClient struct {
    sendFunc func(ctx context.Context, cmd []byte) ([]byte, error)
}
```

##### 表驱动测试
```go
tests := []struct {
    name    string
    input   Config
    wantErr bool
}{
    {"valid config", Config{...}, false},
    {"invalid port", Config{Port: -1}, true},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        // 测试逻辑
    })
}
```

#### 前端测试

##### 测试工具
- 框架: Vitest
- 测试库: @testing-library/react
- 文件位置: `__tests__/` 目录或 `.test.tsx` 后缀

##### 测试类型
- 组件测试: 验证 UI 渲染和交互
- Hook 测试: @testing-library/react-hooks
- API 测试: Mock fetch/axios 响应

### 关键不要遗漏的规则

#### 硬件通信
- **超时处理**: 所有硬件操作必须设置 context 超时（默认 5 秒）
- **重试机制**: UDP/TCP 通信失败时最多重试 3 次，使用指数退避
- **连接池**: 不要为每个请求创建新连接，复用 UDP/TCP 连接
- **优雅关闭**: goroutine 退出前必须关闭硬件连接

#### 配置管理
- **JSON5 格式**: 配置文件支持注释和尾随逗号，使用 `github.com/titanous/json5`
- **验证优先**: 配置加载后立即验证，无效时 panic
- **原子写入**: 更新配置时先写入临时文件，再重命名
- **热重载**: 配置变更通过 channel 通知 Core Worker，不要重启进程

#### 并发安全
- **状态机保护**: FSM 实例使用 mutex 保护，禁止并发调用 Event()
- **通道关闭**: 只由发送方关闭 channel，接收方不要关闭
- **Context 传递**: 所有阻塞操作必须接受 context 并检查 Done()

#### 日志规范
- **结构化日志**: 使用 slog，键值对格式
- **级别选择**: Debug(开发), Info(正常), Warn(可恢复), Error(严重)
- **中文消息**: 面向最终用户的错误使用中文
- **无敏感信息**: 日志中不要记录密码、token 等敏感数据

#### 部署
- **单一二进制**: 使用 `go build` 编译，不依赖外部文件（除前端资源）
- **前端嵌入**: 使用 `//go:embed` 将前端资源嵌入二进制
- **跨平台编译**: 支持 `GOARCH=arm` 编译到嵌入式设备

---

## 使用指南

### 给 AI 代理

- 实现代码前务必阅读本文档
- 严格按照文档规则执行
- 有疑问时选择更严格的选项
- 发现新模式时更新本文档

### 给开发者

- 保持文档精简，专注于代理需求
- 技术栈变更时更新
- 每季度审查并移除过时规则
- 移除已变得显而易见的规则

**最后更新**: 2025-12-31
