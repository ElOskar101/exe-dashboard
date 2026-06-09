import { type Dispatch } from 'react'
import { format } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { IconCalendar } from '@tabler/icons-react'
import { type TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const getDateRangeLabel = (dateRange: DateRange | undefined, placeholder: string, t: TFunction<'executions'>) => {
  if (!dateRange?.from) return placeholder

  if (!dateRange.to) return format(dateRange.from, 'LLL dd, y')

  return t('list.filters.dateRangeValue', {
    from: format(dateRange.from, 'LLL dd, y'),
    to: format(dateRange.to, 'LLL dd, y'),
  })
}

interface ExecutionDateRangeFilterProps {
  dateRange: DateRange | undefined
  label: string
  onDateRangeChange: Dispatch<DateRange | undefined>
  placeholder: string
}

export function ExecutionDateRangeFilter({
  dateRange,
  label,
  onDateRangeChange,
  placeholder,
}: ExecutionDateRangeFilterProps) {
  const { t } = useTranslation('executions')

  return (
    <Field className="gap-2">
      <FieldLabel htmlFor="execution-date-range-filter">{label}</FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id="execution-date-range-filter"
              type="button"
              variant="outline"
              className="w-full justify-start px-2.5 font-normal"
            />
          }
        >
          <IconCalendar data-icon="inline-start" />
          <span className="truncate">{getDateRangeLabel(dateRange, placeholder, t)}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
