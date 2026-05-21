import classNames from 'classnames'

interface ISelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { label: string; value: string }[]
  padding?: 'sm' | 'md' | 'lg'
}

export function Select({
  label,
  error,
  options,
  className,
  padding = 'md',
  ...props
}: ISelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-medium text-[var(--neutral-700)]">
        {label}
      </label>

      <select
        {...props}
        className={classNames(
          {
            'px-3 py-2 rounded-lg': padding === 'lg',
            'px-2 py-1 rounded-md': padding === 'md',
            'px-1 py-1 rounded-sm': padding === 'sm',
          },
          `
          border
          bg-[var(--neutral-50)] dark:bg-[var(--neutral-800)]
          border-[var(--neutral-300)] dark:border-[var(--neutral-600)]
          text-[var(--neutral-900)] dark:text-[var(--neutral-100)]
          focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]
          transition-all`,
          error ? 'border-red-500' : '',
          className,
        )}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            selected={opt.value === props.value}
          >
            {opt.label}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
