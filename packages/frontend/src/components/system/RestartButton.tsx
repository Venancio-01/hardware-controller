import React from 'react';
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
} from '@/components/ui/alert-dialog';
import { RotateCcw, Loader2 } from 'lucide-react';
import { useRestartSystem } from '@/hooks/useRestartSystem';
import { toast } from 'sonner';

interface RestartButtonProps {
  disabled?: boolean;
}

export function RestartButton({ disabled = false }: RestartButtonProps) {
  const [open, setOpen] = React.useState(false);

  const { mutate, isPending } = useRestartSystem({
    onSuccess: () => {
      toast.success('系统重启已启动', {
        description: '系统将在稍后完成重启，请稍等片刻。',
      });
      setOpen(false);
    },
    onError: (error) => {
      toast.error('重启失败', {
        description: error.message || '系统重启请求失败',
      });
    }
  });

  const handleRestart = () => {
    mutate();
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={disabled || isPending}
        className="flex items-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            重启中...
          </>
        ) : (
          <>
            <RotateCcw className="h-4 w-4" />
            立即重启
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重启系统</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要重启系统吗？此操作将重新启动设备并应用所有配置更改。
              重启过程可能需要几分钟，请确保已保存所有配置。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  重启中...
                </>
              ) : (
                '确认重启'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}