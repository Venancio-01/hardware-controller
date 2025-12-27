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
import { getValidationIcon } from '@/components/ui/ValidationIcon';

interface AmmoCabinetConfigFormProps {
  form: UseFormReturn<Config>;
}

/**
 * 供弹柜配置表单组件
 *
 * 包含供弹柜 TCP 连接配置和供弹柜语音播报配置
 */
export function AmmoCabinetConfigForm({ form }: AmmoCabinetConfigFormProps) {
  // 验证图标辅助函数
  const renderValidationIcon = (fieldName: keyof Config) => {
    return getValidationIcon(form, fieldName);
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Archive className="h-5 w-5 text-muted-foreground" />
          供弹柜配置
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 供弹柜 TCP 连接配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
              <HardDrive className="h-4 w-4" />
              TCP 连接
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="CABINET_HOST"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供弹柜 IP 地址</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="192.168.1.101" {...field} />
                      </FormControl>
                      {renderValidationIcon("CABINET_HOST")}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="CABINET_PORT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供弹柜端口</FormLabel>
                    <div className="relative">
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
                      {renderValidationIcon("CABINET_PORT")}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 供弹柜语音播报配置 */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
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
                      {renderValidationIcon("VOICE_CABINET_VOLUME")}
                    </div>
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
                      {renderValidationIcon("VOICE_CABINET_SPEED")}
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
