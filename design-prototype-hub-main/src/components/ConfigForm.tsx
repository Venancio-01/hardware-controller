import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, ConfigFormValues } from "@/lib/validation";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { NetworkConfigCard } from "./NetworkConfigCard";
import { DeviceConfigCard } from "./DeviceConfigCard";
import { RestartAlert } from "./RestartAlert";
import { Save, Loader2, Circle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ConfigFormProps {
  defaultValues: ConfigFormValues;
  onSave: (values: ConfigFormValues) => Promise<void>;
}

export function ConfigForm({ defaultValues, onSave }: ConfigFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showRestartAlert, setShowRestartAlert] = useState(false);
  
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues,
    mode: "onChange",
  });

  const { isDirty, isValid } = form.formState;

  const handleSubmit = async (values: ConfigFormValues) => {
    setIsSaving(true);
    
    try {
      await onSave(values);
      
      toast.success("配置已保存", {
        description: "需要重启系统才能生效",
      });
      
      setShowRestartAlert(true);
      form.reset(values);
    } catch (error) {
      toast.error("保存失败", {
        description: "请检查网络连接后重试",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestart = () => {
    // 重启后重新加载配置
    form.reset(form.getValues());
  };

  return (
    <div className="space-y-6">
      {/* 重启提醒 Alert */}
      {showRestartAlert && (
        <RestartAlert 
          onRestart={handleRestart}
          onDismiss={() => setShowRestartAlert(false)}
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* 网络配置卡片 */}
          <NetworkConfigCard form={form} />

          {/* 设备配置卡片 */}
          <DeviceConfigCard form={form} />

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
              disabled={isSaving || !isValid || !isDirty}
              size="lg"
            >
              {isSaving ? (
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
