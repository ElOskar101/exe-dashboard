import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ComponentProps, ReactNode } from 'react'

type RuntimeActionButtonProps = ComponentProps<typeof Button> & {
  icon: ReactNode
  label: string
}

export function RuntimeActionTooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Tooltip>
      {children}
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function RuntimeActionTooltipTrigger({
  icon,
  label,
  size = 'icon-sm',
  type = 'button',
  ...props
}: RuntimeActionButtonProps) {
  return (
    <TooltipTrigger
      render={
        <Button aria-label={label} size={size} title={label} type={type} {...props}>
          {icon}
        </Button>
      }
    />
  )
}
