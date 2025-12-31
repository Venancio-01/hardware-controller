import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, type Config, networkConfigSchema, type NetworkConfig } from "shared";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AppConfigCard } from "./AppConfigCard";
import { NetworkConfigForm } from "@/components/config/NetworkConfigForm";
import { ControlCabinetConfigForm } from "@/components/config/ControlCabinetConfigForm";
import { AmmoCabinetConfigForm } from "@/components/config/AmmoCabinetConfigForm";
import { Save, Loader2, Circle, AlertCircle, AlertTriangle, RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
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
import { Card, CardHeader, CardContent } from "../ui/card";
import { z } from "zod";
import { useApplyNetwork, useGetNetworkConfig } from "@/hooks/useApplyNetwork";
import { toast } from "sonner";

// 定义联合 Schema，包含 Config 和 NetworkConfig
const unifiedSchema = configSchema.and(z.object({
  network: networkConfigSchema.omit({ port: true }).optional()
}));

type UnifiedConfig = z.infer<typeof unifiedSchema>;

export const mergeConfigValues = (
  baseConfig: Config | undefined,
  formData: UnifiedConfig,
  submittedValues: UnifiedConfig
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

  const { mutate: getNetworkConfig } = useGetNetworkConfig();
  const { mutateAsync: applyNetworkAsync, isPending: isApplyingNetwork } = useApplyNetwork();

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Network warning state
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [pendingSaveValues, setPendingSaveValues] = useState<UnifiedConfig | null>(null);

  // Track if form has been initialized with server config
  const [initialized, setInitialized] = useState(false);
  const [networkInitialized, setNetworkInitialized] = useState(false);



  const form = useForm<UnifiedConfig>({
    resolver: zodResolver(unifiedSchema) as any,
    // 默认值用于表单初始化，确保通过 Zod 验证
    // 实际配置将从服务器加载后覆盖这些值
    defaultValues: {
      deviceId: 'device-001', // 占位符
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      // 文件配置默认值
      CABINET_HOST: '192.168.0.18',
      CABINET_PORT: 50000,
      CONTROL_SERIAL_PATH: '/dev/ttyUSB0',
      CONTROL_SERIAL_BAUDRATE: 9600,
      CONTROL_SERIAL_DATABITS: 8,
      CONTROL_SERIAL_STOPBITS: 1,
      CONTROL_SERIAL_PARITY: 'none',
      VOICE_CABINET_VOLUME: 1,
      VOICE_CABINET_SPEED: 5,
      VOICE_CONTROL_VOLUME: 1,
      VOICE_CONTROL_SPEED: 5,
      // Network defaults
      network: {
        ipAddress: '192.168.1.100',
        subnetMask: '255.255.255.0',
        gateway: '192.168.1.1',
      }
    },
    mode: "onChange",
  });

  // Update form values when config is loaded
  useEffect(() => {
    if (config && !initialized) {
      // 保留当前的 network 值（如果有的话），避免覆盖
      const currentNetwork = form.getValues().network;
      form.reset({ ...config, network: currentNetwork });
      setInitialized(true);
    }
  }, [config, form, initialized]);

  // Load Network Config independently
  useEffect(() => {
    if (!networkInitialized) {
      getNetworkConfig(undefined, {
        onSuccess: (data) => {
          const currentValues = form.getValues();
          // 如果 network 字段尚未被用户修改（dirty check?），则更新
          // 这里简单起见直接合并更新
          form.reset({ ...currentValues, network: data });
          setNetworkInitialized(true);
        },
        onError: (e) => {
          console.error("Failed to load network config", e);
        }
      });
    }
  }, [networkInitialized, getNetworkConfig, form]);


  const { isDirty, isValid } = form.formState;

  const { mutate, mutateAsync: saveConfigAsync, isPending: isSavingConfig, showRestartConfirm, isRestarting, confirmRestart, cancelRestart } = useUpdateConfig();

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
    form: form as any, // Cast to any to bypass strict Config type check
    onConfigUpdate: (newConfig) => {
      // 配置更新后可能需要提示重启
    }
  });

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // 从后端获取系统默认配置
      const defaults = await apiFetch<Config>('/api/config/defaults');
      // Reset config but keep network or reset network?
      // Tech spec says restore system defaults. Assuming network defaults are not in /api/config/defaults
      // We might need to fetch default network config if API supported calls like that.
      // For now, reset core config only.
      const currentNetwork = form.getValues().network;
      form.reset({ ...defaults, network: currentNetwork });
      setShowResetConfirm(false);
    } catch (error) {
      console.error("Failed to load default config:", error);
      // Fallback
      try {
        const schemaDefaults = configSchema.parse({});
        const currentNetwork = form.getValues().network;
        form.reset({ ...schemaDefaults, network: currentNetwork });
        setShowResetConfirm(false);
      } catch (e) {
        console.error("Fallback reset failed:", e);
      }
    }
  };

  const handleSubmit = (values: UnifiedConfig) => {
    const formData = form.getValues();
    const mergedValues = mergeConfigValues(config, formData, values);

    // Check if network is dirty
    const dirtyFields = form.formState.dirtyFields;
    const isNetworkDirty = !!dirtyFields.network;

    if (isNetworkDirty) {
      setPendingSaveValues(mergedValues);
      setShowNetworkWarning(true);
    } else {
      doSubmit(mergedValues);
    }
  };

  const doSubmit = (values: UnifiedConfig) => {
    // Strip network before saving hardware config
    const { network, ...hardwareConfig } = values;

    // Save hardware config
    mutate(hardwareConfig as Config, {
      onSuccess: (data) => {
        // Reset form with new values to clear isDirty state
        // 需要把 network 放回去，否则表单里的 network 会丢失
        form.reset({ ...hardwareConfig as Config, network: values.network });
      },
      onError: (error) => {
        handleSaveError(error);
      }
    });
  };

  const handleConfirmedNetworkSave = async () => {
    if (!pendingSaveValues || !pendingSaveValues.network) return;

    setShowNetworkWarning(false);

    const { network, ...hardwareConfig } = pendingSaveValues;

    try {
      // 1. Save Hardware Config
      // 我们使用 mutateAsync 来确保顺序
      await saveConfigAsync(hardwareConfig as Config);

      // 2. Apply Network Config
      await applyNetworkAsync(network as NetworkConfig);

      // 3. Redirect
      toast.success("网络配置已保存，正在跳转...", { duration: 5000 });

      // 等待一点时间让 toast 显示，然后跳转
      setTimeout(() => {
        const newIp = network.ipAddress || 'localhost';
        window.location.href = `http://${newIp}:3000`;
      }, 1000);

    } catch (error) {
      console.error("Save sequence failed", error);
      handleSaveError(error);
    }
  };

  const handleSaveError = (error: unknown) => {
    if (error instanceof ApiError) {
      const validationErrors = error.validationErrors;
      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          const errorMessage = Array.isArray(messages) ? messages[0] : messages;
          form.setError(field as any, {
            type: 'server',
            message: errorMessage,
          });
        });
      }
    }
    // Toast errors are handled by query mutations (onError) generally,
    // but inside try/catch of handleConfirmedNetworkSave, we might need manual toast if mutateAsync throws
    // Actually useUpdateConfig's onError handles Toast. useApplyNetwork's onError logs.
    // We might want to add Toast to useApplyNetwork or here.
    if (!(error instanceof ApiError)) {
      toast.error("保存失败: " + (error instanceof Error ? error.message : "未知错误"));
    }
  }

  const isPending = isSavingConfig || isApplyingNetwork;

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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 控制柜和供弹柜配置卡片 - 响应式水平布局 */}
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* 控制柜配置卡片 */}
            <div className="flex-1">
              {isLoading ? (
                <Card className="h-full border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ControlCabinetConfigForm form={form as any} />
              )}
            </div>

            {/* 供弹柜配置卡片 */}
            <div className="flex-1">
              {isLoading ? (
                <Card className="h-full border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AmmoCabinetConfigForm form={form as any} />
              )}
            </div>
          </div>

          {/* 网络配置卡片 */}
          {isLoading ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
              <NetworkConfigForm form={form} />
          )}
        </form>
      </Form>


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

      {/* 网络变更风险警告对话框 */}
      <AlertDialog open={showNetworkWarning} onOpenChange={setShowNetworkWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              网络配置变更警告
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-foreground">
                检测到您修改了网络配置 (IP/子网/网关)。
              </p>
              <p>
                应用这些更改可能会导致当前连接断开。
                保存成功后，系统将自动跳转到新的 IP 地址:
                <br />
                <code className="bg-muted px-1 py-0.5 rounded text-primary">
                  http://{pendingSaveValues?.network?.ipAddress || '...'}:3000
                </code>
              </p>
              <p className="text-sm text-muted-foreground">
                请确保您已记录新的 IP 地址，以防自动跳转失败。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedNetworkSave}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              确认修改并跳转
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

        {/* 按钮组 */}
        <div className="flex items-center gap-1">
          {/* 重置默认配置 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowResetConfirm(true)}
                aria-label="重置默认配置"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>重置默认配置</p>
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
        </div>
      </HeaderActionsPortal>

      {/* 重置确认对话框 */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              确认重置配置
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将所有配置项恢复为系统默认值。
              <br />
              未保存的更改将会丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重启确认对话框 */}
      <AlertDialog open={showRestartConfirm} onOpenChange={(open) => !open && cancelRestart()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-blue-500" />
              配置已保存
            </AlertDialogTitle>
            <AlertDialogDescription>
              配置已成功保存，需要重启系统才能生效。
              <br />
              是否立即重启？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestarting}>稍后重启</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestart} disabled={isRestarting}>
              {isRestarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  重启中...
                </>
              ) : (
                '立即重启'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

