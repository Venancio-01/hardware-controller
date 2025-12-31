import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, RotateCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { restartCore } from '@/lib/api';
import { toast } from 'sonner';
import { ButtonHTMLAttributes } from 'react';

interface RestartCoreButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** 当为 true 时只显示图标，不显示文字 */
  iconOnly?: boolean;
}

export function RestartCoreButton({ size = 'default', iconOnly = false, ...props }: RestartCoreButtonProps) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: restartCore,
    onSuccess: (data) => {
      toast.success(data.message || '重启指令已发送');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`重启失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setOpen(false);
    },
  });

  const handleRestart = (e: React.MouseEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  // 当 iconOnly 为 true 时，使用 icon size
  const buttonSize = iconOnly ? 'icon' : size;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={buttonSize} disabled={mutation.isPending} {...props}>
          {mutation.isPending ? (
            <Loader2 className={iconOnly ? "h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"} />
          ) : (
              <RotateCw className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          )}
          {!iconOnly && (mutation.isPending ? '重启中...' : '重新启动')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要重启程序吗？</AlertDialogTitle>
          <AlertDialogDescription>
            重启程序可能会导致正在执行的任务中断，重启过程需要几秒钟。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestart} disabled={mutation.isPending}>
            {mutation.isPending ? '提交中...' : '确认重启'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

