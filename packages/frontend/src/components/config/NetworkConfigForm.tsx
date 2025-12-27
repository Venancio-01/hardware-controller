import { UseFormReturn } from 'react-hook-form';
import { type Config } from 'shared';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Wifi } from 'lucide-react';
import { useTestConnection } from '@/hooks/useTestConnection';
import { useCheckConflict } from '@/hooks/useCheckConflict';
import { toast } from 'sonner';
import { getValidationIcon } from '@/components/ui/ValidationIcon';

interface NetworkConfigFormProps {
  form: UseFormReturn<Config>; // 使用父表单的实例
}

export function NetworkConfigForm({ form }: NetworkConfigFormProps) {
  // 验证图标辅助函数

  // 验证图标辅助函数
  const renderValidationIcon = (
    fieldName: keyof Config
  ) => {
    return getValidationIcon(form, fieldName);
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="h-5 w-5 text-muted-foreground" />
          网络配置
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP 地址</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="192.168.1.100" {...field} />
                    </FormControl>
                    {renderValidationIcon("ipAddress")}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subnetMask"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>子网掩码</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="255.255.255.0" {...field} />
                    </FormControl>
                    {renderValidationIcon("subnetMask")}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gateway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网关</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input placeholder="192.168.1.1" {...field} />
                    </FormControl>
                    {renderValidationIcon("gateway")}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>端口</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="8080"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    {renderValidationIcon("port")}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>



          {/* 冲突检测和连接测试按钮 */}
          <div className="pt-4 border-t space-y-3">
            <CheckConflictButton form={form} />
            <TestConnectionButton form={form} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CheckConflictButtonProps {
  form: UseFormReturn<Config>;
}

function CheckConflictButton({ form }: CheckConflictButtonProps) {
  const { mutate, isPending } = useCheckConflict();

  const handleCheckConflict = () => {
    const formData = form.getValues();

    const conflictRequest = {
      config: formData,
      checkTypes: ['all'] as any,
      timeout: 5000,
    };

    mutate(conflictRequest, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('配置冲突检测通过', {
            description: '未检测到配置冲突，可以安全保存',
          });
        } else {
          const failedChecks = result.failedChecks?.map(check => check.error).join(', ');
          toast.error('检测到配置冲突', {
            description: failedChecks || '配置存在冲突，请检查',
          });
        }
      },
      onError: (error) => {
        toast.error('冲突检测失败', {
          description: error.message || '请检查网络连接',
        });
      },
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCheckConflict}
      disabled={isPending || !form.formState.isValid}
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          检测中...
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 mr-2" />
          检查冲突
        </>
      )}
    </Button>
  );
}

interface TestConnectionButtonProps {
  form: UseFormReturn<Config>;
}

function TestConnectionButton({ form }: TestConnectionButtonProps) {
  const { mutate, isPending } = useTestConnection();

  const handleTestConnection = () => {
    // 获取当前表单值
    const formData = form.getValues();

    // 准备测试请求对象
    const testRequest = {
      ipAddress: formData.ipAddress,
      port: formData.port,
      protocol: 'tcp' as const, // 默认使用 TCP 协议
      timeout: 5000, // 5秒超时
    };

    // 执行连接测试
    mutate(testRequest, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(`连接测试成功！延迟: ${result.latency}ms`, {
            description: `成功连接到 ${result.target}`,
          });
        } else {
          toast.error('连接测试失败', {
            description: result.error || '未知错误',
          });
        }
      },
      onError: (error) => {
        toast.error('连接测试请求失败', {
          description: error.message || '请检查网络连接',
        });
      },
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleTestConnection}
      disabled={isPending || !form.formState.isValid}
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          测试中...
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 mr-2" />
          测试连接
        </>
      )}
    </Button>
  );
}
