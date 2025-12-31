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
import { Combobox } from '@/components/ui/combobox';
import { useSerialPorts } from '@/hooks/use-serial-ports';

interface ControlCabinetConfigFormProps {
  form: UseFormReturn<Config>;
}

// 常用波特率选项
const BAUDRATE_OPTIONS = [
  { value: 9600, label: '9600' },
  { value: 19200, label: '19200' },
  { value: 38400, label: '38400' },
  { value: 57600, label: '57600' },
  { value: 115200, label: '115200' },
] as const;

export function ControlCabinetConfigForm({ form }: ControlCabinetConfigFormProps) {
  const { data: serialPorts = [] } = useSerialPorts();

  const serialPortOptions = serialPorts.map(port => ({
    value: port.path,
    label: port.pnpId ? `${port.path} (${port.pnpId})` : port.path,
  }));

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-md border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cpu className="h-5 w-5 text-muted-foreground" />
          控制柜配置
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full flex flex-col">
        <div className="space-y-4 flex-1">
          {/* 控制端串口配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <HardDrive className="h-4 w-4" />
              串口配置
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="CONTROL_SERIAL_PATH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>串口路径</FormLabel>
                    <FormControl>
                      <Combobox
                        value={field.value}
                        onChange={field.onChange}
                        options={serialPortOptions}
                        placeholder="选择或输入串口路径"
                        emptyText="未找到相关串口"
                        mode="input"
                        hideSearch={true}
                      />
                    </FormControl>
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
                        <SelectTrigger className="w-full">
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


            </div>
          </div>

          {/* 控制端语音播报配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
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
