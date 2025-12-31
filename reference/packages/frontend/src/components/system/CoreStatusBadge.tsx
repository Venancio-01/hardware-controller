/**
 * CoreStatusBadge 组件 - Core 进程状态徽章
 *
 * 根据 Core 进程状态显示不同颜色和图标的徽章
 * - Running: 绿色 + CheckCircle
 * - Starting: 黄色 + Loader (动画)
 * - Stopped: 灰色 + Circle
 * - Error: 红色 + XCircle
 */
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Circle, Loader2, HelpCircle } from 'lucide-react';
import type { CoreStatusResponse } from 'shared';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/hooks/useCoreStatus';

/**
 * 状态配置映射
 */
const STATUS_CONFIG: Record<CoreStatusResponse['status'], {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: React.FC<{ className?: string }>;
  animate?: boolean;
}> = {
  Running: {
    label: '运行中',
    variant: 'default',
    className: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    icon: CheckCircle,
  },
  Starting: {
    label: '启动中',
    variant: 'default',
    className: 'bg-amber-500 hover:bg-amber-600 text-white',
    icon: Loader2,
    animate: true,
  },
  Stopped: {
    label: '已停止',
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground',
    icon: Circle,
  },
  Error: {
    label: '错误',
    variant: 'destructive',
    className: '',
    icon: XCircle,
  },
};

interface CoreStatusBadgeProps {
  /** Core 进程状态 */
  status: CoreStatusResponse['status'] | null;
  /** WebSocket 连接状态 (用于处理断开连接时的显示) */
  connectionStatus?: ConnectionStatus;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
}

/**
 * Core 状态徽章组件
 *
 * @example
 * ```tsx
 * <CoreStatusBadge status="Running" />
 * <CoreStatusBadge status="Error" showIcon={false} />
 * ```
 */
export function CoreStatusBadge({
  status,
  connectionStatus,
  showIcon = true,
  className,
}: CoreStatusBadgeProps): React.JSX.Element {
  // 如果连接断开或错误，显示"未知"状态
  if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
    return (
      <Badge variant="outline" className={cn('gap-1 text-muted-foreground', className)}>
        {showIcon && <HelpCircle className="h-3 w-3" />}
        <span>未知</span>
      </Badge>
    );
  }

  // 处理 null 状态 (加载中)
  if (!status) {
    return (
      <Badge variant="outline" className={cn('gap-1', className)}>
        {showIcon && <Loader2 className="h-3 w-3 animate-spin" />}
        <span>加载中...</span>
      </Badge>
    );
  }

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn('gap-1', config.className, className)}
    >
      {showIcon && (
        <Icon className={cn('h-3 w-3', config.animate && 'animate-spin')} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
