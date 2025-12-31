/**
 * 配置导入/导出 Hook
 *
 * 提供配置导入/导出功能的自定义 Hook
 */

import { useCallback, useState, useRef } from 'react';
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
  confirmImport: () => void;
  cancelImport: () => void;
  pendingConfig: Config | null;
  isExporting: boolean;
  isImporting: boolean;
}

export function useImportExportConfig({
  form,
  onConfigUpdate
}: UseImportExportConfigProps): UseImportExportConfigReturn {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [pendingConfig, setPendingConfig] = useState<Config | null>(null);

  // 使用 useRef 持久化 file input 元素，避免每次创建新元素导致内存泄漏
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  }, []);

  const selectImportFile = useCallback(() => {
    try {
      // 复用已存在的 input 元素，或创建新的
      if (!fileInputRef.current) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.className = 'hidden'; // 隐藏元素

        // 使用正确的类型注解替代 any
        input.onchange = async (event: Event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
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

            // 设置待确认的配置
            setPendingConfig(validationResult.data);

          } catch (error: unknown) {
            console.error('读取配置失败:', error);
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            toast.error('读取配置失败', {
              description: errorMessage || '请检查配置文件格式',
            });
          }

          // 清除 input 的值，允许重复选择同一文件
          target.value = '';
        };

        fileInputRef.current = input;
        document.body.appendChild(input);
      }

      // 触发文件选择
      fileInputRef.current.click();
    } catch (error: unknown) {
      console.error('启动导入失败:', error);
      toast.error('启动导入失败');
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!pendingConfig) return;

    setIsImporting(true);
    try {
      // 调用后端导入API (后端会再次验证)
      const result = await importConfigApi(pendingConfig);

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

      // 清除待确认状态
      setPendingConfig(null);
    } catch (error: unknown) {
      console.error('导入配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('配置导入失败', {
        description: errorMessage || '请重试',
      });
    } finally {
      setIsImporting(false);
    }
  }, [pendingConfig, form, onConfigUpdate, queryClient]);

  const cancelImport = useCallback(() => {
    setPendingConfig(null);
  }, []);

  return {
    handleExport,
    handleImport: selectImportFile,
    confirmImport,
    cancelImport,
    pendingConfig,
    isExporting,
    isImporting,
  };
}
