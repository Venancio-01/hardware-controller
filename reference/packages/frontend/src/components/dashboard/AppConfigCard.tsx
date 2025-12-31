
import { type UseFormReturn } from "react-hook-form";
import { type Config } from "shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface AppConfigCardProps {
  form: UseFormReturn<Config>;
}

export function AppConfigCard({ form }: AppConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>应用程序配置</CardTitle>
        <CardDescription>
          管理设备的基础设置和运行参数
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {/* Device ID */}
        <FormField
          control={form.control}
          name="deviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>设备 ID</FormLabel>
              <FormControl>
                <Input placeholder="输入设备 ID..." {...field} />
              </FormControl>
              <FormDescription>
                设备的唯一识别代码
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Timeout */}
        <FormField
          control={form.control}
          name="timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>操作超时</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                单位: 毫秒,必须是整数 (1000 - 30000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Retry Count */}
        <FormField
          control={form.control}
          name="retryCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>重试次数</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                失败后的重试次数,必须是整数 (0 - 10)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Polling Interval */}
        <FormField
          control={form.control}
          name="pollingInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>轮询间隔</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                单位: 毫秒,必须是整数 (1000 - 60000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
