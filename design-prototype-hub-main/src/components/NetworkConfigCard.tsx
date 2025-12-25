import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Globe, Network, Router, Hash, CheckCircle2, XCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ConfigFormValues } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface NetworkConfigCardProps {
  form: UseFormReturn<ConfigFormValues>;
}

export function NetworkConfigCard({ form }: NetworkConfigCardProps) {
  const getFieldState = (fieldName: keyof ConfigFormValues) => {
    const fieldState = form.getFieldState(fieldName);
    const value = form.watch(fieldName);
    if (!value) return "empty";
    if (fieldState.invalid) return "error";
    if (fieldState.isDirty && !fieldState.invalid) return "success";
    return "default";
  };

  const getInputClassName = (fieldName: keyof ConfigFormValues) => {
    const state = getFieldState(fieldName);
    return cn(
      "font-mono transition-colors",
      state === "success" && "border-emerald-500 focus-visible:ring-emerald-500",
      state === "error" && "border-destructive focus-visible:ring-destructive"
    );
  };

  const ValidationIcon = ({ fieldName }: { fieldName: keyof ConfigFormValues }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IP 地址 */}
          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  IP 地址
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="192.168.1.100" 
                      className={cn(getInputClassName("ipAddress"), "pr-10")}
                      {...field} 
                    />
                    <ValidationIcon fieldName="ipAddress" />
                  </div>
                </FormControl>
                <FormDescription>设备的 IPv4 地址</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 子网掩码 */}
          <FormField
            control={form.control}
            name="subnetMask"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5" />
                  子网掩码
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="255.255.255.0" 
                      className={cn(getInputClassName("subnetMask"), "pr-10")}
                      {...field} 
                    />
                    <ValidationIcon fieldName="subnetMask" />
                  </div>
                </FormControl>
                <FormDescription>网络子网掩码</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 网关地址 */}
          <FormField
            control={form.control}
            name="gateway"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Router className="h-3.5 w-3.5" />
                  网关地址
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="192.168.1.1" 
                      className={cn(getInputClassName("gateway"), "pr-10")}
                      {...field} 
                    />
                    <ValidationIcon fieldName="gateway" />
                  </div>
                </FormControl>
                <FormDescription>默认网关 IP 地址</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 端口号 */}
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  端口号
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="8080" 
                      className={cn(getInputClassName("port"), "pr-10")}
                      {...field} 
                    />
                    <ValidationIcon fieldName="port" />
                  </div>
                </FormControl>
                <FormDescription>通信端口（1-65535）</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
