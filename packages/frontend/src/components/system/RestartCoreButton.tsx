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

export function RestartCoreButton() {
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

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="mr-2 h-4 w-4" />
          )}
          重启 Core
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要重启硬件控制服务吗？</AlertDialogTitle>
          <AlertDialogDescription>
            正在执行的任务可能会中断，重启过程需要几秒钟。
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
