/**
 * 网络配置表单组件
 *
 * 子组件，由 ConfigForm 统一管理状态
 * 展示网络配置字段 (network.ipAddress, etc.)
 */

import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi } from 'lucide-react';

interface NetworkConfigFormProps {
  form: UseFormReturn<any>;
}

/**
 * 网络配置表单组件
 * 作为 ConfigForm 的一部分，不独立处理提交
 */
export function NetworkConfigForm({ form }: NetworkConfigFormProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="h-5 w-5 text-muted-foreground" />
          网络配置
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="network.ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP 地址</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="network.subnetMask"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>子网掩码</FormLabel>
                  <FormControl>
                    <Input placeholder="255.255.255.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="network.gateway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网关</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
