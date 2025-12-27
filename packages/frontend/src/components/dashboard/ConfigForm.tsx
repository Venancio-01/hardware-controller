import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, type Config } from "shared";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AppConfigCard } from "./AppConfigCard";
import { NetworkConfigForm } from "@/components/config/NetworkConfigForm";
import { RestartButton } from "@/components/system/RestartButton";
import { Save, Loader2, Circle, AlertCircle, Download, Upload } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUpdateConfig } from "@/hooks/useUpdateConfig";
import { useImportExportConfig } from "@/hooks/useImportExportConfig";

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

  const form = useForm<Config>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      deviceId: '',
      timeout: 3000,
      retryCount: 3,
      pollingInterval: 5000,
      ipAddress: '',
      subnetMask: '',
      gateway: '',
      port: 80,
      dns: [],
    },
    mode: "onChange",
  });

  // Update form values when config is loaded
  useEffect(() => {
    if (config) {
      form.reset(config);
    }
  }, [config, form]);

  const { isDirty, isValid } = form.formState;

  const { mutate, isPending, needsRestart } = useUpdateConfig();

  // 导入/导出功能
  const { handleExport, handleImport } = useImportExportConfig({
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
    mutate(mergedValues, {
      onSuccess: (data) => {
        // Reset form with new values to clear isDirty state
        form.reset(mergedValues);
      }
    });
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
          <RestartButton />
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 应用程序配置卡片 */}
          <AppConfigCard form={form} />

          {/* 网络配置卡片 */}
          <NetworkConfigForm form={form} />

          {/* 操作按钮区域 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isDirty && (
                <>
                  <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                  <span>配置已修改，尚未保存</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                导出配置
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleImport}
              >
                <Upload className="h-4 w-4 mr-2" />
                导入配置
              </Button>

              <RestartButton disabled={isPending} />
              <Button
                type="submit"
                disabled={isPending || !isValid || !isDirty}
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    保存配置
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
