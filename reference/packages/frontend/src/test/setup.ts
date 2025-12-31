import '@testing-library/jest-dom';

/**
 * 全局处理器：静默 @hookform/resolvers + Zod 在表单验证时抛出的预期 rejection 错误。
 * 这是 React Hook Form 与 Zod 4.x 集成在测试环境中的已知行为。
 * 当使用 mode: "onChange" 且输入无效值时，resolver 会抛出 ZodError，
 * 但这些错误会被 React Hook Form 内部处理并显示为表单验证消息，
 * 在测试环境中这些 rejection 会被报告为 unhandled。
 *
 * @see https://github.com/react-hook-form/resolvers/issues/699
 */
process.on('unhandledRejection', (reason: unknown) => {
  // 检查是否是 ZodError（来自 @hookform/resolvers 的表单验证）
  if (
    reason &&
    typeof reason === 'object' &&
    '_zod' in reason &&
    'issues' in reason
  ) {
    // 静默处理预期的 ZodError - 这些在 React Hook Form 中是正常的验证行为
    return;
  }
  // 其他 unhandled rejection 仍然抛出
  throw reason;
});
