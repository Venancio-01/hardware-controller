import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, type Config } from "shared";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AppConfigCard } from "./AppConfigCard";
import { NetworkConfigForm } from "@/components/config/NetworkConfigForm";
import { ControlCabinetConfigForm } from "@/components/config/ControlCabinetConfigForm";
import { AmmoCabinetConfigForm } from "@/components/config/AmmoCabinetConfigForm";
import { RestartCoreButton } from "@/components/system/RestartCoreButton";
import { Save, Loader2, Circle, AlertCircle, Download, Upload, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeaderActionsPortal } from "@/components/layout/HeaderActions";
import { useUpdateConfig } from "@/hooks/useUpdateConfig";
import { useImportExportConfig } from "@/hooks/useImportExportConfig";
import { ApiError } from "@/lib/errors";

export const mergeConfigValues = (
  baseConfig: Config | undefined,
  formData: Config,
  submittedValues: Config
) => ({
  ...baseConfig,
  ...formData,
  ...submittedValues,
});

export function ConfigForm() {
  // Fetch initial config
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['config'],
    queryFn: () => apiFetch<Config>('/api/config'),
  });

  // Network configuration warning dialog state
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [pendingValues, setPendingValues] = useState<Config | null>(null);

  // Track if form has been initialized with server config
  const [initialized, setInitialized] = useState(false);

  const form = useForm<Config>({
    resolver: zodResolver(configSchema),
    // 默认值用于表单初始化，确保通过 Zod 验证
    // 实际配置将从服务器加载后覆盖这些值
    // TODO: deviceId 应该使用唯一 ID 生成或让用户提供，当前使用占位符
    defaultValues: {
      deviceId: 'device-001', // 占位符，生产环境应使用唯一 ID 或由用户提供
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      // 网络配置默认值与 schema.default 保持一致
      // 注意：这些值仅用于初始验证，实际使用时应配置正确的网络参数
      ipAddress: '127.0.0.1',
      subnetMask: '255.255.255.0',
      gateway: '127.0.0.1',
      port: 80,
      // 柜体继电器板配置
      CABINET_HOST: '192.168.0.18',
      CABINET_PORT: 50000,
      // 控制端串口配置
      CONTROL_SERIAL_PATH: '/dev/ttyUSB0',
      CONTROL_SERIAL_BAUDRATE: 9600,
      CONTROL_SERIAL_DATABITS: 8,
      CONTROL_SERIAL_STOPBITS: 1,
      CONTROL_SERIAL_PARITY: 'none' as const,
      // 语音播报配置
      VOICE_CABINET_VOLUME: 1,
      VOICE_CABINET_SPEED: 5,
      VOICE_CONTROL_VOLUME: 1,
      VOICE_CONTROL_SPEED: 5,
    },
    mode: "onChange",
  });

  // Update form values when config is loaded (only once to prevent race conditions)
  useEffect(() => {
    if (config && !initialized) {
      form.reset(config);
      setInitialized(true);
    }
  }, [config, form, initialized]);

  const { isDirty, isValid } = form.formState;

  const { mutate, isPending, needsRestart } = useUpdateConfig();

  // 导入/导出功能
  const {
    handleExport,
    handleImport,
    confirmImport,
    cancelImport,
    pendingConfig,
    isExporting,
    isImporting
  } = useImportExportConfig({
    form,
    onConfigUpdate: (newConfig) => {
      // 配置更新后可能需要提示重启
      // 这里可以添加额外的处理逻辑
    }
  });

  const handleSubmit = (values: Config) => {
    // 确保使用表单中的所有值（包括可能被 NetworkConfigForm 更新的值）
    const formData = form.getValues();
    const mergedValues = mergeConfigValues(config, formData, values);

    // 检查网络配置是否更改
    const networkFieldsChanged = (
      config?.ipAddress !== mergedValues.ipAddress ||
      config?.subnetMask !== mergedValues.subnetMask ||
      config?.gateway !== mergedValues.gateway ||
      config?.port !== mergedValues.port
    );

    // 如果网络配置更改，显示警告对话框
    if (networkFieldsChanged) {
      setPendingValues(mergedValues);
      setShowNetworkWarning(true);
      return;
    }

    // 否则直接提交
    doSubmit(mergedValues);
  };

  const doSubmit = (values: Config) => {
    mutate(values, {
      onSuccess: (data) => {
        // Reset form with new values to clear isDirty state
        form.reset(values);
      },
      onError: (error) => {
        // 处理 ApiError 中的服务端验证错误
        if (error instanceof ApiError) {
          const validationErrors = error.validationErrors;
          if (validationErrors) {
            // 遍历验证错误并设置到表单字段
            Object.entries(validationErrors).forEach(([field, messages]) => {
              // 字段名可能是嵌套的，如 "network.ipAddress"
              // react-hook-form 的 setError 支持点表示法
              const errorMessage = Array.isArray(messages) ? messages[0] : messages;
              form.setError(field as any, {
                type: 'server',
                message: errorMessage,
              });
            });
          }
        }
        // 其他错误由 useUpdateConfig 的 onError 处理（Toast 提示）
      }
    });
  };

  const handleConfirmNetworkChange = () => {
    if (pendingValues) {
      doSubmit(pendingValues);
      setShowNetworkWarning(false);
      setPendingValues(null);
    }
  };

  const handleCancelNetworkChange = () => {
    setShowNetworkWarning(false);
    setPendingValues(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load configuration: {(error as Error).message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {needsRestart && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="mb-0">配置已保存</AlertTitle>
            </div>
            <AlertDescription>
              需要重启系统才能生效。
            </AlertDescription>
          </div>
          <RestartCoreButton />
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 应用程序配置卡片 */}
          {/* <AppConfigCard form={form} /> */}



          {/* 控制柜配置卡片 */}
          <ControlCabinetConfigForm form={form} />

          {/* 供弹柜配置卡片 */}
          <AmmoCabinetConfigForm form={form} />

          {/* 网络配置卡片 */}
          <NetworkConfigForm form={form} />
        </form>
      </Form>

      {/* 网络配置更改警告对话框 */}
      <AlertDialog open={showNetworkWarning} onOpenChange={setShowNetworkWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              确认更改网络配置
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                更改网络设置可能会中断您的连接。请确保以下配置值正确：
              </p>
              {pendingValues && (
                <ul className="list-disc list-inside text-sm space-y-1 mt-2 p-3 bg-muted rounded-md">
                  <li>IP 地址: <code className="font-mono">{pendingValues.ipAddress || '未设置'}</code></li>
                  <li>子网掩码: <code className="font-mono">{pendingValues.subnetMask || '未设置'}</code></li>
                  <li>网关: <code className="font-mono">{pendingValues.gateway || '未设置'}</code></li>
                  <li>端口: <code className="font-mono">{pendingValues.port}</code></li>
                </ul>
              )}
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ 保存后可能需要重新连接到新的网络地址。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNetworkChange}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNetworkChange}>
              确认保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导入确认对话框 */}
      <AlertDialog open={!!pendingConfig} onOpenChange={(open: boolean) => !open && cancelImport()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              确认导入配置
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                导入新配置将覆盖当前的所有设置。操作成功后，系统将自动重启。
              </p>
              {pendingConfig && (
                <ul className="list-disc list-inside text-sm space-y-1 mt-2 p-3 bg-muted rounded-md">
                  <li>设备 ID: <code className="font-mono">{pendingConfig.deviceId}</code></li>
                  <li>IP 地址: <code className="font-mono">{pendingConfig.ipAddress || '未设置'}</code></li>
                  <li>端口: <code className="font-mono">{pendingConfig.port}</code></li>
                </ul>
              )}
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ 确定要继续吗？
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              确认导入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header 操作按钮 - 通过 Portal 渲染到页面 header 中 */}
      <HeaderActionsPortal>
        {/* 配置修改状态提示 */}
        {isDirty && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium mr-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
            <Circle className="h-2 w-2 fill-current" />
            <span>配置已修改，尚未保存</span>
          </div>
        )}

        {/* 导出配置 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleExport}
              disabled={isExporting}
              aria-label="导出配置"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>导出配置</p>
          </TooltipContent>
        </Tooltip>

        {/* 导入配置 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleImport}
              disabled={isImporting}
              aria-label="导入配置"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>导入配置</p>
          </TooltipContent>
        </Tooltip>

        {/* 重启程序 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <RestartCoreButton iconOnly disabled={isPending} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>重启程序</p>
          </TooltipContent>
        </Tooltip>

        {/* 保存配置 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isDirty && isValid ? "default" : "ghost"}
              size="icon"
              onClick={() => form.handleSubmit(handleSubmit)()}
              disabled={isPending || !isValid || !isDirty}
              aria-label="保存配置"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isDirty ? "保存配置" : "无需保存"}</p>
          </TooltipContent>
        </Tooltip>
      </HeaderActionsPortal>
    </div>
  );
}

