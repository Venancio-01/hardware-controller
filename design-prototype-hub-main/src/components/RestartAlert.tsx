import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RestartAlertProps {
  onRestart: () => void;
  onDismiss: () => void;
}

export function RestartAlert({ onRestart, onDismiss }: RestartAlertProps) {
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = async () => {
    setIsRestarting(true);
    
    // 模拟重启过程
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    toast.success("系统重启完成", {
      description: "配置已生效，设备正常运行",
    });
    
    setIsRestarting(false);
    onRestart();
    onDismiss();
  };

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">需要重启系统</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <p className="mb-3">配置已保存，但需要重启系统才能生效。点击下方按钮立即重启，或稍后手动重启。</p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleRestart}
            disabled={isRestarting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isRestarting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                重启中...
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                立即重启
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDismiss}
            disabled={isRestarting}
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            稍后重启
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
