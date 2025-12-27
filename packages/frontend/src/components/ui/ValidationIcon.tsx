import { Check, X } from "lucide-react";
import { type FieldValues, type UseFormReturn, type Path } from "react-hook-form";
import { cn } from "@/lib/utils";

interface ValidationIconProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  fieldName: Path<T>;
  className?: string;
}

/**
 * 验证图标组件 - 显示字段验证状态
 * 仅在字段 isDirty 或 isTouched 后显示图标
 */
export function ValidationIcon<T extends FieldValues>({
  form,
  fieldName,
  className,
}: ValidationIconProps<T>) {
  const fieldState = form.getFieldState(fieldName);

  // 仅在字段被修改或触摸后显示图标
  if (!fieldState.isDirty && !fieldState.isTouched) return null;

  const baseClassName = cn("h-4 w-4 absolute right-3 top-2.5", className);

  if (fieldState.invalid) {
    return <X className={cn(baseClassName, "text-destructive")} />;
  }

  return <Check className={cn(baseClassName, "text-green-500")} />;
}

/**
 * 辅助函数 - 用于不使用组件形式的场景
 * 返回验证图标的 JSX 或 null
 */
export function getValidationIcon<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>,
  className?: string
) {
  const fieldState = form.getFieldState(fieldName);

  // 仅在字段被修改或触摸后显示图标
  if (!fieldState.isDirty && !fieldState.isTouched) return null;

  const baseClassName = cn("h-4 w-4 absolute right-3 top-2.5", className);

  if (fieldState.invalid) {
    return <X className={cn(baseClassName, "text-destructive")} />;
  }

  return <Check className={cn(baseClassName, "text-green-500")} />;
}
