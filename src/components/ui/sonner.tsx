import type { CSSProperties } from 'react'
import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { Spinner } from '@/components/ui/spinner'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      {...props}
      closeButton
      theme={theme}
      richColors={false}
      className={cn('toaster group', props.className)}
      icons={{
        success: <IconCircleCheck className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
        error: <IconAlertOctagon className="size-4" />,
        loading: <Spinner />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        closeButton: true,
        classNames: {
          ...toastOptions?.classNames,
          toast: cn(
            'cn-toast data-[type=success]:[&_[data-icon]]:text-success data-[type=info]:[&_[data-icon]]:text-primary data-[type=warning]:[&_[data-icon]]:text-chart-3 data-[type=error]:[&_[data-icon]]:text-destructive',
            toastOptions?.classNames?.toast,
          ),
        },
      }}
    />
  )
}

export { Toaster }
