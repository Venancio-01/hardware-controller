import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Cpu, Tag, Zap, CheckCircle2, XCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ConfigFormValues } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface DeviceConfigCardProps {
  form: UseFormReturn<ConfigFormValues>;
}

export function DeviceConfigCard({ form }: DeviceConfigCardProps) {
  const getFieldState = (fieldName: keyof ConfigFormValues) => {
    const fieldState = form.getFieldState(fieldName);
    const value = form.watch(fieldName);
    if (value === "" || value === undefined) return "empty";
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
          <Cpu className="h-5 w-5" />
          设备配置
        </CardTitle>
        <CardDescription>
          配置设备标识和继电器参数
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 设备 ID */}
          <FormField
            control={form.control}
            name="deviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  设备 ID
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="device-001" 
                      className={cn(getInputClassName("deviceId"), "pr-10")}
                      {...field} 
                    />
                    <ValidationIcon fieldName="deviceId" />
                  </div>
                </FormControl>
                <FormDescription>设备唯一标识符</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 继电器索引 */}
          <FormField
            control={form.control}
            name="relayIndex"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  继电器索引
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="number"
                      placeholder="0" 
                      className={cn(getInputClassName("relayIndex"), "pr-10")}
                      {...field} 
                    />
                    <ValidationIcon fieldName="relayIndex" />
                  </div>
                </FormControl>
                <FormDescription>继电器通道索引（0-255）</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
