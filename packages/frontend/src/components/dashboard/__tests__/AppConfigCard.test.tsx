
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

  //   it('应该在输入有效时显示验证通过状态', async () => {
  //     // Note: Testing visual state (icons) might rely on checking classes or specifics of the icon rendering.
  //     // For now, we check the absence of error messages.
  //     render(<AppConfigCardTestWrapper />)
  //     const user = userEvent.setup()

  //     const timeoutInput = screen.getByLabelText('操作超时')
  //     await user.clear(timeoutInput)
  //     await user.type(timeoutInput, '2000')

  //     await waitFor(() => {
  //        expect(screen.queryByText(/超时时间/)).not.toBeInTheDocument()
  //     })
  //   })
})
