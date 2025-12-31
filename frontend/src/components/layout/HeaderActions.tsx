/**
 * HeaderActions 组件
 *
 * 将配置操作按钮（导出、导入、保存、重启）渲染到页面 header 区域
 * 使用 React Portal 将按钮从 ConfigForm 渲染到 header 容器中
 */

import { createPortal } from 'react-dom';
import { ReactNode, useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const HEADER_ACTIONS_CONTAINER_ID = 'header-actions-container';

interface HeaderActionsPortalProps {
  children: ReactNode;
}

/**
 * HeaderActionsPortal - 将子元素通过 Portal 渲染到 header 的 actions 容器中
 */
export function HeaderActionsPortal({ children }: HeaderActionsPortalProps) {
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    // 在客户端渲染时获取容器
    const el = document.getElementById(HEADER_ACTIONS_CONTAINER_ID);
    setContainer(el);
  }, []);

  // 如果容器不存在，不渲染任何内容
  if (!container) {
    return null;
  }

  return createPortal(children, container);
}

/**
 * HeaderActionsContainer - Header 中的操作按钮容器
 *
 * 在 __root.tsx 的 header 中使用此组件创建 Portal 目标容器
 */
export function HeaderActionsContainer() {
  const handleLogout = () => {
    // 删除token并重定向到登录页
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center gap-4">
      {/* Portal 容器，用于渲染来自 ConfigForm 的操作按钮 */}
      <div id={HEADER_ACTIONS_CONTAINER_ID} className="flex items-center gap-1" />

      {/* 垂直分隔符 */}
      <div className="h-4 w-px bg-border" />

      {/* 登出按钮 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>退出登录</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
