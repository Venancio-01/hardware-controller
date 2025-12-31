import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  freeSolo?: boolean // 如果为 true，允许输入自定义值
  hideSearch?: boolean // 如果为 true，隐藏搜索输入框
  showValueInTrigger?: boolean // 如果为 true，在触发器中显示值而非标签
  mode?: 'select' | 'input' // 'select' = 纯下拉模式，'input' = 输入+下拉模式
}

export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "请选择选项...",
  searchPlaceholder = "搜索...",
  emptyText = "未找到匹配选项",
  className,
  disabled = false,
  freeSolo = false,
  hideSearch = false,
  showValueInTrigger = false,
  mode = 'select',
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")

  // 同步 value 到 inputValue
  React.useEffect(() => {
    setInputValue(value || "")
  }, [value])

  // 处理自由输入模式的值变化
  const handleInputChange = (val: string) => {
    setInputValue(val)
    if (freeSolo || mode === 'input') {
      onChange(val)
    }
  }

  // 判断选项是否为空
  const hasOptions = options.length > 0

  // 获取显示文本
  const getDisplayText = () => {
    if (!value) return placeholder
    if (showValueInTrigger) return value
    const option = options.find((opt) => opt.value === value)
    return option?.label || (freeSolo || mode === 'input' ? value : value)
  }

  // 输入模式：显示输入框+下拉按钮
  if (mode === 'input') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className={cn("relative flex items-center cursor-pointer", className)}>
            <Input
              value={inputValue}
              onChange={(e) => {
                e.stopPropagation()
                handleInputChange(e.target.value)
              }}
              onClick={(e) => {
                // 点击输入框时打开下拉面板（如果有选项）
                if (hasOptions) {
                  setOpen(true)
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-10 cursor-pointer"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-full px-2 hover:bg-transparent pointer-events-none"
              disabled={disabled || !hasOptions}
              type="button"
              tabIndex={-1}
            >
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {!hideSearch && (
              <CommandInput
                placeholder={searchPlaceholder}
                value={inputValue}
                onValueChange={handleInputChange}
              />
            )}
            <CommandList>
              {!hasOptions ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {emptyText}
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {freeSolo && inputValue ? (
                      <div
                        className="p-2 text-sm text-muted-foreground cursor-pointer hover:bg-accent"
                        onClick={() => {
                          onChange(inputValue)
                          setOpen(false)
                        }}
                      >
                        使用 "{inputValue}"
                      </div>
                    ) : (
                      emptyText
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          onChange(option.value)
                          setInputValue(option.value)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // 下拉模式（默认）
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {getDisplayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          {!hideSearch && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={handleInputChange}
            />
          )}
          <CommandList>
            {!hasOptions ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {emptyText}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {freeSolo && inputValue ? (
                    <div
                      className="p-2 text-sm text-muted-foreground cursor-pointer hover:bg-accent"
                      onClick={() => {
                        onChange(inputValue)
                        setOpen(false)
                      }}
                    >
                      使用 "{inputValue}"
                    </div>
                  ) : (
                    emptyText
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value === value ? "" : option.value)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
