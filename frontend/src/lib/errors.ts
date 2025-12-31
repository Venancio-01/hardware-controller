/**
 * API 错误类
 *
 * 封装 API 错误响应，包含状态码、消息和验证错误详情
 */

export interface ApiErrorData {
  error?: string;
  validationErrors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public readonly name = 'ApiError';
  public readonly status: number;
  public readonly data: ApiErrorData;

  constructor(message: string, status: number, data: ApiErrorData = {}) {
    super(message);
    this.status = status;
    this.data = data;

    // 维护正确的原型链（ES5兼容）
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 获取验证错误对象
   */
  get validationErrors(): Record<string, string[]> | undefined {
    return this.data.validationErrors;
  }

  /**
   * 检查是否有验证错误
   */
  hasValidationErrors(): boolean {
    return !!this.data.validationErrors && Object.keys(this.data.validationErrors).length > 0;
  }

  /**
   * 获取特定字段的验证错误消息
   */
  getFieldErrors(field: string): string[] | undefined {
    return this.data.validationErrors?.[field];
  }
}
