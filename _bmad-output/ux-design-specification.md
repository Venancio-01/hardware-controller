---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['_bmad-output/prd.md', '_bmad-output/analysis/brainstorming-session-2025-12-25.md']
workflowType: 'ux-design'
lastStep: 8
project_name: 'node-switch'
user_name: '青山'
date: '2025-12-25'
---

# UX Design Specification node-switch

**Author:** 青山
**Date:** 2025-12-25

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

node-switch Web 配置界面是一个面向普通使用者的设备配置工具，旨在取代直接编辑 config.json 文件的传统方式。产品核心价值在于为技术人员提供一个直观、安全、可靠的配置界面，让用户可以在设备初始化时轻松完成网络和系统参数的配置。

界面需要支持两种主要使用场景：办公室环境下的稳定配置和现场环境下的设备调试。虽然用户理解基本的技术概念（IP 地址、端口、协议等），但需要工具简化配置流程、提供验证反馈、避免因配置错误导致的设备连接问题。

### Target Users

**主要用户群体：**

1. **设备部署人员**
   - 技术背景：对项目有基本了解，理解 IP、端口、协议等技术概念
   - 使用场景：设备初始化配置，大部分只在首次部署时配置一次
   - 痛点：需要直接编辑 config.json 文件，过程繁琐且容易出错
   - 目标：快速、可靠地完成设备配置，确保设备能够正常连接

2. **系统维护人员**
   - 技术背景：熟悉系统配置，需要在现场或远程调整设备参数
   - 使用场景：现场设备调试或远程配置修改
   - 痛点：缺乏友好的配置界面，配置错误后难以诊断
   - 目标：安全地修改配置，能够验证配置是否正确

**使用环境：**
- 办公室电脑（稳定网络环境）
- 现场笔记本（可能网络不稳定，需要调试设备）

**核心用户需求：**
- 不再需要直接编辑 JSON 文件
- 配置过程有清晰的引导和验证
- 可以测试配置是否正确（但不强制）
- 明确了解配置何时生效（需要重启系统）

### Key Design Challenges

**1. 一次性配置的用户体验**
- **挑战：** 用户只在设备初始化时配置一次，可能不熟悉配置流程
- **UX 考量：** 界面需要提供足够的引导和帮助，但不能显得冗余或干扰理解
- **设计策略：** 采用配置向导模式，配合实时验证和清晰的进度指示

**2. 重启生效的认知管理**
- **挑战：** 配置修改后需要重启系统才能生效，可能导致用户困惑
- **UX 考量：** 如何让用户清楚理解"保存 ≠ 立即生效"的关系
- **设计策略：** 清晰的状态提示、保存后的重启提醒、可选的立即重启功能

**3. 配置错误的后果管理**
- **挑战：** 错误的 IP 配置会导致设备无法连接，后果严重
- **UX 考量：** 需要提供充分的验证和警告，但不能过度限制用户操作
- **设计策略：** 渐进式验证（格式检查 → 可选连接测试 → 应用前检查）

**4. 测试连接的可选性设计**
- **挑战：** 提供测试连接功能但不强制要求，如何平衡灵活性和安全性？
- **UX 考量：** 用户需要理解这是推荐步骤而非必需障碍
- **设计策略：** 将测试连接设计为"推荐验证步骤"，提供清晰的引导但不阻止继续

### Design Opportunities

**1. 配置向导式体验**
- **机会：** 一次性配置的特点允许我们使用分步向导模式
- **优势：** 可以将复杂的配置过程分解为简单步骤，每步提供聚焦的引导和验证
- **创新点：** 结合配置预览和差异对比，让用户清楚看到将要应用的更改

**2. 实时验证与反馈**
- **机会：** 用户理解技术概念，可以提供智能的实时验证
- **优势：** 格式验证、逻辑检查、依赖关系验证都可以在配置过程中实时完成
- **创新点：** 渐进式验证策略——即时格式检查 → 推荐连接测试 → 应用前最终检查

**3. 清晰的状态流转设计**
- **机会：** 重启生效的特点需要设计明确的状态流转
- **优势：** 可以创建清晰的"配置 → 保存 → 重启 → 生效"状态可视化
- **创新点：** 智能重启提示系统，根据配置变化程度提供不同的重启建议

**4. 仪表板式配置界面**
- **机会：** 借鉴 SCADA 系统监控面板的设计理念
- **优势：** 可以集成配置管理、状态监控、连接测试于一体
- **创新点：** 配置页面同时显示设备状态信息，帮助用户在配置时了解设备上下文

---

## Core User Experience

### Defining Experience

node-switch 配置界面的核心体验是**"状态可见的配置向导"**。用户在配置设备参数时，始终能够看到设备的实时连接状态和相关信息，这种设计让用户在配置过程中保持对设备上下文的感知。

核心体验流程：**查看设备状态 → 修改配置 → 实时验证 → 保存配置 → 重启生效**

这个体验的核心价值在于将原本枯燥的配置文件编辑转变为直观、安全的交互过程，让用户在每一步都能获得清晰的反馈和安心感。

### Platform Strategy

**目标平台：** Web 应用（PC 端）

**浏览器支持：**
- 主要：Chrome 浏览器
- 基准分辨率：1920x1080（1080p）
- 建议最低分辨率：1366x768（笔记本常见分辨率）

**交互方式：**
- 主要输入：鼠标点击 + 键盘输入
- 表单交互：Tab 键导航、Enter 键提交
- 支持 125%-150% 显示缩放

**响应式策略：**
- 主要优化：桌面全屏体验
- 次要优化：笔记本小窗口操作
- 不考虑移动端（手机/平板）

**技术栈要求：**
- 表单组件库：shadcn/ui 风格
- 实时验证：表单字段级验证
- 状态更新：硬件状态轮询或 WebSocket 推送

### Effortless Interactions

**1. 实时表单验证**
- 用户输入 IP 地址时，立即显示格式验证（绿色✓ 或红色✗）
- 不需要点击"验证"按钮，验证在输入时自动完成
- 错误信息显示在对应字段下方，清晰明确

**2. 智能表单体验**
- 表单字段自动聚焦到第一个可编辑项
- Tab 键流畅地在字段间导航
- 保存按钮在表单有错误时自动禁用
- 保存按钮显示加载状态（保存中）

**3. 状态可见性**
- 仪表盘实时显示设备连接状态（在线/离线）
- 连接信息清晰展示（IP、端口、协议等）
- 状态变化时平滑过渡动画（不突兀但明显）

**4. 配置差异感知**
- 表单显示当前配置值作为默认值
- 修改过的字段有视觉标记（比如字段颜色变化或小圆点）
- 清晰的"已保存" vs "未保存"状态指示

**5. 重启生效的明确反馈**
- 保存成功后显示 Toast 通知："配置已保存，需要重启系统才能生效"
- 提供"立即重启"按钮（可选）
- 顶部显示持久提示条，直到重启完成

### Critical Success Moments

**1. 首次访问时刻（第一印象）**
- **用户看到：** shadcn/ui 风格的精美界面 + 实时设备状态
- **用户感受：** "这个工具很专业，比编辑 JSON 文件靠谱多了"
- **设计要点：** 加载速度快（<3秒）、界面整洁美观、设备状态立即可见

**2. 配置输入时刻（流畅体验）**
- **用户操作：** 在表单中输入配置值
- **系统反馈：** 实时验证显示，错误立即指出，正确的字段显示绿色标记
- **用户感受：** "系统在帮我检查，我不会犯错"
- **设计要点：** shadcn/ui 表单验证体验、流畅的输入反馈、清晰的错误信息

**3. 保存成功时刻（安心确认）**
- **用户操作：** 点击"保存配置"按钮
- **系统反馈：** 按钮显示加载动画 → 成功 Toast 通知 → 顶部提示需要重启
- **用户感受：** "配置成功了，我知道下一步该做什么"
- **设计要点：** 明确的保存状态、不可错过的重启提醒、操作可逆性提示（如有备份）

**4. 测试连接时刻（可选验证）**
- **用户操作：** 点击"测试连接"按钮（可选操作）
- **系统反馈：** 显示连接测试进度 → 连接成功/失败结果
- **用户感受：** "我可以验证配置是否正确，这很安心"
- **设计要点：** 测试过程有进度反馈、结果清晰明确、不阻止继续操作

**5. 错误预防时刻（友好警告）**
- **场景：** 用户即将输入危险的配置（比如明显错误的 IP 地址）
- **系统反馈：** 实时验证捕获错误，字段下方显示红色错误信息
- **用户感受：** "幸好系统提醒我了，避免了一个问题"
- **设计要点：** 错误信息具体可操作、不使用技术术语、不阻止用户但强烈建议修正

### Experience Principles

基于以上分析，node-switch 配置界面的体验设计遵循以下原则：

**1. 状态可见性原则**
- 用户在配置时始终能够看到设备的连接状态和信息
- 仪表盘作为固定侧边栏，提供实时的设备上下文
- 配置修改前后，用户都能清楚地知道设备的状态

**2. shadcn/ui 美学原则**
- 采用干净、现代的表单设计语言
- 清晰的视觉层次，优秀的使用默认值
- 流畅的动画和过渡，提升使用愉悦感
- 明显的状态反馈（加载、成功、错误）

**3. 渐进式验证原则**
- 即时格式验证：用户输入时立即检查格式正确性
- 推荐连接测试：提供测试连接功能但不强制
- 应用前检查：保存前做最终的完整性检查
- 错误信息具体可操作，告诉用户如何修正

**4. 明确反馈原则**
- 每个操作都有清晰的视觉反馈（保存、验证、测试）
- 重启生效的要求不能被忽略（顶部提示条 + Toast 通知）
- 状态变化有明显的视觉指示（已保存 vs 未保存）
- 成功时刻给用户足够的确认感

**5. 一次成功原则**
- 针对"一次性配置"的特点，设计要确保首次配置成功率
- 提供足够的引导和帮助信息（但不显得冗余）
- 预防错误优于修复错误（实时验证 + 友好警告）
- 让用户在配置完成时有"任务完成，设备准备就绪"的成就感

---

## Desired Emotional Response

### Primary Emotional Goals

**核心情感目标：安心感**

node-switch 配置界面的首要情感目标是让用户在使用过程中感到安心。这种安心感来源于系统提供的实时验证、明确反馈和友好提示，让用户相信配置过程是安全可控的，不会因为操作失误导致设备失联或系统故障。

**支撑情感目标：**

1. **掌控感**：用户始终能够看到设备状态和配置进度，知道自己在做什么，下一步会发生什么
2. **效率感**：比直接编辑 JSON 文件更快速、更简单，一次配置成功，减少反复试错
3. **专业感**：shadcn/ui 的精美界面设计让用户感受到工具的专业性和可靠性

### Emotional Journey Mapping

**阶段 1：首次打开配置页面**
- **期望情感：** 信心（"这个界面很清晰，我知道该怎么做"）
- **设计实现：**
  - shadcn/ui 精美界面建立专业感
  - 仪表盘显示设备当前状态
  - 表单结构清晰，字段分组合理

**阶段 2：配置输入过程**
- **期望情感：** 安心（"系统在实时验证，我不会犯错"）
- **设计实现：**
  - 即时格式验证（输入时立即显示✓或✗）
  - 清晰的错误提示（告诉用户如何修正）
  - 绿色✓标记提供视觉确认

**阶段 3：保存配置**
- **期望情感：** 确信（"配置已保存，我放心了"）
- **设计实现：**
  - 保存按钮显示加载状态（知道系统在工作）
  - Toast 通知确认保存成功
  - 顶部提示条提醒需要重启

**阶段 4：出错时**
- **期望情感：** 不焦虑（"系统提醒我了，我知道如何修正"）
- **设计实现：**
  - 友好的错误信息（不指责用户）
  - 具体的修正建议（可操作的指引）
  - 实时验证显示修正后的状态

**阶段 5：配置完成**
- **期望情感：** 成就感（"任务完成，设备准备就绪"）
- **设计实现：**
  - 整体成功反馈确认任务完成
  - 仪表盘显示设备正常运行状态
  - 可选的测试连接功能提供额外确认

### Micro-Emotions

**关键微情感对比：**

1. **✅ 自信 vs. ❌ 困惑**
   - 用户清楚知道如何填写每个字段，不需要猜测
   - 设计支持：清晰的标签、合理的默认值、必要的帮助提示

2. **✅ 信任 vs. ❌ 怀疑**
   - 用户相信配置已正确保存到系统
   - 设计支持：明确的保存反馈、重启提醒、设备状态确认

3. **✅ 平静 vs. ❌ 焦虑**
   - 配置过程流畅，没有突发错误或意外情况
   - 设计支持：实时验证、渐进式检查、友好的错误处理

4. **✅ 满足 vs. ❌ 沮丧**
   - 一次配置成功，不需要反复试错
   - 设计支持：预防性验证、即时反馈、清晰的指引

5. **✅ 掌控 vs. ❌ 无助**
   - 用户始终知道配置状态和下一步操作
   - 设计支持：状态可见性仪表盘、进度提示、清晰的操作流程

### Design Implications

**情感与 UX 设计的连接：**

**1. 安心感 → 实时验证与友好提示**
- 即时格式验证：用户输入时立即检查，不等提交才发现错误
- 测试连接功能：提供可选的额外确认，增加用户信心
- 友好的错误信息：使用平和的语气，不指责用户，只提供指导
- 明确的保存反馈：Toast 通知 + 重启提醒，确认配置已生效

**2. 掌控感 → 状态可见性设计**
- 仪表盘作为固定侧边栏：实时显示设备连接状态和信息
- 配置差异可视化：显示当前值 vs 新值，清楚看到变化
- 状态指示器：清晰的"已保存" vs "未保存"状态
- 重启提示：不可忽略的顶部提示条，明确告知下一步

**3. 效率感 → 智能表单体验**
- shadcn/ui 智能表单：Tab 键导航、自动聚焦、流畅输入
- 保存按钮智能状态：表单有错误时禁用、保存时显示加载
- 预防性设计：实时验证减少错误修复时间

**4. 专业感 → shadcn/ui 美学设计**
- 精美的界面设计：干净现代的视觉风格
- 流畅的动画过渡：提升使用愉悦感
- 专业的状态展示：设备信息清晰呈现

**5. 信任感 → 明确反馈机制**
- 每个操作都有视觉反馈：保存、验证、测试都有明确指示
- 不可忽略的成功确认：顶部提示条确保用户看到重启要求
- 错误时的具体指导：告诉用户问题在哪里、如何修正

### Emotional Design Principles

**原则 1：安心优先**
- 所有设计决策首先考虑"是否让用户感到安心"
- 实时验证优于事后检查
- 友好提示优于错误指责
- 让用户感觉"系统在帮我"

**原则 2：状态可见**
- 用户始终知道设备状态和配置状态
- 仪表盘作为固定参考，提供实时上下文
- 配置前后状态变化清晰可见
- 不让用户猜测"现在是什么情况"

**原则 3：预防为主**
- 预防错误优于修复错误
- 实时验证减少配置错误
- 友好的警告而非阻止式限制
- 在错误发生前就提醒用户

**原则 4：明确反馈**
- 每个操作都有清晰的反馈
- 保存/重启状态不可忽略
- 成功时刻给足确认感
- 不让用户怀疑"是否成功"

**原则 5：专业可靠**
- shadcn/ui 的美学品质
- 流畅的交互体验
- 让用户感觉工具可靠可信
- 建立"这个工具很专业"的第一印象

**原则 6：友好对待错误**
- 错误信息不指责用户
- 提供具体的修正建议
- 让错误成为学习机会而非挫败源
- 保持"我们共同解决问题"的语气

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**核心灵感来源：shadcn/ui 设计体系**

node-switch 配置界面的 UX 设计完全采用 shadcn/ui 设计模式。shadcn/ui 是基于 Radix UI 无障碍组件和 Tailwind CSS 实用优先样式构建的现代组件库，其设计哲学强调可访问性、组合性和开发者控制力。

**为什么选择 shadcn/ui：**

1. **优秀的表单验证体验**：shadcn/ui Form + Zod 提供业界领先的实时验证体验
2. **清晰的状态反馈**：加载状态、错误提示、成功通知都有完善的模式
3. **专业的视觉设计**：干净现代的美学风格，符合"专业感"的情感目标
4. **无障碍性优先**：所有组件遵循 ARIA 标准，确保可访问性
5. **已被广泛验证**：被大量技术产品采用（如 Vercel），模式成熟可靠

**shadcn/ui 的核心 UX 模式：**

**1. 表单验证模式**
- 即时验证：用户输入时（onChange）或离开字段时（onBlur）验证
- 错误信息：显示在字段下方，红色文字 + 图标
- 成功指示：可选的绿色✓图标
- 提交按钮：表单无效时自动禁用

**2. 加载状态模式**
- 按钮状态流转：正常 → hover → 点击 → 加载中（spinner）→ 完成
- 禁用状态：加载期间禁用按钮防止重复提交
- 清晰反馈：按钮文字变为"保存中..."等提示

**3. Toast 通知系统**
- 位置：屏幕右下角
- 类型：Success（绿色）、Error（红色）、Warning（黄色）、Info（蓝色）
- 自动消失：3-5 秒后淡出
- 可手动关闭：用户可以点击关闭按钮

**4. Card 布局模式**
- 层次结构：Card → CardHeader → CardContent → CardFooter
- 视觉特点：细边框、圆角、hover 时轻微阴影
- 内边距：统一的 padding-6

**5. 状态指示器（Badge）**
- Success：绿色背景 + 白色文字
- Error：红色背景 + 白色文字
- Warning：黄色背景 + 深色文字
- 用途：简洁的状态显示，视觉识别度高

**6. Alert 重要提示**
- Destructive：错误警告、破坏性操作提醒
- Default：一般信息提示
- 可关闭：包含关闭按钮
- 用途：不可忽略的重要通知

### Transferable UX Patterns

**完全采用的 shadcn/ui 模式：**

**1. Form + Zod 实时验证**
- **应用场景**：所有配置表单字段
- **实现方式**：使用 shadcn/ui Form 组件 + Zod schema 验证
- **用户体验**：用户输入 IP 地址时，立即显示格式验证结果（✓或✗）
- **优势**：即时反馈，预防错误，符合"安心优先"原则

**2. Toast 操作反馈**
- **应用场景**：保存成功/失败、测试连接结果
- **实现方式**：使用 shadcn/ui Toast（Sonner）
- **用户体验**：保存成功后右下角弹出"配置已保存"，3 秒后自动消失
- **优势**：不打断用户流程，清晰的操作确认

**3. Card 视觉容器**
- **应用场景**：仪表盘区域、配置表单区域
- **实现方式**：使用 shadcn/ui Card 组件包裹各区域
- **用户体验**：清晰的视觉层次，内容分区明确
- **优势**：专业的视觉设计，符合 shadcn/ui 美学原则

**4. Badge 状态显示**
- **应用场景**：设备在线/离线、配置已保存/未保存
- **实现方式**：使用 shadcn/ui Badge 组件
- **用户体验**：绿色 Badge "在线" 立即识别设备状态
- **优势**：简洁的状态显示，视觉识别度高

**5. Button 加载状态**
- **应用场景**：保存配置、测试连接按钮
- **实现方式**：使用 shadcn/ui Button + loading state
- **用户体验**：点击保存后，按钮显示 spinner，文字变为"保存中..."
- **优势**：明确的操作反馈，防止重复提交

**6. Alert 关键提醒**
- **应用场景**：配置保存后的重启提醒
- **实现方式**：使用 shadcn/ui Alert 组件
- **用户体验**：顶部显示不可忽略的 Alert："配置已保存，需要重启系统才能生效"
- **优势**：确保用户看到重要信息，符合"明确反馈"原则

**需要适配的 shadcn/ui 模式：**

**1. Sidebar → 固定仪表盘**
- **shadcn/ui 原型**：Sidebar 导航组件（通常 250px 宽）
- **适配方式**：改为左侧固定状态显示区，占 1/3 宽度
- **内容**：设备状态卡片 + 连接信息，而非导航菜单
- **原因**：我们的需求是状态可见性，而非导航

**2. 表单布局 → 双列网格**
- **shadcn/ui 原型**：标准单列表单布局
- **适配方式**：使用 Grid 布局，双列显示配置字段
- **原因**：1080p 屏幕可以容纳更多字段，提高配置效率
- **分组**：网络配置、设备配置、高级设置

### Anti-Patterns to Avoid

**基于 shadcn/ui 最佳实践，避免以下反模式：**

**1. 过度使用 Dialog/Modal**
- **反模式**：频繁使用弹窗打断用户流程
- **避免原因**：配置工具需要连贯的配置流程，弹窗会打断思路
- **替代方案**：使用 Alert（顶部提醒）或 Toast（右下角通知）

**2. 复杂的多步骤向导**
- **反模式**：将简单配置变成复杂的多步骤向导
- **避免原因**：一次性配置不需要过度复杂的向导流程
- **替代方案**：单页面表单，清晰的分组和标题即可

**3. 过度动画**
- **反模式**：使用大量动画效果
- **避免原因**：配置工具需要高效性，过多动画降低效率
- **保留动画**：只保留必要的过渡动画（加载状态、hover 效果）

**4. 隐藏的菜单**
- **反模式**：将常用功能隐藏在折叠菜单中
- **避免原因**：一次性配置工具需要清晰可见的操作选项
- **替代方案**：主要操作（保存、测试连接）始终可见

**5. 技术性错误信息**
- **反模式**：显示技术性错误消息（如 "Error 500: Internal Server Error"）
- **避免原因**：违背"友好对待错误"原则
- **替代方案**：友好的错误信息，如"无法保存配置，请检查网络连接"

### Design Inspiration Strategy

**采用策略（直接使用 shadcn/ui 模式）：**

1. **shadcn/ui Form + Zod** → 核心表单验证系统
   - 支持：实时验证、友好错误提示、成功确认
   - 符合：安心优先、预防为主原则

2. **Toast 通知** → 操作反馈系统
   - 支持：保存成功/失败、测试连接结果通知
   - 符合：明确反馈、不打断流程原则

3. **Card 布局** → 主要视觉容器
   - 支持：仪表盘和表单区域的清晰分组
   - 符合：专业可靠美学原则

4. **Badge 状态** → 设备状态显示
   - 支持：在线/离线、已保存/未保存状态
   - 符合：状态可见、掌控感原则

5. **Button 加载状态** → 操作反馈
   - 支持：保存、测试连接按钮的状态管理
   - 符合：明确反馈、防止重复提交

6. **Alert 提示** → 关键通知
   - 支持：重启提醒等不可忽略的通知
   - 符合：明确反馈、确保用户看到

**适配策略（修改 shadcn/ui 模式）：**

1. **Sidebar → 固定仪表盘**
   - 修改：从导航侧边栏改为状态显示区
   - 宽度：占左侧 1/3（而非标准 250px）
   - 内容：设备状态卡片 + 连接信息

2. **表单布局 → 双列网格**
   - 修改：从单列改为双列 Grid 布局
   - 原因：适配 1080p 屏幕，提高配置效率
   - 分组：网络配置、设备配置、高级设置

3. **颜色主题保持默认**
   - 保持：shadcn/ui 默认黑白灰主题 + 主色调
   - 原因：符合专业感，用户熟悉度高

**避免策略（明确不使用）：**

1. **避免过度 Modal**
   - 原则：保持配置流程的连贯性
   - 替代：Alert 或 Toast 提示

2. **避免复杂向导**
   - 原则：一次性配置不需要过度复杂
   - 替代：单页面表单，清晰分组

3. **避免多余动画**
   - 原则：保持工具的高效性
   - 保留：必要的过渡动画（加载状态、hover）

**设计灵感总结：**

通过完全采用 shadcn/ui 设计模式，node-switch 配置界面将获得：
- ✅ 业界验证的表单验证体验
- ✅ 清晰的状态反馈机制
- ✅ 专业的视觉设计
- ✅ 优秀的可访问性
- ✅ 熟悉的用户体验（shadcn/ui 用户）

这种策略确保了界面既符合用户期望（shadcn/ui 风格），又提供了优秀的用户体验（实时验证、明确反馈、专业可靠）。

---

## Design System Foundation

### 1.1 Design System Choice

**设计系统选择：shadcn/ui + Tailwind CSS**

node-switch 配置界面采用 shadcn/ui 作为核心设计系统，结合 Tailwind CSS 实用优先的样式框架。这个选择确保了界面的专业性、一致性和开发效率。

**技术栈组成：**
- **shadcn/ui**：基于 Radix UI 的可复制组件库
- **Tailwind CSS**：实用优先的 CSS 框架
- **Zod**：Schema 验证库，与 shadcn/ui Form 集成
- **Radix UI**：无障碍组件基础层
- **TypeScript**：类型安全的组件使用

### Rationale for Selection

**1. 完美匹配现有技术栈**
- 项目已使用 Zod v4.2.1，与 shadcn/ui Form 集成无需额外工作
- 项目使用 TypeScript 5.9.3，shadcn/ui 原生支持 TypeScript
- Node.js >=22.0.0 环境完全兼容 shadcn/ui 构建流程
- 无需引入额外的重量级依赖

**2. 符合所有 UX 设计要求**
- ✅ **实时表单验证**：shadcn/ui Form + Zod 提供业界最佳实践
- ✅ **清晰的状态反馈**：Toast、Alert、Badge 组件完善
- ✅ **shadcn/ui 美学风格**：用户明确要求的设计风格
- ✅ **优秀的可访问性**：基于 Radix UI，遵循 ARIA 标准
- ✅ **专业的视觉设计**：干净现代的默认主题

**3. 开发效率和灵活性**
- **快速开发**：组件可以直接复制到项目中，无需复杂的配置
- **完全控制**：组件代码在项目中，可以自由修改和定制
- **无学习负担**：如果熟悉 Tailwind CSS，shadcn/ui 非常容易上手
- **按需引入**：只复制需要的组件，保持代码库精简

**4. 长期维护友好**
- **不依赖外部更新**：组件代码在项目中，不随外部版本变化
- **渐进式定制**：可以根据需求逐步修改组件
- **社区支持**：shadcn/ui 社区活跃，文档完善，示例丰富
- **性能优秀**：Tree-shakeable，只打包使用的代码

**5. 团队学习曲线低**
- **可见的代码**：组件实现代码完全可见，便于理解和学习
- **熟悉的模式**：基于 React Hooks，符合现代 React 开发习惯
- **丰富的示例**：shadcn/ui 官网提供大量组件示例和最佳实践
- **TypeScript 支持**：完整的类型定义，开发体验优秀

### Implementation Approach

**1. 项目初始化**

```bash
# 使用 shadcn/ui CLI 初始化
npx shadcn@latest init

# 初始化配置选项：
# - TypeScript: Yes
# - Framework: React (Vite)
# - Tailwind CSS: Yes
# - Component src: @/components
# - Utils src: @/lib/utils
```

**2. 核心组件安装**

```bash
# 表单相关组件
npx shadcn@latest add form input label button

# 布局组件
npx shadcn@latest add card separator

# 反馈组件
npx shadcn@latest add toast alert badge

# 其他可能需要的组件
npx shadcn@latest add switch checkbox select
```

**3. Zod 验证 Schema 集成**

```typescript
// src/lib/validation.ts
import { z } from "zod"

export const networkConfigSchema = z.object({
  ipAddress: z.string()
    .ip({ version: 'v4', message: 'IP 地址格式无效' }),
  subnetMask: z.string()
    .regex(/^255\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, '子网掩码格式无效'),
  gateway: z.string()
    .ip({ version: 'v4', message: '网关地址格式无效' }),
  port: z.number()
    .min(1, '端口号必须大于 0')
    .max(65535, '端口号必须小于 65536'),
})

export const deviceConfigSchema = z.object({
  deviceId: z.string().min(1, '设备 ID 不能为空'),
  relayIndex: z.number()
    .min(0, '继电器索引必须大于等于 0')
    .max(255, '继电器索引必须小于 256'),
})

export const configSchema = networkConfigSchema.merge(deviceConfigSchema)
```

**4. 表单组件使用模式**

```tsx
// src/components/ConfigForm.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { configSchema } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function ConfigForm() {
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      ipAddress: "192.168.1.100",
      subnetMask: "255.255.255.0",
      gateway: "192.168.1.1",
      port: 8080,
      deviceId: "",
      relayIndex: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof configSchema>) {
    // 保存配置到 config.json
    // 显示 Toast 成功通知
    // 显示 Alert 重启提醒
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 表单字段 */}
      </form>
    </Form>
  )
}
```

**5. 布局实现**

```tsx
// src/app/config/page.tsx
export default function ConfigPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：设备状态仪表盘 */}
          <div className="lg:col-span-1">
            <DeviceStatusDashboard />
          </div>

          {/* 右侧：配置表单 */}
          <div className="lg:col-span-2">
            <ConfigForm />
          </div>
        </div>
      </div>
    </div>
  )
}
```

**6. Toast 通知集成**

```tsx
// src/components/ui/toast.tsx
import { toast } from "sonner"

// 使用示例
toast.success("配置已保存", {
  description: "需要重启系统才能生效",
})

toast.error("保存失败", {
  description: "请检查网络连接后重试",
})
```

**7. Alert 提醒组件**

```tsx
// 顶部 Alert：重启提醒
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert variant="default" className="mb-6">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>需要重启系统</AlertTitle>
  <AlertDescription>
    配置已保存，但需要重启系统才能生效。点击下方按钮立即重启，或稍后手动重启。
  </AlertDescription>
</Alert>
```

### Customization Strategy

**1. 颜色主题定制**

```css
/* src/app/globals.css */
@layer base {
  :root {
    /* 保持 shadcn/ui 默认主题 */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;

    /* 可选：添加品牌色 */
    --brand: 210 100% 50%;
  }
}
```

**2. 组件样式调整**

```tsx
// 示例：调整 Card 的内边距
import { Card } from "@/components/ui/card"

<Card className="p-8">
  {/* Card 内容 */}
</Card>

// 示例：调整按钮大小
<Button size="lg" className="h-12 px-8">
  保存配置
</Button>
```

**3. 布局定制**

```tsx
// 响应式布局：sm 单列，lg 双列
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* 网络配置组 */}
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle>网络配置</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 网络配置字段 */}
    </CardContent>
  </Card>

  {/* 设备配置组 */}
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle>设备配置</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 设备配置字段 */}
    </CardContent>
  </Card>
</div>
```

**4. 动画定制**

```tsx
// 使用 Tailwind 的 transition utilities
<Button className="transition-all duration-200 hover:scale-105">
  保存配置
</Button>

// 必要时使用 Framer Motion（高级动画）
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* 动画内容 */}
</motion.div>
```

**5. 自定义组件开发**

对于 shadcn/ui 没有提供的组件：

```tsx
// 示例：自定义设备状态指示器组件
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function DeviceStatusIndicator({
  status,
  lastUpdate
}: {
  status: 'online' | 'offline'
  lastUpdate: Date
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">设备状态</p>
          <p className="text-xs text-muted-foreground">
            最后更新：{lastUpdate.toLocaleString()}
          </p>
        </div>
        <Badge variant={status === 'online' ? 'default' : 'destructive'}>
          {status === 'online' ? '在线' : '离线'}
        </Badge>
      </div>
    </Card>
  )
}
```

**6. 暗色模式支持（可选）**

```tsx
// 使用 next-themes 支持主题切换
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  )
}
```

### 设计系统总结

通过选择 **shadcn/ui + Tailwind CSS**，node-switch 配置界面将获得：

✅ **专业的视觉设计**：shadcn/ui 的默认美学风格
✅ **优秀的表单体验**：Form + Zod 实时验证
✅ **完善的状态反馈**：Toast、Alert、Badge 组件
✅ **灵活的定制能力**：组件代码完全可控
✅ **快速的开发效率**：复制粘贴即可使用
✅ **长期的维护友好**：不依赖外部更新，可渐进式定制

这种设计系统选择确保了界面既符合用户的技术栈和技能水平，又能快速实现高质量的 UX 设计。

---

## 2. Core User Experience

### 2.1 Defining Experience

**核心体验：实时验证的安心配置**

node-switch 配置界面的定义体验是：**"用户在看到设备状态的同时，通过实时验证的表单轻松完成配置，获得'配置正确，设备准备就绪'的安心感。"**

这个核心体验可以类比其他成功产品的核心交互：
- **Tinder**："滑动匹配" → **node-switch**："实时验证配置"
- **Instagram**："分享完美瞬间" → **node-switch**："安心完成配置"
- **Spotify**："即时播放任何歌曲" → **node-switch**："状态可见的配置"

如果这个核心体验做得好，用户会这样描述：
- "这个工具让我配置设备时非常安心，因为系统一直在帮我检查"
- "我可以看到设备状态，知道自己在配置什么"
- "比编辑 JSON 文件简单太多了，而且不会犯错"

### 2.2 User Mental Model

**当前解决方案：编辑 config.json 文件**

用户目前的操作流程：
```
打开文本编辑器 → 找到 config.json → 手动编辑值 → 保存 → 重启系统 → 查看结果
```

**用户痛点：**
- 不知道 JSON 格式是否正确（语法错误）
- 不知道值是否有效（IP 地址格式、端口范围）
- 不知道设备是否能连接（配置错误导致失联）
- 害怕破坏系统（担心犯错误）
- 配置错误后难以诊断问题

**用户心智模型：**
- **期望**：像填写在线表单一样，输入时系统告诉我对不对
- **恐惧**：配置错误导致设备无法连接
- **成功标准**：一次配置成功，不需要反复试错
- **信心来源**：实时验证反馈 + 可见设备状态

**用户期望的体验：**
```
打开配置页面 → 看到设备状态 → 修改配置值 → 实时看到验证结果 → 保存 → 明确的成功反馈 → 重启 → 设备正常运行
```

### 2.3 Success Criteria

**核心体验成功的标志：**

**1. "这个工具用起来很安心"**
- 用户输入时立即看到验证结果（✓绿色或✗红色）
- 错误信息友好且具体：
  - ✅ "IP 地址格式无效，请输入如 192.168.1.100 的格式"
  - ❌ "Error 500: Internal Server Error"
- 用户感觉"系统在帮我检查，不会让我犯错"
- 用户敢于修改配置，不怕犯错

**2. "我知道设备现在是什么状态"**
- 左侧仪表盘清晰显示设备连接状态（在线/离线）
- 用户在配置时能看到"配置前"和"配置后"的对比
- 实时状态更新（设备状态变化时立即看到）
- 配置字段显示当前值，用户知道"我正在改什么"

**3. "配置成功了，我很确定"**
- 保存后立即看到成功反馈：
  - Toast 通知弹出："配置已保存"
  - 顶部 Alert 提醒："需要重启系统才能生效"
- 保存按钮显示加载状态（"保存中..."），用户知道系统在工作
- 重启后设备状态正常，配置生效，用户确认"成功了"

**4. "整个过程很流畅"**
- 表单字段自动聚焦到第一个可编辑项
- Tab 键流畅地在字段间导航
- 保存按钮在表单有错误时自动禁用（防止错误提交）
- 页面加载快（<3秒），交互流畅无卡顿
- 测试连接功能提供额外的验证（可选但推荐）

### 2.4 Novel UX Patterns

**使用成熟模式，组合优化**

node-switch 的核心体验**不需要发明新的交互模式**，而是优化和组合现有的成熟模式：

**1. 实时表单验证（成熟模式）**
- **来源**：shadcn/ui Form + Zod 验证
- **优势**：用户熟悉在线表单的即时验证体验
- **我们的创新点**：
  - 将这种体验应用到设备配置工具（传统上是文本编辑）
  - 提供更友好的错误信息（不使用技术术语）
  - 实时验证 + 可选测试连接的组合验证策略

**2. 仪表盘 + 主操作区（成熟模式）**
- **来源**：Portainer、GitHub Dashboard、Docker 管理界面
- **优势**：用户理解左侧参考区 + 右侧操作区的布局
- **我们的创新点**：
  - 将设备状态仪表盘集成到配置页面（而非单独页面）
  - 左侧固定显示状态，右侧主操作区（配置表单）
  - 状态可见性贯穿整个配置过程

**3. Toast 通知 + Alert 提醒（成熟模式）**
- **来源**：现代 Web 应用的标准反馈模式
- **优势**：用户熟悉不打断流程的通知（Toast）+ 不可忽略的提醒
- **我们的创新点**：
  - 组合使用：Toast 提供操作反馈，Alert 提供关键提醒
  - 确保"需要重启"的信息不被忽略
  - 渐进式验证：格式验证（Toast）+ 连接测试（Alert）

**结论：**
我们的核心体验使用**成熟模式**，通过**组合优化**而非创新交互。这降低了用户学习成本，因为用户已经熟悉这些模式。我们不是在教用户新的交互方式，而是在他们熟悉的基础上提供更好的体验。

### 2.5 Experience Mechanics

**核心体验流程：实时验证的安心配置**

#### 阶段 1：启动（Initiation）

**用户操作：**
- 打开浏览器，访问配置页面 URL

**系统响应：**
```typescript
// 页面加载流程
1. 检查用户身份（如果需要登录）
2. 加载当前配置值（从 config.json）
3. 加载设备状态（轮询或 WebSocket）
4. 渲染 shadcn/ui 界面
```

**视觉呈现：**
- 页面快速加载（目标：<3秒）
- 显示 shadcn/ui 风格的精美界面
- 左侧仪表盘（1/3 宽度）：
  - Card 组件包裹
  - 设备状态 Badge（绿色"在线" / 红色"离线"）
  - 连接信息（IP、端口、协议）
- 右侧表单区域（2/3 宽度）：
  - Card 组件包裹
  - 表单字段显示当前配置值
  - 第一个可编辑字段自动聚焦

**用户感受：**
- "这个界面很专业，我知道该怎么做"
- "我可以看到设备状态，知道现在是什么情况"
- "表单已经填好了，我只需要修改需要改的地方"

#### 阶段 2：交互（Interaction）

**用户操作：**
- 在表单中输入/修改配置值
- Tab 键导航到下一个字段
- （可选）点击"测试连接"按钮

**系统响应：**
```typescript
// 实时验证流程
1. 用户输入触发 onChange 事件
2. shadcn/ui Form 调用 Zod schema 验证
3. 验证结果立即显示：
   - ✓ 绿色图标 + "格式正确"
   - ✗ 红色图标 + "IP 地址格式无效"
4. 表单整体状态更新（form.formState.isValid）
5. 保存按钮根据表单状态启用/禁用
```

**视觉反馈：**
- **输入正确**：
  - 字段边框变绿色（border-green-500）
  - 显示绿色 ✓ 图标
  - 字段下方显示绿色文字"格式正确"
- **输入错误**：
  - 字段边框变红色（border-red-500）
  - 显示红色 ✗ 图标
  - 字段下方显示红色错误信息："IP 地址格式无效，请输入如 192.168.1.100 的格式"
- **按钮状态**：
  - 表单有错误：保存按钮禁用（disabled + 灰色）
  - 表单有效：保存按钮启用（主色调 + 可点击）

**（可选）测试连接功能：**
```typescript
// 测试连接流程
1. 用户点击"测试连接"按钮
2. 按钮显示"测试中..." + spinner
3. 系统尝试连接设备（UDP/TCP）
4. 连接结果：
   - 成功：Toast "连接成功" + 仪表盘显示"在线"
   - 失败：Toast "连接失败，请检查配置" + 友好错误信息
```

**用户感受：**
- "系统在实时验证，我不会犯错"
- "输入正确的 IP 地址后看到绿色✓，很安心"
- "如果错了，字段下方告诉我具体怎么改"
- "我可以测试连接，确保配置正确后再保存"

#### 阶段 3：反馈（Feedback）

**用户操作：**
- 点击"保存配置"按钮

**系统响应：**
```typescript
// 保存配置流程
1. 按钮显示加载状态：
   - 文字变为"保存中..."
   - 显示 spinner 图标
   - 按钮禁用（防止重复提交）

2. 执行保存操作：
   - 验证配置（最终检查）
   - 写入 config.json 文件
   - 返回保存结果

3. 保存成功反馈：
   - Toast 通知弹出（右下角，3秒后自动消失）：
     - 图标：✓ 绿色成功图标
     - 标题："配置已保存"
     - 描述："需要重启系统才能生效"
   - 顶部 Alert 显示（不可忽略）：
     - 图标：AlertCircle
     - 标题："需要重启系统"
     - 描述："配置已保存，但需要重启系统才能生效。点击下方按钮立即重启，或稍后手动重启。"
     - 操作按钮："立即重启"

4. 保存失败反馈：
   - Toast 错误通知（右下角，不自动消失）：
     - 图标：✗ 红色错误图标
     - 标题："保存失败"
     - 描述："无法保存配置，请检查网络连接后重试"
   - 按钮恢复可用状态
```

**用户感受：**
- "我看到保存进度，知道系统在工作"
- "保存成功了，系统明确告诉我（Toast + Alert）"
- "需要重启，这个提醒很清楚，不会忽略"
- "如果失败了，系统告诉我为什么失败，怎么修正"

#### 阶段 4：完成（Completion）

**用户操作：**
- 点击"立即重启"按钮（或稍后手动重启）

**系统响应：**
```typescript
// 重启系统流程
1. 用户点击"立即重启"
2. 按钮显示"重启中..." + spinner
3. 执行系统重启命令
4. 显示重启进度（可选）：
   - Progress 进度条
   - 或 Spinner + "系统正在重启..."
5. 重启完成：
   - Toast 通知："系统已重启，新配置已生效"
   - 仪表盘显示设备状态（如果配置正确：绿色 Badge "在线"）
   - 表单字段显示新的配置值
   - Alert 提醒消失（或显示"重启完成"）
```

**视觉呈现：**
- **重启前**：
  - 顶部 Alert 提醒："需要重启系统"
  - 仪表盘显示旧配置状态
  - 保存按钮：灰色（已禁用）
- **重启后**：
  - Toast 通知："系统已重启"
  - 仪表盘显示新状态（在线/离线）
  - 表单字段显示新值
  - 顶部 Alert 消失

**用户感受：**
- "任务完成，设备准备就绪"
- "配置成功了，设备正常运行"
- "这个工具真的让我很安心"
- "比编辑 JSON 文件简单太多了"

---

**核心体验流程图：**

```
┌─────────────────────────────────────────────────┐
│  1. 启动：打开配置页面                           │
│     ├─ 页面加载 <3秒（加载配置 + 设备状态）      │
│     ├─ 仪表盘（左侧）：设备状态 + 连接信息       │
│     └─ 表单（右侧）：当前配置值 + 自动聚焦       │
├─────────────────────────────────────────────────┤
│  2. 交互：修改配置值                            │
│     ├─ 输入 IP 地址 → Zod 实时验证 ✓/✗         │
│     ├─ 错误：红色边框 + 友好错误信息            │
│     ├─ 正确：绿色边框 + ✓图标                   │
│     ├─ （可选）测试连接：验证设备可访问性        │
│     └─ 保存按钮：表单有效时启用，无效时禁用      │
├─────────────────────────────────────────────────┤
│  3. 反馈：保存配置                              │
│     ├─ 点击保存 → 按钮："保存中..." + spinner   │
│     ├─ 保存成功：                              │
│     │   ├─ Toast（右下角）："配置已保存"        │
│     │   └─ Alert（顶部）："需要重启系统"        │
│     └─ 保存失败：                              │
│         └─ Toast："保存失败，请重试"            │
├─────────────────────────────────────────────────┤
│  4. 完成：重启系统                              │
│     ├─ 点击"立即重启" → 按钮："重启中..."       │
│     ├─ 系统重启 → 显示进度                     │
│     └─ 重启完成：                              │
│         ├─ Toast："系统已重启，新配置已生效"    │
│         ├─ 仪表盘：设备状态更新（在线）         │
│         └─ 表单：显示新配置值                   │
└─────────────────────────────────────────────────┘
```

**关键体验设计原则：**

1. **实时验证**：不等提交时才发现错误，输入时即验证
2. **状态可见**：用户始终看到设备状态和配置状态
3. **友好反馈**：错误信息具体可操作，不使用技术术语
4. **预防为主**：提供测试连接功能，但不强制
5. **明确确认**：保存/重启状态不可忽略，确保用户知道发生了什么

---

## Visual Design Foundation

### Color System

**颜色系统：shadcn/ui 默认主题**

node-switch 配置界面采用 shadcn/ui 的默认颜色主题，这是一个经过大量项目验证的专业配色方案，完全符合"安心感、专业感、掌控感"的情感目标。

**基础颜色（HSL 格式）：**

```css
/* src/app/globals.css */
@layer base {
  :root {
    /* 背景和前景色 */
    --background: 0 0% 100%;           /* 纯白背景 */
    --foreground: 222.2 84% 4.9%;       /* 深色文字 #0a0a0a */

    /* 卡片和弹出层 */
    --card: 0 0% 100%;                 /* 卡片白色背景 */
    --card-foreground: 222.2 84% 4.9%;  /* 卡片深色文字 */
    --popover: 0 0% 100%;              /* 弹出层白色背景 */
    --popover-foreground: 222.2 84% 4.9%;

    /* 主色调 */
    --primary: 222.2 47.4% 11.2%;       /* 深蓝黑 #18181b */
    --primary-foreground: 210 40% 98%; /* 主色上的白色文字 */

    /* 次要色 */
    --secondary: 210 40% 96.1%;         /* 浅灰 #f4f4f5 */
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* 静音色（用于次要内容）*/
    --muted: 210 40% 96.1%;             /* 浅灰 #f4f4f5 */
    --muted-foreground: 215.4 16.3% 46.9%; /* 灰色文字 #71717a */

    /* 强调色 */
    --accent: 210 40% 96.1%;            /* 浅灰 #f4f4f5 */
    --accent-foreground: 222.2 47.4% 11.2%;

    /* 错误色（破坏性操作）*/
    --destructive: 0 84.2% 60.2%;       /* 红色 #ef4444 */
    --destructive-foreground: 210 40% 98%;

    /* 边框和输入框 */
    --border: 214.3 31.8% 91.4%;       /* 浅灰边框 #e4e4e7 */
    --input: 214.3 31.8% 91.4%;         /* 输入框边框 */
    --ring: 222.2 84% 4.9%;             /* 焦点环 #0a0a0a */

    /* 圆角 */
    --radius: 0.5rem;                   /* 8px 圆角 */
  }
}
```

**语义颜色（shadcn/ui 组件自动使用）：**

```css
/* 语义颜色映射 */
success: green   /* 用于验证通过、设备在线、成功状态 */
warning: yellow  /* 用于警告、重要提醒 */
error: red       /* 用于验证失败、设备离线、错误状态 */
info: blue       /* 用于信息提示、一般通知 */
```

**语义颜色使用场景：**

1. **Success（成功）- 绿色**
   - 字段验证通过：绿色边框 + ✓ 图标
   - 设备在线状态：绿色 Badge "在线"
   - 保存成功通知：Toast 绿色成功图标

2. **Warning（警告）- 黄色**
   - 重要配置修改警告：黄色 Alert
   - 重启提醒：黄色 Alert（不可忽略）

3. **Error（错误）- 红色**
   - 字段验证失败：红色边框 + ✗ 图标 + 错误信息
   - 设备离线状态：红色 Badge "离线"
   - 保存失败通知：Toast 红色错误图标

4. **Info（信息）- 蓝色**
   - 一般信息提示：蓝色 Alert
   - 帮助提示：蓝色图标 + 提示文本

**颜色对比度（无障碍合规）：**

- **正文文字**（foreground on background）：16.7:1（WCAG AAA）
- **大标题**（primary on card）：16.7:1（WCAG AAA）
- **次要文字**（muted-foreground on background）：4.6:1（WCAG AA）
- **错误文字**（destructive on background）：5.1:1（WCAG AA）

所有颜色组合均符合 **WCAG AA 标准**，重要文本符合 **WCAG AAA 标准**。

### Typography System

**字体系统：系统默认字体**

node-switch 使用 shadcn/ui 的默认字体系统，这是一个干净、现代、高可读性的字体栈。

**字体栈（Font Stack）：**

```css
/* 字体族定义 */
font-family: ui-sans-serif, system-ui,
  -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto,
  "Helvetica Neue", Arial,
  sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji",
  "Segoe UI Symbol", "Noto Color Emoji";
```

**字体选择理由：**

1. **系统字体优先**：无需加载外部字体文件，页面加载快
2. **清晰可读**：San-serif 字体在屏幕上显示清晰
3. **跨平台一致**：各操作系统都有对应的优化字体
   - macOS：San Francisco
   - Windows：Segoe UI
   - Linux：Roboto
   - Android：Roboto
4. **专业感**：系统字体传达现代、专业的视觉感受

**字体大小层级（Type Scale）：**

```css
/* shadcn/ui 默认字体大小 */
--text-base: 1rem;      /* 16px - 正文文字（基准）*/
--text-lg: 1.125rem;    /* 18px - 大正文 */
--text-sm: 0.875rem;    /* 14px - 小文字 */
--text-xs: 0.75rem;     /* 12px - 标签、注释 */

/* 标题字体大小（未在 shadcn/ui 默认定义，可扩展）*/
h1: 2.25rem (36px)      /* 页面主标题 */
h2: 1.875rem (30px)     /* 区域标题 */
h3: 1.5rem (24px)       /* 卡片标题 */
h4: 1.25rem (20px)      /* 小节标题 */
```

**字体使用规范：**

| 元素 | 字体大小 | 使用场景 | 示例 |
|------|----------|----------|------|
| **h1** | 36px (2.25rem) | 页面主标题 | "设备配置" |
| **h2** | 30px (1.875rem) | 区域标题 | "网络配置"、"设备配置" |
| **h3** | 24px (1.5rem) | 卡片标题 | CardTitle |
| **body** | 16px (1rem) | 正文文字 | 表单字段说明 |
| **sm** | 14px (0.875rem) | 小文字 | 帮助提示、错误信息 |
| **xs** | 12px (0.75rem) | 标签/注释 | 时间戳、Badge 文字 |

**字重（Font Weight）：**

```css
/* shadcn/ui 默认字重 */
font-normal: 400    /* 常规文字 */
font-medium: 500    /* 中等字重（强调）*/
font-semibold: 600  /* 半粗体（标题）*/
font-bold: 700      /* 粗体（主标题）*/
```

**行高（Line Height）：**

```css
/* shadcn/ui 默认行高 */
leading-none: 1     /* 紧凑行高 */
leading-tight: 1.25 /* 紧凑行高（标题）*/
leading-normal: 1.5 /* 正常行高（正文）*/
leading-relaxed: 1.625 /* 宽松行高 */
```

**排版使用示例：**

```tsx
{/* 页面标题 */}
<h1 className="text-3xl font-bold leading-tight">
  设备配置
</h1>

{/* 区域标题 */}
<h2 className="text-2xl font-semibold leading-tight">
  网络配置
</h2>

{/* 卡片标题 */}
<CardTitle className="text-xl font-semibold">
  设备状态
</CardTitle>

{/* 正文文字 */}
<p className="text-base leading-normal">
  配置设备的网络参数，包括 IP 地址、子网掩码、网关等。
</p>

{/* 帮助提示 */}
<p className="text-sm leading-normal text-muted-foreground">
  请输入有效的 IPv4 地址，例如：192.168.1.100
</p>

{/* 错误信息 */}
<FormMessage className="text-sm leading-normal text-destructive" />
```

### Spacing & Layout Foundation

**间距系统：Tailwind CSS 4px 基准**

node-switch 使用 Tailwind CSS 的标准间距系统，以 4px 为基准单位，确保整个界面的间距一致性。

**间距单位（Spacing Units）：**

```css
/* Tailwind 间距倍数 */
spacing-0: 0         /* 0px */
spacing-px: 1px      /* 1px */
spacing-0.5: 0.125rem (2px)
spacing-1: 0.25rem (4px)      /* 基准单位 */
spacing-2: 0.5rem (8px)        /* 2倍基准 */
spacing-3: 0.75rem (12px)
spacing-4: 1rem (16px)         /* 常用间距 */
spacing-5: 1.25rem (20px)
spacing-6: 1.5rem (24px)        /* 组件内边距 */
spacing-8: 2rem (32px)
spacing-10: 2.5rem (40px)
spacing-12: 3rem (48px)
spacing-16: 4rem (64px)
spacing-20: 5rem (80px)
```

**间距使用规范：**

| 间距 | 使用场景 | 示例 |
|------|----------|------|
| **p-4 (16px)** | 小组件内边距 | 小 Badge、按钮内边距 |
| **p-6 (24px)** | 组件标准内边距 | Card 内边距（推荐）|
| **p-8 (32px)** | 大组件内边距 | 页面容器内边距 |
| **gap-4 (16px)** | 元素间距 | 表单字段间距 |
| **gap-6 (24px)** | 区域间距 | 卡片间距、列间距 |

**布局系统：网格布局**

node-switch 使用 Tailwind Grid 系统实现响应式布局：

**页面容器：**

```tsx
<div className="min-h-screen bg-background">
  <div className="container mx-auto p-6">
    {/* 页面内容 */}
  </div>
</div>
```

**主布局（仪表盘 + 表单）：**

```tsx
{/* 响应式网格布局 */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* 左侧：设备状态仪表盘（占 1/3 宽度）*/}
  <div className="lg:col-span-1">
    <DeviceStatusDashboard />
  </div>

  {/* 右侧：配置表单（占 2/3 宽度）*/}
  <div className="lg:col-span-2">
    <ConfigForm />
  </div>
</div>
```

**表单字段布局（双列网格）：**

```tsx
{/* 配置分组：双列布局 */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* 网络配置组 */}
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle>网络配置</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* 网络配置字段 */}
    </CardContent>
  </Card>

  {/* 设备配置组 */}
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle>设备配置</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* 设备配置字段 */}
    </CardContent>
  </Card>
</div>
```

**响应式断点：**

```css
/* Tailwind 断点 */
sm: 640px    /* 小屏幕（平板竖屏）*/
md: 768px    /* 中等屏幕（平板横屏）*/
lg: 1024px   /* 大屏幕（桌面）*/
xl: 1280px   /* 超大屏幕 */
2xl: 1536px  /* 超超大屏幕 */
```

**响应式布局策略：**

- **小屏幕（< 1024px）**：单列布局，仪表盘和表单垂直排列
- **大屏幕（≥ 1024px）**：三列网格布局，仪表盘 1 列，表单 2 列
- **表单字段**：小屏幕单列，中屏幕双列，保持一致性

**布局原则：**

1. **适度留白**：使用 `p-6`（24px）让界面不拥挤，提供"呼吸感"
2. **一致间距**：所有组件使用相同的间距倍数（4、6、8）
3. **视觉层次**：使用间距（gap-6）分隔不同区域
4. **响应式优先**：移动端单列，桌面端多列
5. **网格对齐**：使用 Grid 系统确保元素对齐整齐

**具体布局示例（完整页面）：**

```tsx
export default function ConfigPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">设备配置</h1>
        <p className="text-muted-foreground">
          配置网络参数和设备设置
        </p>
      </div>

      {/* 主布局：仪表盘 + 表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：设备状态仪表盘 */}
        <div className="lg:col-span-1">
          <DeviceStatusDashboard />
        </div>

        {/* 右侧：配置表单 */}
        <div className="lg:col-span-2">
          {/* 重启提醒 Alert（条件渲染）*/}
          {needsRestart && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>需要重启系统</AlertTitle>
              <AlertDescription>
                配置已保存，但需要重启系统才能生效。
              </AlertDescription>
            </Alert>
          )}

          {/* 配置表单 */}
          <Card className="p-6">
            <form className="space-y-6">
              {/* 表单字段 */}
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

### Accessibility Considerations

**无障碍设计：WCAG 2.1 AA 合规**

node-switch 配置界面遵循 **WCAG 2.1 AA 标准**，确保所有用户（包括残障用户）都能使用。

**1. 颜色对比度**

**WCAG AA 要求：**
- **正常文字**：对比度 ≥ 4.5:1
- **大文字（18px+ 或 14px 粗体+）**：对比度 ≥ 3:1
- **UI 组件和图形**：对比度 ≥ 3:1

**我们的实现：**
- ✅ 正文文字（16px）：对比度 16.7:1（远超 AA 标准）
- ✅ 次要文字（14px）：对比度 4.6:1（符合 AA 标准）
- ✅ 错误文字：对比度 5.1:1（符合 AA 标准）
- ✅ 所有交互元素：对比度 ≥ 4.5:1

**额外措施：**
- 错误提示使用 **颜色 + 图标 + 文字** 三重提示（不只是颜色）
- 必填字段使用 `*` 符号 + "必填"文字说明
- 禁用状态使用灰色 + `disabled` 属性（不只是视觉）

**2. 键盘导航**

**要求：** 所有交互元素必须可通过键盘访问

**我们的实现：**
- ✅ **Tab 键导航**：表单字段、按钮可按 Tab 键切换焦点
- ✅ **焦点指示器**：所有可聚焦元素有 `focus:ring-2` 焦点环
- ✅ **Enter/Space**：按钮和链接可通过 Enter 或 Space 激活
- ✅ **Esc 键**：关闭 Dialog/Modal（如果使用）

**实现示例：**

```tsx
{/* 表单字段支持键盘导航 */}
<FormField
  name="ipAddress"
  render={({ field }) => (
    <FormItem>
      <FormLabel>IP 地址</FormLabel>
      <FormControl>
        <Input
          {...field}
          // 焦点环样式
          className="focus:ring-2 focus:ring-primary"
          // 键盘快捷键
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              form.handleSubmit(onSubmit)()
            }
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**3. 屏幕阅读器支持**

**要求：** 所有交互元素有正确的 ARIA 属性

**我们的实现（shadcn/ui 自动提供）：**
- ✅ **表单字段**：`label` 元素正确关联到 `input`
- ✅ **按钮**：`aria-label` 或明确按钮文字
- ✅ **错误提示**：`aria-describedby` 关联错误信息
- ✅ **加载状态**：`aria-busy="true"` 和加载文字提示
- ✅ **状态变化**：`aria-live` 区域通知重要变化

**实现示例（shadcn/ui 自动处理）：**

```tsx
{/* shadcn/ui Form 自动添加 ARIA 属性 */}
<FormField
  name="ipAddress"
  render={({ field }) => (
    <FormItem>
      {/* label 自动关联到 input */}
      <FormLabel htmlFor={field.name}>IP 地址</FormLabel>
      <FormControl>
        <Input
          {...field}
          id={field.name}
          // aria-describedby 自动关联错误信息
          aria-invalid={!!fieldState.error}
          aria-describedby={
            fieldState.error
              ? `${field.name}-error`
              : undefined
          }
        />
      </FormControl>
      {/* 错误信息可被屏幕阅读器朗读 */}
      <FormMessage id={`${field.name}-error`} />
    </FormItem>
  )}
/>
```

**4. 触摸目标大小**

**WCAG 要求：** 触摸目标至少 44x44px

**我们的实现：**
- ✅ **按钮**：最小高度 40px（Button sm: h-9 = 36px，默认: h-10 = 40px）
- ✅ **输入框**：默认高度 40px（Input h-10）
- ✅ **复选框/单选框**：至少 44x44px 点击区域
- ✅ **Badge**：文字大小足够，易于点击

**5. 其他无障碍考虑**

**加载状态：**
```tsx
{/* 加载状态有文字提示，不只是 spinner */}
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  保存中...
</Button>
```

**错误提示：**
```tsx
{/* 错误信息具体且可操作 */}
<FormMessage>
  IP 地址格式无效，请输入如 192.168.1.100 的格式
</FormMessage>
```

**语言声明：**
```tsx
<html lang="zh-CN">
```

**跳过导航链接（可选）：**
```tsx
{/* 键盘用户可跳过导航 */}
<a href="#main-content" className="sr-only focus:not-sr-only">
  跳到主内容
</a>
```

**无障碍检查清单：**

- ✅ 所有交互元素可键盘访问
- ✅ 焦点指示器清晰可见
- ✅ 颜色对比度符合 WCAG AA 标准
- ✅ 错误提示使用颜色 + 图标 + 文字
- ✅ 表单字段有明确的 label
- ✅ 加载状态有文字提示
- ✅ 屏幕阅读器可正确解析所有内容

---

## 补充：登录页面 UX 设计

### 登录页面核心体验

**用户目标：** 通过身份验证进入配置系统

**关键交互流程：**
1. 用户访问系统（首次或会话过期）
2. 显示登录页面
3. 用户输入凭据
4. 系统验证并允许访问

### 登录页面布局设计

```tsx
// src/components/LoginPage.tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">设备配置系统</h1>
          <p className="text-muted-foreground mt-2">
            请输入凭据以访问配置界面
          </p>
        </div>

        <form className="space-y-4">
          <FormField name="username">
            <FormLabel>用户名</FormLabel>
            <FormControl>
              <Input placeholder="请输入用户名" />
            </FormControl>
          </FormField>

          <FormField name="password">
            <FormLabel>密码</FormLabel>
            <FormControl>
              <Input type="password" placeholder="请输入密码" />
            </FormControl>
          </FormField>

          <Button type="submit" className="w-full">
            登录
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          首次使用？请联系管理员获取默认凭据
        </div>
      </Card>
    </div>
  )
}
```

### 登录页面交互设计

**1. 用户输入阶段**
- 用户名/密码字段：标准 shadcn/ui Input 组件
- 实时格式验证：检查用户名和密码不为空
- Enter 键提交：支持键盘快捷操作

**2. 提交验证阶段**
- 按钮状态：正常 → 加载中（显示 spinner）→ 成功/失败
- 系统后端验证凭据
- 成功后重定向到仪表盘页面

**3. 错误处理**
- 凭据无效时显示 Toast 通知："登录失败：用户名或密码错误"
- 不显示具体是用户名还是密码错误（安全考虑）
- 用户名/密码字段保留输入内容，便于修正

**4. 加载状态设计**
- 登录按钮显示加载状态："登录中..."
- 按钮禁用防止重复提交
- 3秒超时机制防止无限等待

### 无障碍和响应式设计

- 登录表单字段自动聚焦到第一个输入框
- Tab 键可在用户名、密码和登录按钮间切换
- 支持 125%-150% 显示缩放
- 移动设备上表单垂直堆叠显示

---

## 补充：配置历史与回滚 UX 设计

### 配置历史页面核心体验

**用户目标：** 查看配置更改历史并能回滚到之前的版本

**关键交互流程：**
1. 用户访问"配置历史"页面
2. 浏览配置更改历史列表
3. 选择特定版本查看详情
4. 选择是否恢复到该版本

### 配置历史页面布局设计

```tsx
// src/components/ConfigHistoryPage.tsx
export default function ConfigHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">配置历史</h1>
        <p className="text-muted-foreground">
          查看和管理配置更改历史
        </p>
      </div>

      {/* 配置历史列表 */}
      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {historyItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">配置版本 #{item.version}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.timestamp} • {item.author}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    查看详情
                  </Button>
                  <Button size="sm" onClick={() => handleRollback(item)}>
                    恢复此版本
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 配置回滚交互设计

**1. 历史列表浏览**
- 按时间倒序显示配置更改记录
- 每条记录显示版本号、时间戳、修改者
- 最多显示最近20条记录（可分页）

**2. 详情查看**
- 点击"查看详情"打开配置对比视图
- 显示完整的配置内容
- 高亮显示与当前配置的差异

**3. 配置回滚流程**
- 点击"恢复此版本"触发确认流程
- 显示确认对话框：
  - "您确定要恢复到此配置版本吗？"
  - "此操作将覆盖当前配置并需要重启系统"
  - "确认后将无法撤销此操作"
- 用户确认后执行回滚操作

**4. 回滚确认设计**
- 使用 destructive variant 的确认按钮（红色）
- 显示加载状态直到操作完成
- 成功后显示 Toast 通知："配置已恢复，需要重启系统"
- 自动导航到重启提醒页面

### 配置模板 UX 设计

```tsx
// src/components/ConfigTemplateSection.tsx
export function ConfigTemplateSection() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>配置模板</CardTitle>
        <CardDescription>
          从预设模板快速应用常见配置
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:bg-muted cursor-pointer"
              onClick={() => applyTemplate(template)}
            >
              <h4 className="font-semibold">{template.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {template.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
              >
                应用模板
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
