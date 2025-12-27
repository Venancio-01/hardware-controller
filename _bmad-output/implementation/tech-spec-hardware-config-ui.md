# Tech-Spec: 硬件配置 UI 界面

**创建时间:** 2025-12-27
**状态:** 实现完成

## 概述

### 问题陈述

当前前端配置页面中缺少以下硬件相关配置项的可视化编辑界面：
- 机柜 TCP 连接配置 (CABINET_HOST/CABINET_PORT)
- 控制端串口配置 (路径、波特率、数据位、停止位、奇偶校验)
- 语音播报配置 (机柜/控制端的音量和语速)

这些配置项虽然已在后端 Schema 中定义，但前端无法通过 UI 进行修改，用户只能通过编辑配置文件或环境变量来调整。

### 解决方案

创建一个新的 `HardwareConfigForm` 组件，遵循现有 `NetworkConfigForm` 的设计模式，在配置页面中新增"硬件配置"卡片区块。

### 范围 (In/Out)

| 包含 | 不包含 |
|------|--------|
| 新建 HardwareConfigForm 组件 | 后端 API 修改（已存在）|
| 机柜 TCP 连接配置界面 | 权限控制系统 |
| 串口参数配置界面 | 实时配置验证（仅格式验证）|
| 语音播报配置界面 | 配置热重载（需重启）|
| 集成到现有 ConfigForm | 高级配置项（如硬件输入索引）|

## 开发上下文

### 代码库模式

1. **表单组件模式**
   - 使用 `react-hook-form` 的 `UseFormReturn<Config>` 作为 props
   - 通过 `form.control` 和 `FormField` 渲染表单字段
   - 使用 `zodResolver` 进行验证

2. **UI 组件**
   - `Card` / `CardHeader` / `CardTitle` / `CardContent` - 布局容器
   - `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormMessage` - 表单结构
   - `Input` / `Select` - 输入控件
   - `getValidationIcon()` - 验证状态图标

3. **Schema 定义**
   - 配置 Schema 在 `packages/shared/src/schemas/config.schema.ts`
   - 类型通过 `export type Config = z.infer<typeof configSchema>` 导出

### 参考文件

| 文件 | 用途 |
|------|------|
| `packages/frontend/src/components/config/NetworkConfigForm.tsx` | 主要参考模板 |
| `packages/frontend/src/components/dashboard/ConfigForm.tsx` | 集成点 |
| `packages/shared/src/schemas/config.schema.ts` | Schema 定义 |

### 技术决策

1. **组件命名**: `HardwareConfigForm` - 与 `NetworkConfigForm` 命名一致
2. **布局结构**: 使用 2 列网格 (`grid-cols-1 md:grid-cols-2`) 布局
3. **输入类型**:
   - IP 地址 / 路径 → `Input type="text"`
   - 端口 / 波特率 → `Input type="number"`
   - 枚举值 (奇偶校验) → `Select`
   - 音量 / 语速 → `Input type="number"` 或滑块

## 实现计划

### 任务

- [x] **任务 1**: 创建 `HardwareConfigForm` 组件基础结构
  - 创建文件 `packages/frontend/src/components/config/HardwareConfigForm.tsx`
  - 定义 `HardwareConfigFormProps` 接口
  - 实现基本的 Card 布局和表单集成

- [x] **任务 2**: 实现机柜 TCP 连接配置区块
  - CABINET_HOST (IP 地址输入)
  - CABINET_PORT (端口输入，1-65535)
  - 添加验证图标

- [x] **任务 3**: 实现串口配置区块
  - CONTROL_SERIAL_PATH (路径输入)
  - CONTROL_SERIAL_BAUDRATE (波特率选择/输入)
  - CONTROL_SERIAL_DATABITS (数据位 5-8)
  - CONTROL_SERIAL_STOPBITS (停止位 1-2)
  - CONTROL_SERIAL_PARITY (奇偶校验下拉选择: none/even/mark/odd/space)

- [x] **任务 4**: 实现语音播报配置区块
  - VOICE_CABINET_VOLUME (0-10)
  - VOICE_CABINET_SPEED (0-10)
  - VOICE_CONTROL_VOLUME (0-10)
  - VOICE_CONTROL_SPEED (0-10)

- [x] **任务 5**: 更新导出和集成
  - 在 `ConfigForm.tsx` 中引入并渲染 `<HardwareConfigForm />`

- [x] **任务 6**: 编写测试
  - 创建 `HardwareConfigForm.test.tsx`
  - 测试表单渲染和验证

### 验收标准

- [x] **AC 1**: Given 用户访问配置页面，When 页面加载完成，Then 应该看到"硬件配置"卡片区块
- [x] **AC 2**: Given 用户输入无效的 IP 地址格式，When 输入失焦，Then 显示验证错误提示
- [x] **AC 3**: Given 用户输入超出范围的端口号，When 输入失焦，Then 显示"端口号必须在 1-65535 范围内"
- [x] **AC 4**: Given 用户修改硬件配置并点击保存，When 请求成功，Then 配置保存并显示"需要重启系统"提示
- [x] **AC 5**: Given 用户选择奇偶校验选项，When 打开下拉菜单，Then 显示 none/even/mark/odd/space 五个选项

## 额外上下文

### 依赖项

- `react-hook-form` - 表单管理
- `@hookform/resolvers` - Zod resolver
- `zod` - Schema 验证
- `lucide-react` - 图标 (可使用 `Cpu`, `HardDrive`, `Volume2` 等)

### 测试策略

1. **组件测试**: 使用 `@testing-library/react` 测试表单渲染
2. **验证测试**: 测试无效输入的验证行为
3. **集成测试**: 确保 ConfigForm 正确集成新组件

### 备注

1. Schema 中的默认值应作为表单初始值
2. 遵循现有代码风格和命名约定
3. 使用中文作为 UI 文本语言
4. 配置保存后需要重启系统才能生效（现有逻辑已支持）
