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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, HardDrive, Volume2 } from 'lucide-react';
import { getValidationIcon } from '@/components/ui/ValidationIcon';

interface ControlCabinetConfigFormProps {
  form: UseFormReturn<Config>;
}

// 奇偶校验选项
const PARITY_OPTIONS = [
  { value: 'none', label: '无 (None)' },
  { value: 'even', label: '偶校验 (Even)' },
  { value: 'odd', label: '奇校验 (Odd)' },
  { value: 'mark', label: '标记 (Mark)' },
  { value: 'space', label: '空格 (Space)' },
] as const;

// 数据位选项
const DATABITS_OPTIONS = [
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
] as const;

// 停止位选项
const STOPBITS_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
] as const;

// 常用波特率选项
const BAUDRATE_OPTIONS = [
  { value: 9600, label: '9600' },
  { value: 19200, label: '19200' },
  { value: 38400, label: '38400' },
  { value: 57600, label: '57600' },
  { value: 115200, label: '115200' },
] as const;

/**
 * 控制柜配置表单组件
 *
 * 包含控制端串口配置和控制端语音播报配置
 */
export function ControlCabinetConfigForm({ form }: ControlCabinetConfigFormProps) {
  // 验证图标辅助函数
  const renderValidationIcon = (fieldName: keyof Config) => {
    return getValidationIcon(form, fieldName);
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cpu className="h-5 w-5 text-muted-foreground" />
          控制柜配置
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 控制端串口配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
              <HardDrive className="h-4 w-4" />
              控制端串口
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="CONTROL_SERIAL_PATH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>串口路径</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="/dev/ttyUSB0" {...field} />
                      </FormControl>
                      {renderValidationIcon("CONTROL_SERIAL_PATH")}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="CONTROL_SERIAL_BAUDRATE"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>波特率</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value: string) => field.onChange(parseInt(value, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择波特率" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BAUDRATE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="CONTROL_SERIAL_DATABITS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数据位</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value: string) => field.onChange(parseInt(value, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择数据位" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATABITS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="CONTROL_SERIAL_STOPBITS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>停止位</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value: string) => field.onChange(parseInt(value, 10))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择停止位" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STOPBITS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="CONTROL_SERIAL_PARITY"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>奇偶校验</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择校验方式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PARITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 控制端语音播报配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
              <Volume2 className="h-4 w-4" />
              语音播报
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="VOICE_CONTROL_VOLUME"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>音量 (0-10)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      {renderValidationIcon("VOICE_CONTROL_VOLUME")}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="VOICE_CONTROL_SPEED"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>语速 (0-10)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      {renderValidationIcon("VOICE_CONTROL_SPEED")}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
