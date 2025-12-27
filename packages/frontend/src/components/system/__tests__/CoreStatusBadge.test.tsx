import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoreStatusBadge } from '../CoreStatusBadge';

describe('CoreStatusBadge', () => {
  it('should render loading state when status is null', () => {
    render(<CoreStatusBadge status={null} />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should render Running status with correct color and icon', () => {
    render(<CoreStatusBadge status="Running" />);

    expect(screen.getByText('运行中')).toBeInTheDocument();
    // 检查 Badge 包含正确的样式类
    const badge = screen.getByText('运行中').closest('.bg-emerald-500');
    expect(badge).toBeInTheDocument();
  });

  it('should render Starting status with loading animation', () => {
    render(<CoreStatusBadge status="Starting" />);

    expect(screen.getByText('启动中')).toBeInTheDocument();
    // 检查 Badge 包含正确的样式类
    const badge = screen.getByText('启动中').closest('.bg-amber-500');
    expect(badge).toBeInTheDocument();
  });

  it('should render Stopped status', () => {
    render(<CoreStatusBadge status="Stopped" />);

    expect(screen.getByText('已停止')).toBeInTheDocument();
  });

  it('should render Error status with destructive variant', () => {
    render(<CoreStatusBadge status="Error" />);

    expect(screen.getByText('错误')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(
      <CoreStatusBadge status="Running" showIcon={false} />
    );

    // 检查没有 svg 图标
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
    expect(screen.getByText('运行中')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CoreStatusBadge status="Running" className="custom-class" />);

    const badge = screen.getByText('运行中').closest('.custom-class');
    expect(badge).toBeInTheDocument();
  });

  it('should render all status types correctly', () => {
    const statuses = ['Running', 'Starting', 'Stopped', 'Error'] as const;
    const labels = ['运行中', '启动中', '已停止', '错误'];

    statuses.forEach((status, index) => {
      const { unmount } = render(<CoreStatusBadge status={status} />);
      expect(screen.getByText(labels[index])).toBeInTheDocument();
      unmount();
    });
  });
});
