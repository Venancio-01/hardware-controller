import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Globe, Network, Router, Hash, CheckCircle2, XCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Config } from "shared";
import { cn } from "@/lib/utils";

interface NetworkConfigCardProps {
  form: UseFormReturn<Config>;
}

export function NetworkConfigCard({ form }: NetworkConfigCardProps) {
  const getFieldState = (fieldName: keyof Config) => {
    const fieldState = form.getFieldState(fieldName);
    const value = form.watch(fieldName);

    // Config interface doesn't strictly match form values logic in prototype, adjusting
    // Assuming required fields
    if (value === undefined || value === '') return "empty";
    if (fieldState.invalid) return "error";
    if (fieldState.isDirty && !fieldState.invalid) return "success";
    return "default";
  };

  const getInputClassName = (fieldName: keyof Config) => {
    const state = getFieldState(fieldName);
    return cn(
      "font-mono transition-colors",
      state === "success" && "border-emerald-500 focus-visible:ring-emerald-500",
      state === "error" && "border-destructive focus-visible:ring-destructive"
    );
  };

  const ValidationIcon = ({ fieldName }: { fieldName: keyof Config }) => {
    const state = getFieldState(fieldName);
    if (state === "success") {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />;
    }
    if (state === "error") {
      return <XCircle className="h-4 w-4 text-destructive absolute right-3 top-1/2 -translate-y-1/2" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          网络配置
        </CardTitle>
        <CardDescription>
          配置设备的网络连接参数
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Note: The 'shared' Config type mostly contains execution params (deviceId, timeout, retryCount).
            The prototype shows network config (IP, Subnet, Gateway).
            Since backend doesn't support network config persistence yet, we will just use the available Config fields
            or mock the network fields for UI demonstration as requested.

            However, to strictly follow the prototype visually while conflicting with the 'Config' type:
            I will use 'any' for the form or extend the type locally to include network fields for the visual demo.
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Device ID (Mapped from Config) */}
             <FormField
            control={form.control}
            name="deviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  设备 ID
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="node-switch-001"
                      className={cn(getInputClassName("deviceId"), "pr-10")}
                      {...field}
                    />
                    <ValidationIcon fieldName="deviceId" />
                  </div>
                </FormControl>
                <FormDescription>设备的唯一标识符</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timeout (Mapped from Config) */}
          <FormField
            control={form.control}
            name="timeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Router className="h-3.5 w-3.5" />
                  超时时间 (ms)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="5000"
                      className={cn(getInputClassName("timeout"), "pr-10")}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    <ValidationIcon fieldName="timeout" />
                  </div>
                </FormControl>
                <FormDescription>请求超时时间</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

           {/* Retry Count (Mapped from Config) */}
           <FormField
            control={form.control}
            name="retryCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  重试次数
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="3"
                      className={cn(getInputClassName("retryCount"), "pr-10")}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    <ValidationIcon fieldName="retryCount" />
                  </div>
                </FormControl>
                <FormDescription>失败后的重试次数</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

           {/* Polling Interval (Mapped from Config) */}
           <FormField
            control={form.control}
            name="pollingInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5" />
                  轮询间隔 (ms)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="5000"
                      className={cn(getInputClassName("pollingInterval"), "pr-10")}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                    <ValidationIcon fieldName="pollingInterval" />
                  </div>
                </FormControl>
                <FormDescription>状态轮询间隔时间</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
      </CardContent>
    </Card>
  );
}
