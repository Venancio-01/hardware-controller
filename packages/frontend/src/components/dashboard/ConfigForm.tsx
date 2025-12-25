import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, type Config } from "shared";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AppConfigCard } from "./AppConfigCard";
import { Save, Loader2, Circle, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUpdateConfig } from "@/hooks/useUpdateConfig";

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

  const handleSubmit = (values: Config) => {
    mutate(values, {
      onSuccess: (data) => {
        // Reset form with new values to clear isDirty state
        form.reset(values);
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
        <Alert variant="default" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Saved</AlertTitle>
          <AlertDescription>
            配置已保存，需要重启系统才能生效。
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 应用程序配置卡片 */}
          <AppConfigCard form={form} />

          {/* 操作按钮区域 */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isDirty && (
                <>
                  <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                  <span>配置已修改，尚未保存</span>
                </>
              )}
            </div>

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
        </form>
      </Form>
    </div>
  );
}
