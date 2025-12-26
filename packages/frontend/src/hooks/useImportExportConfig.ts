/**
 * 配置导入/导出 Hook
 *
 * 提供配置导入/导出功能的自定义 Hook
 */

import { useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Config, configSchema } from 'shared';
import { exportConfig as exportConfigApi, importConfig as importConfigApi } from '@/services/config-api';
import { toast } from 'sonner';

export interface UseImportExportConfigProps {
  form: UseFormReturn<Config>;
  onConfigUpdate?: (config: Config) => void;
}

export interface UseImportExportConfigReturn {
  handleExport: () => void;
  handleImport: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function useImportExportConfig({
  form,
  onConfigUpdate
}: UseImportExportConfigProps): UseImportExportConfigReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleExport = useCallback(async () => {
    try {
      await exportConfigApi();
      toast.success('配置导出成功', {
        description: '配置文件已下载到您的设备',
      });
    } catch (error: unknown) {
      console.error('导出配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('配置导出失败', {
        description: errorMessage || '请重试',
      });
    }
  }, []);

  const handleImport = useCallback(async () => {
    try {
      // 创建一个隐藏的文件输入元素
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';

      input.onchange = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
          // 读取文件内容
          const fileContent = await file.text();
          const configData = JSON.parse(fileContent);

          // 使用共享的 Zod schema 验证配置
          const validationResult = configSchema.safeParse(configData);
          if (!validationResult.success) {
            const errorMessages = validationResult.error.issues
              .map(issue => `${issue.path.join('.')}: ${issue.message}`)
              .join(', ');
            throw new Error(`配置文件格式无效: ${errorMessages}`);
          }

          // 调用后端导入API (后端会再次验证)
          const result = await importConfigApi(validationResult.data);

          // 更新表单值
          form.reset(result);

          // 使 TanStack Query 缓存失效,确保下次获取最新配置
          queryClient.invalidateQueries({ queryKey: ['config'] });

          // 如果提供了回调函数，调用它
          if (onConfigUpdate) {
            onConfigUpdate(result);
          }

          toast.success('配置导入成功', {
            description: '配置已应用到表单，请保存配置并重启系统使更改生效',
          });
        } catch (error: unknown) {
          console.error('导入配置失败:', error);
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          toast.error('配置导入失败', {
            description: errorMessage || '请检查配置文件格式',
          });
        }
      };

      // 触发文件选择
      input.click();
    } catch (error: unknown) {
      console.error('导入配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('配置导入失败', {
        description: errorMessage || '请重试',
      });
    }
  }, [form, onConfigUpdate, queryClient]);

  return {
    handleExport,
    handleImport,
    fileInputRef,
  };
}