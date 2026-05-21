import { useTranslation } from 'react-i18next'
import { IconLoader2 } from '@tabler/icons-react'

interface IExecutionConsoleProps {
  lines: string[]
}

export function ExecutionConsole(props: IExecutionConsoleProps) {
  const { lines } = props
  const { t } = useTranslation()

  return (
    <div
      className="
        font-mono text-sm
        p-3 rounded-md h-64 overflow-y-auto
        border
      "
    >
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">
          {line}
        </div>
      ))}
      {!lines.length && (
        <div className="whitespace-pre-wrap flex items-center">
          <IconLoader2 className="animate-spin mr-1" /> {t('waiting')}
        </div>
      )}

      <div ref={(node) => node?.scrollIntoView({ behavior: 'smooth' })} />
    </div>
  )
}
