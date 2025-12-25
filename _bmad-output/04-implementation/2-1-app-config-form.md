# Story 2.1: 实现应用程序配置表单 (App Config Form)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 用户,
I want 在 Web 界面上修改应用程序配置,
So that 我可以调整应用参数而无需编辑文件。

## Acceptance Criteria

**Given** 我在仪表盘页面点击"编辑配置"或直接访问配置表
**When** 我修改表单字段
**Then** 输入内容应通过 Zod schema 进行实时验证
**And** 验证通过时显示绿色指示,失败时显示红色错误信息
**And** 保存按钮在表单无效时应处于禁用状态

## Technical Requirements

### 1. 应用程序配置字段定义

基于架构文档和共享schemas,应用程序配置包含以下字段:

#### 基础配置
- **deviceId** (字符串)
  - 描述: 设备唯一标识符
  - 验证: 非空字符串,长度1-50字符
  - 示例: "NODE-SWITCH-001"

- **timeout** (数字)
  - 描述: 操作超时时间(毫秒)
  - 验证: 正整数,范围: 1000-30000
  - 默认值: 3000
  - 示例: 5000

- **retryCount** (数字)
  - 描述: 失败重试次数
  - 验证: 正整数,范围: 0-10
  - 默认值: 3
  - 示例: 5

- **pollingInterval** (数字)
  - 描述: 状态轮询间隔(毫秒)
  - 验证: 正整数,范围: 1000-60000
  - 默认值: 5000
  - 示例: 10000

### 2. 前端表单实现

#### 2.1 表单组件增强

**现有组件修改**: `packages/frontend/src/components/dashboard/ConfigForm.tsx`

当前状态分析:
- ✅ 已实现基础表单结构 (react-hook-form + Zod)
- ✅ 已集成TanStack Query加载配置
- ✅ 已实现实时验证的基础设施
- ❌ 当前是mock保存 - **需要连接真实API**
- ⚠️ NetworkConfigCard组件可能需要重构为AppConfigCard

**需要实现的功能**:

1. **实时验证反馈**
   - 每个字段旁显示验证状态图标
   - ✓ (绿色checkmark) - 有效值
   - ✗ (红色cross) - 无效值
   - 使用lucide-react图标: `Check`, `X`

2. **错误信息显示**
   - 使用shadcn/ui的`FormMessage`组件
   - 中文错误提示信息
   - 示例:
     - "设备ID不能为空"
     - "超时时间必须在 1000-30000 毫秒之间"
     - "重试次数必须在 0-10 次之间"

3. **字段输入组件**
   - deviceId: `Input` type="text"
   - timeout: `Input` type="number" with min/max/step
   - retryCount: `Input` type="number" with min/max
   - pollingInterval: `Input` type="number" with min/max/step

4. **保存按钮状态**
   - 禁用条件: `!isValid || !isDirty || isSaving`
   - 加载状态: 显示spinner + "保存中..."
   - 正常状态: "保存配置"

#### 2.2 新建AppConfigCard组件

**文件**: `packages/frontend/src/components/dashboard/AppConfigCard.tsx`

```typescript
interface AppConfigCardProps {
  form: UseFormReturn<Config>
}

export function AppConfigCard({ form }: AppConfigCardProps) {
  // 渲染应用配置字段
  // 使用shadcn/ui Card, FormField, Input, Label
  // 实现实时验证反馈的UI
}
```

**布局设计**:
- 使用`Card`组件包裹
- 卡片标题: "应用程序配置"
- 双列网格布局 (1080p屏幕)
- 单列布局 (小屏幕)

### 3. Shared Schema完善

**文件**: `packages/shared/src/schemas/config.schema.ts`

确保config schema包含所有字段的详细验证规则:

```typescript
import { z } from 'zod'

export const configSchema = z.object({
  // 应用程序配置
  deviceId: z.string()
    .min(1, "设备ID不能为空")
    .max(50, "设备ID长度不能超过50字符"),

  timeout: z.number()
    .int("超时时间必须是整数")
    .min(1000, "超时时间不能少于1000毫秒")
    .max(30000, "超时时间不能超过30000毫秒"),

  retryCount: z.number()
    .int("重试次数必须是整数")
    .min(0, "重试次数不能为负数")
    .max(10, "重试次数不能超过10次"),

  pollingInterval: z.number()
    .int("轮询间隔必须是整数")
    .min(1000, "轮询间隔不能少于1000毫秒")
    .max(60000, "轮询间隔不能超过60000毫秒"),
})

export type Config = z.infer<typeof configSchema>
```

### 4. API集成 (暂时使用Mock)

**重要**: Story 2.2将实现真实的后端配置更新API。本故事阶段:
- 前端调用 `PUT /api/config`
- 后端暂时返回mock成功响应
- 不实际写入config.json文件

**API调用示例** (在ConfigForm.tsx中):

```typescript
const handleSubmit = async (values: Config) => {
  setIsSaving(true)

  try {
    const response = await apiFetch('/api/config', {
      method: 'PUT',
      body: JSON.stringify(values),
    })

    if (response.success) {
      toast.success("配置已保存", {
        description: "需要重启系统才能生效",
      })
      form.reset(values) // 更新表单状态
    }
  } catch (error) {
    toast.error("保存失败", {
      description: error.message || "请检查网络连接后重试",
    })
  } finally {
    setIsSaving(false)
  }
}
```

### 5. UI/UX要求

#### 表单布局
- **容器**: 使用Card组件
- **标题**: "应用程序配置"
- **网格**:
  - Desktop (≥1024px): 2列网格
  - Tablet/Mobile (<1024px): 1列堆叠
- **间距**: 使用Tailwind的`space-y-6`整体间距

#### 字段布局
每个字段包含:
1. Label (使用FormLabel)
2. Input输入框 (使用FormControl + Input)
3. 验证状态图标 (Check/X)
4. 错误信息 (FormMessage)
5. 可选的帮助文本 (FormDescription)

#### 视觉反馈
- **有效值**:
  - 绿色checkmark图标
  - Input边框保持默认色
- **无效值**:
  - 红色X图标
  - Input边框变红 (使用aria-invalid)
  - 显示红色错误信息

## Tasks / Subtasks

- [x] 完善Shared Schemas (AC: #2)
  - [x] 更新 `packages/shared/src/schemas/config.schema.ts`
  - [x] 添加详细的中文验证错误消息
  - [x] 确保所有字段都有min/max验证规则
  - [x] 编写schema单元测试

- [x] 创建AppConfigCard组件 (AC: #1, #2)
  - [x] 创建 `packages/frontend/src/components/dashboard/AppConfigCard.tsx`
  - [x] 实现双列网格布局
  - [x] 为每个字段添加FormField
  - [x] 实现实时验证图标 (Check/X)
  - [x] 添加FormDescription提示文本
  - [x] 编写组件单元测试

- [x] 重构ConfigForm组件 (AC: #1, #3)
  - [x] 修改 `packages/frontend/src/components/dashboard/ConfigForm.tsx`
  - [x] 替换mock保存为真实API调用
  - [x] 集成AppConfigCard组件
  - [x] 实现保存成功/失败的Toast通知
  - [x] 确保表单状态管理正确 (isDirty, isValid)

- [x] 表单验证测试 (AC: #2)
  - [x] 测试所有字段的有效值
  - [x] 测试所有字段的无效值
  - [x] 测试边界值 (min, max)
  - [x] 测试错误信息显示
  - [x] 测试保存按钮禁用逻辑

- [x] UI样式调整 (AC: #2)
  - [x] 确保与shadcn/ui主题一致
  - [x] 验证响应式布局
  - [x] 测试验证图标位置
  - [x] 优化表单间距和对齐

### Review Follow-ups (AI)
- [ ] [AI-Review][MEDIUM] ConfigForm组件存在API客户端不一致问题 - 同时使用apiFetch和apiClient，应统一使用一种方案
- [ ] [AI-Review][HIGH] 由于认证机制不一致，ConfigForm中的配置更新可能无法正常工作，需要验证认证拦截器是否正确处理

## Dev Notes

### Architecture Compliance

- **Monorepo Structure**:
  - Schema定义在 `packages/shared`
  - 前端组件在 `packages/frontend/src/components/dashboard`
  - 保持前后端类型定义同步

- **Validation Strategy**:
  - 前端: react-hook-form + Zod实时验证
  - 后端: 同样的Zod schema验证 (Story 2.2实现)
  - 双层验证确保数据一致性

- **State Management**:
  - 使用TanStack Query管理服务器状态
  - 使用react-hook-form管理表单状态
  - 不需要额外的全局状态管理

### Previous Story Intelligence

从Story 1.4的经验:

1. **shadcn/ui组件复用**:
   - 项目已安装并配置好shadcn/ui
   - 可直接使用现有的Form, Input, Button, Card组件
   - 注意: 已降级到Tailwind 3.x

2. **API客户端模式**:
   - 使用 `apiFetch` 工具函数
   - TanStack Query的useMutation处理表单提交
   - 统一的错误处理模式

3. **表单验证模式**:
   - ConfigForm已经建立了react-hook-form基础
   - mode: "onChange" 用于实时验证
   - zodResolver集成Zod validation

从Story 1.5的经验:

1. **认证集成**:
   - 配置修改API需要认证 (如果1.5已完成)
   - apiFetch会自动附加Authorization header
   - 401错误会触发重定向到登录页

2. **shadcn/ui组件**:
   - Form组件系统已完整配置
   - 可直接使用FormField, FormItem, FormLabel等

### Developer Guardrails

**DO:**
- ✅ 复用现有的ConfigForm组件结构
- ✅ 使用已安装的shadcn/ui组件
- ✅ 遵循现有的API调用模式 (apiFetch)
- ✅ 使用Zod schema的中文错误消息
- ✅ 实现完整的错误处理和用户反馈
- ✅ 编写组件和验证的单元测试
- ✅ 确保响应式布局

**DON'T:**
- ❌ 不要在本故事中实现后端配置写入 (那是Story 2.2)
- ❌ 不要引入新的表单库或验证库
- ❌ 不要修改网络配置字段 (那是Epic 3)
- ❌ 不要实现"测试连接"功能 (那是Story 3.2)
- ❌ 不要修改现有的认证逻辑
- ❌ 不要改变shadcn/ui的主题配置

### File Structure

本故事涉及的文件:

#### 新增文件
```
packages/frontend/src/components/dashboard/
└── AppConfigCard.tsx                    # 新增: 应用配置卡片组件

packages/frontend/src/components/dashboard/__tests__/
└── AppConfigCard.test.tsx               # 新增: 组件测试
```

#### 修改文件
```
packages/shared/src/schemas/
└── config.schema.ts                     # 修改: 完善验证规则和错误消息

packages/frontend/src/components/dashboard/
└── ConfigForm.tsx                       # 修改: 集成AppConfigCard,连接API

packages/shared/src/schemas/__tests__/
└── config.schema.test.ts                # 修改/新增: Schema测试
```

### Current Implementation Status

基于Story 1.4的实现:

**已完成的基础设施**:
- ✅ ConfigForm组件基本结构
- ✅ react-hook-form + Zod integration
- ✅ TanStack Query配置加载
- ✅ shadcn/ui Form组件配置
- ✅ 保存按钮状态管理 (isDirty, isValid)
- ✅ Loading skeleton
- ✅ Error handling UI

**需要修改的部分**:
- ⚠️ NetworkConfigCard → 需要创建AppConfigCard
- ⚠️ Mock save → 需要连接PUT /api/config API
- ⚠️ 验证图标未实现 → 需要添加Check/X icons
- ⚠️ FormDescription帮助文本未添加

### Testing Strategy

#### 1. Schema验证测试 (vitest)
```typescript
// packages/shared/src/schemas/__tests__/config.schema.test.ts

describe('configSchema', () => {
  it('应该验证有效的配置', () => {
    const validConfig = {
      deviceId: 'NODE-001',
      timeout: 5000,
      retryCount: 3,
      pollingInterval: 10000
    }
    expect(() => configSchema.parse(validConfig)).not.toThrow()
  })

  it('应该拒绝无效的timeout', () => {
    const invalidConfig = { /* ... */, timeout: 500 }
    expect(() => configSchema.parse(invalidConfig)).toThrow()
  })

  // 测试所有边界值...
})
```

#### 2. 组件测试 (@testing-library/react)
```typescript
// packages/frontend/src/components/dashboard/__tests__/AppConfigCard.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppConfigCard } from '../AppConfigCard'

describe('AppConfigCard', () => {
  it('应该显示所有配置字段', () => {
    render(<AppConfigCard form={mockForm} />)
    expect(screen.getByLabelText('设备ID')).toBeInTheDocument()
    expect(screen.getByLabelText('超时时间')).toBeInTheDocument()
    // ...
  })

  it('应该显示验证错误', async () => {
    render(<AppConfigCard form={mockForm} />)
    const timeoutInput = screen.getByLabelText('超时时间')

    await userEvent.clear(timeoutInput)
    await userEvent.type(timeoutInput, '500')

    await waitFor(() => {
      expect(screen.getByText(/超时时间不能少于1000/)).toBeInTheDocument()
    })
  })
})
```

#### 3. 集成测试
- 测试完整的编辑-保存流程
- 测试API调用和响应处理
- 测试表单状态重置

### Latest Technical Information

基于2025-12技术栈:

1. **react-hook-form最佳实践**:
   - 使用 `mode: "onChange"` 实现实时验证
   - 使用 `formState.isDirty` 追踪修改状态
   - 使用 `reset()` 方法更新保存后的基准值

2. **Zod验证消息**:
   - 所有错误消息使用中文
   - 提供具体的数值范围提示
   - 使用友好的、非技术性的语言

3. **shadcn/ui Form模式**:
   - 使用`FormField` + `FormItem` + `FormControl`结构
   - `FormMessage`自动显示验证错误
   - `FormDescription`提供字段说明

4. **TanStack Query mutation**:
   ```typescript
   const mutation = useMutation({
     mutationFn: (data: Config) => apiFetch('/api/config', {
       method: 'PUT',
       body: JSON.stringify(data)
     }),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['config'] })
       toast.success('配置已保存')
     },
     onError: (error) => {
       toast.error('保存失败', { description: error.message })
     }
   })
   ```

### Performance Considerations

- **实时验证性能**: react-hook-form已优化,不会导致性能问题
- **防抖**: 不需要防抖,Zod验证很快
- **Bundle大小**: 使用已安装的库,不增加额外依赖

### References

- [Epic 2: Story 2.1](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/02-planning/epics.md#L184-L197)
- [Architecture: Frontend Architecture](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L526-L604)
- [Architecture: Data Validation](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/03-solutioning/architecture.md#L380-L405)
- [Project Context](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/00-project-knowledge/project-context.md)
- [Previous Story: 1.4 Frontend Dashboard](file:///home/qingshan/workspace/front-end/node-switch/_bmad-output/04-implementation/1-4-frontend-dashboard.md)
- [Shared Config Schema](file:///home/qingshan/workspace/front-end/node-switch/packages/shared/src/schemas/config.schema.ts)
- [Current ConfigForm Implementation](file:///home/qingshan/workspace/front-end/node-switch/packages/frontend/src/components/dashboard/ConfigForm.tsx)

## Dev Agent Record

### Agent Model Used

_To be filled by Dev Agent during implementation_

### Debug Log References

_To be filled by Dev Agent during implementation_

### Completion Notes List

### Dev Notes

- Implemented `configSchema` with detailed validation and error messages.
- Created `AppConfigCard` component using `shadcn/ui`.
- Refactored `ConfigForm` to use `AppConfigCard` and `apiFetch` with `useMutation`.
- Verified with unit tests for schema and component.

### File List

- packages/shared/src/schemas/config.schema.ts
- packages/shared/src/schemas/__tests__/config.schema.test.ts
- packages/frontend/src/components/dashboard/AppConfigCard.tsx
- packages/frontend/src/components/dashboard/__tests__/AppConfigCard.test.tsx
- packages/frontend/src/components/dashboard/ConfigForm.tsx
