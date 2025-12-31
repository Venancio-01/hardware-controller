
import { render, screen, waitFor } from '@testing-library/react'
import { AppConfigCard } from '../AppConfigCard'
import { configSchema, type Config } from 'shared'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeAll } from 'vitest'

// Wrapper component to provide Form context
function AppConfigCardTestWrapper() {
  const form = useForm<Config>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      deviceId: 'TEST-001',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000
    },
    mode: "onChange"
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => { })}>
        <AppConfigCard form={form} />
      </form>
    </Form>
  )
}

describe('AppConfigCard', () => {
  // Setup ResizeObserver mock
  beforeAll(() => {
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  });

  it('应该渲染所有配置字段', () => {
    render(<AppConfigCardTestWrapper />)

    expect(screen.getByText('应用程序配置')).toBeInTheDocument()
    expect(screen.getByLabelText('设备 ID')).toBeInTheDocument()
    expect(screen.getByLabelText('操作超时')).toBeInTheDocument()
    expect(screen.getByLabelText('重试次数')).toBeInTheDocument()
    expect(screen.getByLabelText('轮询间隔')).toBeInTheDocument()
  })

  it('应该显示验证错误信息', async () => {
    render(<AppConfigCardTestWrapper />)
    const user = userEvent.setup()

    const timeoutInput = screen.getByLabelText('操作超时')
    await user.clear(timeoutInput)
    await user.type(timeoutInput, '500')
    await user.tab() // Trigger validation

    await waitFor(() => {
      expect(screen.getByText(/超时时间不能少于1000毫秒/)).toBeInTheDocument()
    })
  })

  it('应该验证所有数字字段的边界值', async () => {
    render(<AppConfigCardTestWrapper />)
    const user = userEvent.setup()

    // 测试重试次数边界
    const retryInput = screen.getByLabelText('重试次数')
    await user.clear(retryInput)
    await user.type(retryInput, '-1')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/重试次数不能为负数/)).toBeInTheDocument()
    })

    // 测试轮询间隔边界
    const pollingInput = screen.getByLabelText('轮询间隔')
    await user.clear(pollingInput)
    await user.type(pollingInput, '100')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/轮询间隔不能少于1000毫秒/)).toBeInTheDocument()
    })
  })

  it('应该验证 deviceId 的必填要求', async () => {
    render(<AppConfigCardTestWrapper />)
    const user = userEvent.setup()

    const deviceIdInput = screen.getByLabelText('设备 ID')
    await user.clear(deviceIdInput)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/设备 ID 不能为空/)).toBeInTheDocument()
    })
  })

  it('应该显示所有字段的帮助文本', () => {
    render(<AppConfigCardTestWrapper />)

    expect(screen.getByText('设备的唯一识别代码')).toBeInTheDocument()
    expect(screen.getByText(/单位: 毫秒/)).toBeInTheDocument()
    expect(screen.getByText(/失败后的重试次数/)).toBeInTheDocument()
  })

  it('应该在无效输入时显示错误图标', async () => {
    const { container } = render(<AppConfigCardTestWrapper />)
    const user = userEvent.setup()

    const timeoutInput = screen.getByLabelText('操作超时')
    await user.clear(timeoutInput)
    await user.type(timeoutInput, '500')
    // 触发 blur 事件以完成验证
    await user.tab()

    // 先等待验证错误消息出现，证明验证已完成
    await waitFor(() => {
      expect(screen.getByText(/超时时间不能少于1000毫秒/)).toBeInTheDocument()
    })

    // 验证错误出现后，检查错误图标
    await waitFor(() => {
      // 验证图标应该是 X (destructive) 图标，使用 SVG 选择器
      const icon = container.querySelector('svg.text-destructive')
      expect(icon).toBeInTheDocument()
    })
  })
})
