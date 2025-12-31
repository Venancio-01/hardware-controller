import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, restartCore } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { type Config, type ConflictDetectionRequest, type ConflictDetectionResult } from 'shared';
import { ApiError } from '@/lib/errors';

/**
 * 保存前的验证钩子类型
 * 可以用于冲突检测、数据验证等
 */
type BeforeSaveHook = (config: Config) => Promise<void> | void;

/**
 * 默认的冲突检测钩子
 * 在保存前执行完整的冲突检测
 *
 * 注意: 这是 Story 3-3 (conflict-safe-save) 的功能
 * Story 2-3 默认启用冲突检测以提供更好的用户体验
 */
const defaultConflictDetection: BeforeSaveHook = async (config) => {
  const conflictRequest: ConflictDetectionRequest = {
    config,
    checkTypes: ['all'], // 执行所有类型的冲突检测
    timeout: 5000
  };

  // 使用原始 fetch 避免 apiFetch 的 success 检查干扰
  // 因为冲突检测 API 返回 success: false 是业务逻辑(表示检测到冲突),不是错误
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/config/check-conflict', {
      method: 'POST',
      headers,
      body: JSON.stringify(conflictRequest),
    });

    if (!response.ok) {
      throw new Error(`冲突检测服务错误: ${response.status} ${response.statusText}`);
    }

    // 使用共享的类型定义
    const conflictResult = await response.json() as ConflictDetectionResult;

    // 检查冲突检测结果 - 使用结构化错误处理
    if (!conflictResult.success) {
      // 检查是否是超时错误
      const hasTimeout = conflictResult.failedChecks?.some(check =>
        check.error.includes('检测超时')
      );

      if (hasTimeout) {
        throw new Error('CONFLICT_TIMEOUT', {
          cause: new Error('冲突检测超时，请检查网络连接或增加超时时间')
        });
      }

      // 检查是否有实际的配置冲突
      const hasRealConflict = conflictResult.failedChecks?.some(check =>
        !check.error.includes('检测超时') && !check.error.includes('服务不可用')
      );

      if (hasRealConflict) {
        const errorMessages = conflictResult.failedChecks
          ?.map(check => check.error)
          .join('; ');
        throw new Error('CONFLICT_DETECTED', {
          cause: new Error(errorMessages || '配置冲突检测失败')
        });
      }

      // 其他类型的错误
      throw new Error('CONFLICT_SERVICE_ERROR', {
        cause: new Error('冲突检测服务错误，请稍后重试')
      });
    }
  } catch (error: unknown) {
    // 根据错误类型进行结构化处理
    if (error instanceof Error) {
      // 冲突检测超时
      if (error.message.includes('CONFLICT_TIMEOUT')) {
        throw error.cause || error;
      }
      // 检测到配置冲突
      if (error.message.includes('CONFLICT_DETECTED')) {
        throw error.cause || error;
      }
      // 服务错误
      if (error.message.includes('CONFLICT_SERVICE_ERROR')) {
        throw error.cause || error;
      }
      // 网络错误或其他错误
      const errorMessage = error.message;
      throw new Error(`冲突检测服务不可用: ${errorMessage}`);
    }
    throw new Error('冲突检测服务不可用: 未知错误');
  }
};

export function useUpdateConfig(beforeSave: BeforeSaveHook = defaultConflictDetection) {
  const queryClient = useQueryClient();

  // 重启确认状态
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: Config) => {
      // 执行保存前的验证钩子（默认是冲突检测）
      if (beforeSave) {
        await beforeSave(values);
      }

      // 冲突检测通过后，执行配置保存
      return apiFetch<{ success: boolean; needsRestart: boolean }>('/api/config', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
    },
    onSuccess: (data) => {
      // 延迟 invalidateQueries 以避免与 form.reset 竞态条件
      //
      // 竞态问题: ConfigForm 的 handleSubmit 中调用 form.reset(mergedValues)
      // 如果立即 invalidateQueries,会触发 config query 重新获取
      // form.reset 可能还未完成,导致新获取的值覆盖用户刚刚保存的值
      //
      // 解决方案: 延迟 100ms 让 form.reset 先完成
      // 注意: 这是一个权衡方案,理想情况应该在 form.reset 的回调中触发 invalidation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['config'] });
      }, 100);

      // 配置保存成功后，如果需要重启，显示确认对话框
      if (data.needsRestart) {
        setShowRestartConfirm(true);
      } else {
        toast.success("配置已保存");
      }
    },
    onError: (error: unknown) => {
      // 检查是否是 ApiError 且包含验证错误
      // 如果有验证错误，不显示 toast，因为表单字段会显示错误
      if (error instanceof ApiError) {
        if (error.hasValidationErrors()) {
          // 不显示 toast，让表单字段显示验证错误
          return;
        }
        // 没有验证错误的 ApiError（如 500 错误），显示 toast
        const errorMessage = error.message || '服务器错误';
        toast.error("保存失败", {
          description: errorMessage,
        });
        return;
      }

      // 根据错误类型提供不同的提示
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      // 检测超时错误
      if (errorMessage.includes('冲突检测超时')) {
        toast.error("冲突检测超时", {
          description: errorMessage,
        });
      }
      // 配置冲突错误
      else if (errorMessage.includes('已被占用') ||
               errorMessage.includes('不在同一网段') ||
               errorMessage.includes('格式无效')) {
        toast.error("配置冲突检测失败", {
          description: errorMessage,
        });
      }
      // 服务错误
      else if (errorMessage.includes('冲突检测服务')) {
        toast.error("冲突检测服务错误", {
          description: errorMessage,
        });
      }
      // 其他错误
      else {
        toast.error("保存失败", {
          description: errorMessage || "请检查网络连接后重试",
        });
      }
    }
  });

  // 确认重启
  const confirmRestart = async () => {
    setIsRestarting(true);
    try {
      await restartCore();
      toast.success('重启指令已发送');
      setShowRestartConfirm(false);
    } catch (error) {
      toast.error(`重启失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRestarting(false);
    }
  };

  // 取消重启
  const cancelRestart = () => {
    setShowRestartConfirm(false);
  };

  return {
    ...mutation,
    showRestartConfirm,
    isRestarting,
    confirmRestart,
    cancelRestart,
  };
}
