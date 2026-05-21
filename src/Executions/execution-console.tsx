import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TablerIcons from '../components/tabler-icons'
import classNames from 'classnames'

interface IExecutionConsoleProps {
  lines: string[]
}

export function ExecutionConsole(props: IExecutionConsoleProps) {
  const { lines } = props
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div
      className="
        bg-black text-green-400 font-mono text-sm
        p-3 rounded-md h-64 overflow-y-auto
        border border-[var(--primary-700)]
      "
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={classNames(
            'whitespace-pre-wrap',
            line.includes('[ERROR]') && 'text-red-400',
            line.includes('[WARN]') && 'text-yellow-300',
            line.includes('[INFO]') && 'text-blue-300',
          )}
        >
          {line}
        </div>
      ))}
      {!lines.length && (
        <div className="whitespace-pre-wrap flex items-center">
          <TablerIcons icon="IconLoader2" className="animate-spin mr-1" />{' '}
          {t('waiting')}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
