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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, HardDrive, Volume2 } from 'lucide-react';

interface AmmoCabinetConfigFormProps {
  form: UseFormReturn<Config>;
}

/**
 * 供弹柜配置表单组件
 *
 * 包含供弹柜 TCP 连接配置和供弹柜语音播报配置
 */
export function AmmoCabinetConfigForm({ form }: AmmoCabinetConfigFormProps) {
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-md border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Archive className="h-5 w-5 text-muted-foreground" />
          供弹柜配置
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full flex flex-col">
        <div className="space-y-4 flex-1">
          {/* 供弹柜 TCP 连接配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <HardDrive className="h-4 w-4" />
              TCP 配置
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="CABINET_HOST"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP 地址</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="CABINET_PORT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>端口</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        min={1}
                        max={65535}
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

          {/* 供弹柜语音播报配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4" />
              语音播报
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="VOICE_CABINET_VOLUME"
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
                name="VOICE_CABINET_SPEED"
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
