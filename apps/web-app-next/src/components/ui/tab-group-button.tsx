import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface TabButtonOption<T extends string = string> {
  value: T
  label: React.ReactNode
  disabled?: boolean
}

const tabGroupButtonVariants = cva("flex w-max gap-1", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

interface TabGroupButtonProps<T extends string = string>
  extends VariantProps<typeof tabGroupButtonVariants> {
  options: TabButtonOption<T>[]
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  className?: string
  buttonVariant?: VariantProps<typeof Button>["variant"]
  buttonSize?: VariantProps<typeof Button>["size"]
}

function TabGroupButton<T extends string = string>({
  options,
  value,
  defaultValue,
  onChange,
  className,
  orientation,
  buttonVariant = "ghost",
  buttonSize = "sm",
}: TabGroupButtonProps<T>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? options[0]?.value)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleChange = (newValue: T) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  return (
    <div className={cn("flex items-center overflow-x-auto", className)}>
      <div role="tablist" className={cn(tabGroupButtonVariants({ orientation }))}>
        {options.map((option) => (
          <Button
            key={option.value}
            variant={currentValue === option.value ? "default" : buttonVariant}
            size={buttonSize}
            disabled={option.disabled}
            onClick={() => handleChange(option.value)}
            className="shrink-0"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { TabGroupButton, tabGroupButtonVariants }
