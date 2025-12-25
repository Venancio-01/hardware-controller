# Story 1.5: 实现基础身份验证 (Basic Auth)

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 系统管理员,
I want 系统有基本的登录保护,
So that 未授权的人员无法修改设备配置。

## Acceptance Criteria

**Given** 未登录用户访问系统
**When** 尝试进入配置页面
**Then** 应被重定向到 `/login`
**And** 后端 API 应验证请求头中的认证信息(如 Basic Auth 或 Token)
**And** 默认账号密码应可配置
**And** 前端登录页面应显示包含用户名和密码输入框的表单
**And** 表单应使用 shadcn/ui 组件并具有基础验证(非空检查)
**And** 点击登录按钮后,若验证通过,应跳转至仪表盘页面
**And** 界面风格应与整体应用保持一致

## Technical Requirements

### 1. Backend Authentication Infrastructure

#### Authentication Strategy
- **Method**: HTTP基础认证(Basic Auth)或简单Token机制
- **Credentials Storage**: 配置文件中存储默认用户名和密码
- **Session Management**: 使用JWT token或简单的session token
- **Token Lifetime**: 可配置的过期时间(默认24小时)

#### Backend Components to Implement

**1.1 Authentication Middleware**
- **File**: `packages/backend/src/middleware/auth.middleware.ts`
- **Purpose**: 验证请求中的认证信息
- **Implementation**:
  ```typescript
  export function authMiddleware(req, res, next) {
    // 1. 从请求头中提取token/credentials
    // 2. 验证token有效性
    // 3. 如果有效,继续请求;否则返回401
  }
  ```
- **Protected Routes**: 应用于所有 `/api/config`(PUT), `/api/system/*` 路由
- **Public Routes**: `/api/status` (GET), `/api/config` (GET), `/api/auth/login` 应保持公开

**1.2 Authentication Routes**
- **File**: `packages/backend/src/routes/auth.routes.ts`
- **Endpoints**:
  - `POST /api/auth/login`
    - Request: `{ username: string, password: string }`
    - Response: `{ success: true, token: string }` 或 `{ success: false, error: string }`
  - `POST /api/auth/logout` (可选)
    - Response: `{ success: true }`
  - `GET /api/auth/verify` (可选)
    - Response: `{ success: true, valid: boolean }`

**1.3 Authentication Configuration**
- **File**: `packages/backend/src/config/auth.config.ts` 或在主配置文件中添加
- **Environment Variables**:
  ```
  AUTH_ENABLED=true
  AUTH_USERNAME=admin
  AUTH_PASSWORD=admin123  # 生产环境应使用强密码
  AUTH_SECRET=your-jwt-secret-key
  AUTH_TOKEN_EXPIRY=24h
  ```
- **Zod Schema**: 在 `packages/shared/src/schemas/` 中添加认证配置验证

### 2. Frontend Authentication Implementation

#### 2.1 Login Page Component
- **File**: `packages/frontend/src/routes/login.tsx`
- **Layout**:
  - 居中的登录卡片,使用 shadcn/ui `Card` 组件
  - 简洁的界面,包含Logo/标题、用户名输入、密码输入、登录按钮
- **Form Validation**:
  - 使用 `react-hook-form` + `Zod` 进行验证
  - 非空检查: 用户名和密码不能为空
  - 适当的错误提示信息
- **shadcn/ui Components**:
  - `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
  - `Input` (type="text" 用于用户名, type="password" 用于密码)
  - `Button` (包含加载状态)
  - `Card`, `CardHeader`, `CardContent`
  - `Alert` (显示登录错误信息)

#### 2.2 Authentication Context/Store
- **File**: `packages/frontend/src/contexts/auth.context.tsx` 或 `packages/frontend/src/lib/auth.ts`
- **State Management**:
  - 存储当前token(localStorage或sessionStorage)
  - 提供`login()`, `logout()`, `isAuthenticated()` 方法
  - 使用 React Context 或简单的全局状态
- **API Integration**:
  - 使用 TanStack Query 的 `useMutation` 处理登录请求
  - 成功后存储token到localStorage
  - 失败时显示错误信息

#### 2.3 Route Protection
- **Implementation**: 在 TanStack Router 中实现路由守卫
- **Protected Routes**: `/` (主配置页面)
- **Public Routes**: `/login`
- **Redirect Logic**:
  - 未认证访问保护路由 → 重定向到 `/login`
  - 已认证访问 `/login` → 重定向到 `/`
- **Route Configuration Example**:
  ```typescript
  // packages/frontend/src/routes/__root.tsx
  // 在根路由中检查认证状态
  beforeLoad: async () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  }
  ```

#### 2.4 API Client Integration
- **File**: `packages/frontend/src/lib/api.ts` (修改现有文件)
- **Request Interceptor**:
  - 自动在所有API请求中附加 `Authorization` header
  - Format: `Authorization: Bearer <token>` 或 `Authorization: Basic <credentials>`
- **Response Interceptor**:
  - 捕获401错误,自动重定向到登录页面
  - 清除过期的token

### 3. UI/UX Design Requirements

#### Login Page Design
- **Theme**: 保持与主应用相同的 shadcn/ui 默认主题
- **Layout**:
  - 居中垂直和水平对齐
  - 卡片宽度: 最大400px
  - 适当的内边距和间距
- **Components**:
  - Logo或应用标题
  - 用户名输入框(label: "用户名")
  - 密码输入框(label: "密码", type="password")
  - 登录按钮(全宽,包含加载状态)
  - 错误提示区域(使用 `Alert` 组件)
- **Interactions**:
  - 按Enter键提交表单
  - 登录中显示加载动画
  - 错误信息显示在表单上方
  - 成功后平滑过渡到主页面

#### Accessibility
- **Keyboard Navigation**: 支持Tab键导航,Enter键提交
- **Screen Reader**: 合适的ARIA标签和语义化HTML
- **Focus Management**: 页面加载时聚焦到用户名输入框
- **Error Announcements**: 错误信息对屏幕阅读器友好

### 4. Security Considerations

- **Password Handling**:
  - 前端:使用`type="password"`防止显示
  - 传输:HTTPS(生产环境推荐,本地LAN可选)
  - 存储:后端不应以明文存储密码(至少使用bcrypt哈希)
- **Token Security**:
  - 使用安全的JWT secret
  - 设置合理的过期时间
  - 避免在URL中传递token
- **CSRF Protection**: 简单场景可选,使用SameSite cookie属性
- **Rate Limiting**: 可选,防止暴力破解(限制登录尝试次数)

### 5. Testing Requirements

- **Backend Tests**:
  - 测试 `/api/auth/login` 端点(正确密码,错误密码)
  - 测试认证中间件(有效token,无效token,缺失token)
  - 测试受保护路由的访问控制
- **Frontend Tests**:
  - 测试登录表单验证(空字段,有效输入)
  - 测试登录流程(成功登录,失败登录)
  - 测试路由保护(未登录访问保护路由)
  - 测试token过期后的重定向

## Tasks / Subtasks

- [ ] 后端认证基础设施 (AC: #2)
  - [ ] 创建 `auth.middleware.ts` 实现认证中间件
  - [ ] 创建 `auth.routes.ts` 实现登录API
  - [ ] 创建 `auth.config.ts` 配置认证参数
  - [ ] 在 `packages/shared` 中添加认证相关的Zod schemas
  - [ ] 更新 `server.ts` 注册认证路由和中间件
  - [ ] 编写后端认证测试

### Review Follow-ups (AI)
- [ ] [AI-Review][HIGH] 安全漏洞 - 密码明文存储在配置中，默认密码过于简单，生产环境中存在安全风险
- [ ] [AI-Review][MEDIUM] 认证机制不一致 - 前后端使用不同的认证方法(Basic Auth vs Bearer Token)，可能导致认证失败
- [ ] [AI-Review][MEDIUM] 认证中间件中有TODO项未完成，需要实现完整的JWT Token支持

- [ ] 前端登录页面 (AC: #4, #5, #7)
  - [ ] 创建 `/login` 路由 (`routes/login.tsx`)
  - [ ] 实现登录表单组件(使用shadcn/ui Form)
  - [ ] 集成 `react-hook-form` + `Zod` 验证
  - [ ] 添加shadcn/ui组件(Form, Input, Button, Card, Alert)
  - [ ] 实现表单提交逻辑(使用TanStack Query mutation)

- [ ] 认证上下文与状态管理 (AC: #6)
  - [ ] 创建认证Context或状态管理
  - [ ] 实现 `login()`, `logout()`, `isAuthenticated()` 方法
  - [ ] 实现token存储(localStorage)
  - [ ] 实现登录成功后的跳转逻辑

- [ ] 路由保护 (AC: #1, #3)
  - [ ] 在TanStack Router中实现路由守卫
  - [ ] 保护主配置页面(`/`)
  - [ ] 实现未认证用户重定向到 `/login`
  - [ ] 实现已认证用户访问 `/login` 重定向到 `/`

- [ ] API客户端集成 (AC: #2)
  - [ ] 修改 `lib/api.ts` 添加请求拦截器
  - [ ] 自动附加 `Authorization` header
  - [ ] 实现401响应拦截和重定向
  - [ ] 处理token过期逻辑

- [ ] 测试与验证 (AC: All)
  - [ ] 编写前端登录表单测试
  - [ ] 编写路由保护测试
  - [ ] 编写API集成测试
  - [ ] 手动测试完整登录流程
  - [ ] 验证UI样式与主应用一致

## Dev Notes

### Architecture Compliance

- **Monorepo Structure**:
  - Backend认证组件位于 `packages/backend/src/`
  - Frontend登录页面位于 `packages/frontend/src/routes/`
  - 共享的认证schemas位于 `packages/shared/src/schemas/`
- **Zod Validation**:
  - 认证请求数据必须通过Zod验证
  - 前后端共享相同的验证schema
- **Type Safety**:
  - 使用TypeScript严格模式
  - 所有认证相关的类型定义应导出并共享
- **Project Context Alignment**:
  - 遵循现有的错误处理模式(Pino日志记录)
  - 遵循现有的目录结构和命名约定
  - 使用vitest进行测试

### Previous Story Intelligence

从 Story 1.4 (Frontend Dashboard) 学到的经验:

1. **Tailwind CSS版本问题**:
   - Story 1.4遇到Tailwind 4.0 beta版本问题
   - 解决方案:降级到 Tailwind 3.x
   - **本故事注意**: 继续使用Tailwind 3.x,避免重复问题

2. **shadcn/ui组件集成**:
   - Story 1.4成功集成shadcn/ui组件(Card, Badge等)
   - **本故事复用**: 使用已安装的shadcn/ui组件系统
   - **新增组件**: 可能需要添加 `Form`, `Alert` 组件

3. **TanStack Router设置**:
   - Story 1.4已设置好文件路由系统(`routes/__root.tsx`, `routes/index.tsx`)
   - **本故事扩展**: 添加新路由 `routes/login.tsx`
   - **路由保护**: 需要在`__root.tsx`或路由配置中添加认证检查

4. **API客户端模式**:
   - Story 1.4使用原生`fetch` + TanStack Query
   - **本故事扩展**: 需要添加请求拦截器逻辑以附加认证信息

5. **性能要求**:
   - Story 1.4目标页面加载时间 < 3秒
   - **本故事注意**: 登录页面应更快,因为组件更少

### Developer Guardrails

**DO:**
- ✅ 使用已建立的shadcn/ui组件系统
- ✅ 遵循现有的API响应格式约定 `{ success, data/error }`
- ✅ 在 `packages/shared` 中定义认证schemas
- ✅ 使用TanStack Query的`useMutation`处理登录请求
- ✅ 使用react-hook-form集成shadcn/ui Form组件
- ✅ 实现适当的错误处理和用户友好的错误消息
- ✅ 编写测试覆盖认证流程

**DON'T:**
- ❌ 不要引入新的UI库或样式系统(使用现有shadcn/ui)
- ❌ 不要使用axios(使用原生fetch,如Story 1.4)
- ❌ 不要实现复杂的RBAC或多用户系统(只需简单的单一认证)
- ❌ 不要在URL或localStorage中以明文存储密码
- ❌ 不要忽略token过期处理
- ❌ 不要让登录页面样式与主应用不一致

### File Structure Requirements

基于架构文档和现有项目结构:

#### Backend Files
```
packages/backend/src/
├── middleware/
│   └── auth.middleware.ts           # 新增: 认证中间件
├── routes/
│   └── auth.routes.ts               # 新增: 认证API路由
├── services/
│   └── auth.service.ts              # 新增: 认证服务逻辑(可选)
├── config/
│   └── auth.config.ts               # 新增: 认证配置(或添加到主配置)
└── server.ts                        # 修改: 注册认证路由和中间件
```

#### Frontend Files
```
packages/frontend/src/
├── routes/
│   ├── __root.tsx                   # 修改: 添加认证检查
│   ├── index.tsx                    # 现有: 主配置页面(需保护)
│   └── login.tsx                    # 新增: 登录页面
├── contexts/
│   └── auth.context.tsx             # 新增: 认证上下文
├── lib/
│   ├── api.ts                       # 修改: 添加认证拦截器
│   └── auth.ts                      # 新增: 认证工具函数
└── components/
    └── ui/                          # 现有: 可能需要添加Alert组件
```

#### Shared Files
```
packages/shared/src/
└── schemas/
    └── auth.schema.ts               # 新增: 认证数据验证schema
```

### Testing Strategy

根据项目context.md的测试规则:

1. **Backend单元测试**:
   - 测试框架: vitest
   - Mock文件系统操作(读取配置文件)
   - 测试认证中间件逻辑
   - 测试登录API端点

2. **Frontend单元测试**:
   - 测试框架: vitest + @testing-library/react
   - Mock API响应
   - 测试登录表单验证
   - 测试路由保护逻辑

3. **集成测试**:
   - 测试完整的登录流程(前端 → 后端 → 响应)
   - 测试路由守卫(未认证访问保护路由)
   - 测试token过期和刷新

### Latest Technical Information

基于当前技术栈(2025-12):

1. **JWT库选择**:
   - 推荐: `jsonwebtoken` (最流行,维护活跃)
   - 或者: 使用内置crypto模块实现简单token机制

2. **密码哈希**:
   - 推荐: `bcrypt` (industry standard)
   - 或者: Node.js内置crypto模块的scrypt

3. **shadcn/ui Form组件**:
   - 最新版本集成了react-hook-form
   - 直接使用shadcn/ui的Form组件系统

4. **TanStack Router认证模式**:
   - 使用`beforeLoad`钩子实现路由守卫
   - 支持异步认证检查

5. **Security Best Practices** (2025):
   - 使用httpOnly cookies存储token(更安全,但本地部署可选)
   - 实现CSRF token(如果使用cookies)
   - 设置合理的token过期时间
   - 实现刷新token机制(可选,post-MVP)

### References

- [Architecture: Authentication & Security](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L406-L432)
- [Architecture: API Design](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L433-L524)
- [Architecture: Frontend Architecture](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L526-L604)
- [Architecture: Monorepo Structure](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L605-L679)
- [Epic 1: Story 1.5](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/02-planning/epics.md#L162-L179)
- [User Stories: Story 1.5](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/04-implementation/user-stories.md#L113-L139)
- [Project Context](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/00-project-knowledge/project-context.md)
- [Previous Story: 1.4 Frontend Dashboard](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/04-implementation/1-4-frontend-dashboard.md)

## Dev Agent Record

### Agent Model Used

_To be filled by Dev Agent during implementation_

### Debug Log References

_To be filled by Dev Agent during implementation_

### Completion Notes List

_To be filled by Dev Agent during implementation_

### File List

_To be filled by Dev Agent during implementation_
