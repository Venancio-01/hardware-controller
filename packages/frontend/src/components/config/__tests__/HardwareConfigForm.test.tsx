import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { HardwareConfigForm } from '../HardwareConfigForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configSchema, type Config } from 'shared';
import { Form } from '@/components/ui/form';

// 默认配置值，满足 schema 验证
const getDefaultConfig = () => ({
  // 必填字段
  deviceId: 'device-test-001',
  timeout: 3000,
  retryCount: 3,
  pollingInterval: 5000,
  ipAddress: '192.168.1.100',
  subnetMask: '255.255.255.0',
  gateway: '192.168.1.1',
  port: 8080,
  // 硬件配置字段
  CABINET_HOST: '192.168.1.101',
  CABINET_PORT: 50000,
  CONTROL_SERIAL_PATH: '/dev/ttyUSB0',
  CONTROL_SERIAL_BAUDRATE: 9600,
  CONTROL_SERIAL_DATABITS: 8,
  CONTROL_SERIAL_STOPBITS: 1,
  CONTROL_SERIAL_PARITY: 'none' as const,
  VOICE_CABINET_VOLUME: 10,
  VOICE_CABINET_SPEED: 5,
  VOICE_CONTROL_VOLUME: 10,
  VOICE_CONTROL_SPEED: 5,
});

// Mock 组件包装 HardwareConfigForm
const MockHardwareConfigForm = ({ defaultValues }: { defaultValues?: Partial<Config> }) => {
  const form = useForm<Config>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      ...getDefaultConfig(),
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form>
        <HardwareConfigForm form={form} />
      </form>
    </Form>
  );
};

afterEach(() => {
  cleanup();
});

describe('HardwareConfigForm', () => {
  describe('渲染测试', () => {
    it('应该渲染硬件配置卡片标题', () => {
      render(<MockHardwareConfigForm />);

      expect(screen.getByText('硬件配置')).toBeInTheDocument();
    });

    it('应该渲染机柜 TCP 连接区块', () => {
      render(<MockHardwareConfigForm />);

      expect(screen.getByText('机柜 TCP 连接')).toBeInTheDocument();
      expect(screen.getByLabelText(/机柜 IP 地址/)).toBeInTheDocument();
      expect(screen.getByLabelText(/机柜端口/)).toBeInTheDocument();
    });

    it('应该渲染串口配置区块', () => {
      render(<MockHardwareConfigForm />);

      expect(screen.getByText('控制端串口')).toBeInTheDocument();
      expect(screen.getByLabelText(/串口路径/)).toBeInTheDocument();
      expect(screen.getByLabelText(/波特率/)).toBeInTheDocument();
      expect(screen.getByLabelText(/数据位/)).toBeInTheDocument();
      expect(screen.getByLabelText(/停止位/)).toBeInTheDocument();
      expect(screen.getByLabelText(/奇偶校验/)).toBeInTheDocument();
    });

    it('应该渲染语音播报配置区块', () => {
      render(<MockHardwareConfigForm />);

      expect(screen.getByText('语音播报')).toBeInTheDocument();
      // 有两个机柜端和两个控制端的音量/语速字段
      expect(screen.getAllByLabelText(/音量 \(0-10\)/)).toHaveLength(2);
      expect(screen.getAllByLabelText(/语速 \(0-10\)/)).toHaveLength(2);
    });
  });

  describe('默认值测试', () => {
    it('应该显示正确的机柜连接默认值', () => {
      render(<MockHardwareConfigForm />);

      expect(screen.getByLabelText(/机柜 IP 地址/)).toHaveValue('192.168.1.101');
      expect(screen.getByLabelText(/机柜端口/)).toHaveValue(50000);
    });

    it('应该显示正确的串口默认值', () => {
      render(<MockHardwareConfigForm />);

      expect(screen.getByLabelText(/串口路径/)).toHaveValue('/dev/ttyUSB0');
    });
  });

  describe('用户输入测试', () => {
    it('应该允许用户输入机柜 IP 地址', async () => {
      const user = userEvent.setup();
      render(<MockHardwareConfigForm />);

      const ipInput = screen.getByLabelText(/机柜 IP 地址/);
      await user.clear(ipInput);
      await user.type(ipInput, '10.0.0.1');

      expect(ipInput).toHaveValue('10.0.0.1');
    });

    it('应该允许用户输入机柜端口', async () => {
      const user = userEvent.setup();
      render(<MockHardwareConfigForm />);

      const portInput = screen.getByLabelText(/机柜端口/);
      await user.clear(portInput);
      await user.type(portInput, '8080');

      expect(portInput).toHaveValue(8080);
    });

    it('应该允许用户输入串口路径', async () => {
      const user = userEvent.setup();
      render(<MockHardwareConfigForm />);

      const pathInput = screen.getByLabelText(/串口路径/);
      await user.clear(pathInput);
      await user.type(pathInput, '/dev/ttyS0');

      expect(pathInput).toHaveValue('/dev/ttyS0');
    });

    it('应该允许用户输入音量值', async () => {
      const user = userEvent.setup();
      render(<MockHardwareConfigForm />);

      const volumeInputs = screen.getAllByLabelText(/音量 \(0-10\)/);
      const cabinetVolumeInput = volumeInputs[0];

      await user.clear(cabinetVolumeInput);
      await user.type(cabinetVolumeInput, '5');

      expect(cabinetVolumeInput).toHaveValue(5);
    });
  });

  describe('奇偶校验选择器测试', () => {
    it('应该渲染奇偶校验下拉选择器', () => {
      render(<MockHardwareConfigForm />);

      const parityTrigger = screen.getByLabelText(/奇偶校验/);
      expect(parityTrigger).toBeInTheDocument();
    });

    it('应该显示默认的奇偶校验值', () => {
      render(<MockHardwareConfigForm defaultValues={{ CONTROL_SERIAL_PARITY: 'none' }} />);

      // Select trigger 应该显示当前选中的值
      const parityTrigger = screen.getByRole('combobox', { name: /奇偶校验/ });
      expect(parityTrigger).toHaveTextContent('无 (None)');
    });

    it('应该能够渲染不同的奇偶校验值', () => {
      render(<MockHardwareConfigForm defaultValues={{ CONTROL_SERIAL_PARITY: 'even' }} />);

      const parityTrigger = screen.getByRole('combobox', { name: /奇偶校验/ });
      expect(parityTrigger).toHaveTextContent('偶校验 (Even)');
    });
  });
});
