import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { networkConfigSchema, type NetworkConfig } from 'shared';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

interface NetworkConfigFormProps {
  defaultValues?: Partial<NetworkConfig>;
  onSubmit: (data: NetworkConfig) => void;
}

export function NetworkConfigForm({ defaultValues, onSubmit }: NetworkConfigFormProps) {
  const form = useForm<NetworkConfig>({
    resolver: zodResolver(networkConfigSchema),
    defaultValues: {
      ipAddress: '',
      subnetMask: '',
      gateway: '',
      port: 80,
      dns: [],
      ...defaultValues,
    },
    mode: 'onChange', // Enable real-time validation
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dns',
  });

  const handleSubmit = (data: NetworkConfig) => {
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>网络配置</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ipAddress"
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
                name="subnetMask"
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
                name="gateway"
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

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>端口</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="8080"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DNS Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>DNS 服务器 (可选)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append('8.8.8.8')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加 DNS
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`dns.${index}`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input placeholder="8.8.8.8" {...inputField} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Button type="submit" disabled={!form.formState.isValid}>
              保存配置
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
