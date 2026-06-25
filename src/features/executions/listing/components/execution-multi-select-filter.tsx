import { useMemo, useState, type Dispatch, type UIEvent } from 'react'
import { IconChevronDown, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

import { type ExecutionFilterOption } from '../lib/execution-listing-filters'

const FILTER_SCROLL_BOTTOM_THRESHOLD = 48
const FILTER_POPOVER_COLLISION_AVOIDANCE = { fallbackAxisSide: 'none' } as const

interface ExecutionMultiSelectFilterProps {
  clearSelectionLabel?: string
  clearSelectionPlacement?: 'top' | 'bottom'
  disabled?: boolean
  emptyMessage: string
  error?: string | null
  fieldClassName?: string
  filterOptionsLocally?: boolean
  hasMoreOptions?: boolean
  id: string
  invalid?: boolean
  label: string
  loadingMessage?: string
  loadingMoreMessage?: string
  isLoadingMoreOptions?: boolean
  isLoadingOptions?: boolean
  onLoadMoreOptions?: () => void
  onSearchValueChange?: Dispatch<string>
  onSelectedValuesChange: Dispatch<string[]>
  options: ExecutionFilterOption[]
  placeholder: string
  searchPlaceholder?: string
  selectedCountLabel: string
  selectedValues: string[]
  selectionMode?: 'multiple' | 'single'
  triggerClassName?: string
}

export function ExecutionMultiSelectFilter({
  clearSelectionLabel,
  clearSelectionPlacement = 'top',
  disabled = false,
  emptyMessage,
  error,
  fieldClassName = 'gap-2',
  filterOptionsLocally = true,
  hasMoreOptions = false,
  id,
  invalid = false,
  label,
  loadingMessage,
  loadingMoreMessage,
  isLoadingMoreOptions = false,
  isLoadingOptions = false,
  onLoadMoreOptions,
  onSearchValueChange,
  onSelectedValuesChange,
  options,
  placeholder,
  searchPlaceholder,
  selectedCountLabel,
  selectedValues,
  selectionMode = 'multiple',
  triggerClassName,
}: ExecutionMultiSelectFilterProps) {
  const [searchValue, setSearchValue] = useState('')
  const filteredOptions = useMemo(() => {
    if (!filterOptionsLocally) return options

    const normalizedSearchValue = searchValue.trim().toLocaleLowerCase()

    if (!normalizedSearchValue) return options

    return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedSearchValue))
  }, [filterOptionsLocally, options, searchValue])
  const selectedValuesSet = useMemo(() => new Set(selectedValues), [selectedValues])
  const selectedLabel = useMemo(() => {
    if (selectedValues.length === 0) return placeholder

    if (selectedValues.length === 1) {
      return options.find((option) => option.value === selectedValues[0])?.label ?? selectedValues[0]
    }

    return selectedCountLabel
  }, [options, placeholder, selectedCountLabel, selectedValues])
  const optionsMaxHeightClass = clearSelectionPlacement === 'bottom' ? 'max-h-56' : 'max-h-72'
  const hasBottomClearSelection = clearSelectionPlacement === 'bottom' && selectedValues.length > 0

  const clearSearchValue = () => {
    setSearchValue('')
    onSearchValueChange?.('')
  }
  const setOptionSelected = (value: string, selected: boolean) => {
    if (selected && selectionMode === 'single') {
      onSelectedValuesChange([value])
      return
    }

    if (!selected && selectionMode === 'single') {
      clearSearchValue()
    }

    onSelectedValuesChange(
      selected
        ? Array.from(new Set([...selectedValues, value])).sort()
        : selectedValues.filter((selectedValue) => selectedValue !== value),
    )
  }
  const clearSelectionButton = selectedValues.length > 0 && (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(clearSelectionPlacement === 'bottom' ? 'w-full justify-start' : 'w-fit')}
      onClick={() => {
        if (selectionMode === 'single') {
          clearSearchValue()
        }

        onSelectedValuesChange([])
      }}
    >
      <IconX data-icon="inline-start" />
      {clearSelectionLabel ?? placeholder}
    </Button>
  )
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
    onSearchValueChange?.(value)
  }
  const handleOptionsScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!onLoadMoreOptions || !hasMoreOptions || isLoadingMoreOptions) return

    const viewport = event.currentTarget
    const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight

    if (distanceToBottom <= FILTER_SCROLL_BOTTOM_THRESHOLD) {
      onLoadMoreOptions()
    }
  }

  return (
    <Field className={fieldClassName} data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={invalid}
              className={cn('w-full justify-between', triggerClassName)}
            />
          }
        >
          <span className="truncate">{selectedLabel}</span>
          <IconChevronDown data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionAvoidance={FILTER_POPOVER_COLLISION_AVOIDANCE}
          className={cn('w-(--anchor-width) min-w-80 gap-3 overflow-hidden', hasBottomClearSelection && 'pb-0')}
        >
          <PopoverHeader>
            <PopoverTitle>{label}</PopoverTitle>
          </PopoverHeader>
          {clearSelectionPlacement === 'top' ? clearSelectionButton : null}
          {searchPlaceholder ? (
            <Input
              type="search"
              value={searchValue}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => handleSearchValueChange(event.target.value)}
            />
          ) : null}
          <ScrollArea
            className={optionsMaxHeightClass}
            viewportProps={{
              className: cn('flex flex-col gap-1', optionsMaxHeightClass),
              onScroll: handleOptionsScroll,
            }}
          >
            {isLoadingOptions && filteredOptions.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-muted-foreground">
                <Spinner data-icon="inline-start" />
                {loadingMessage ?? emptyMessage}
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Label
                  key={option.value}
                  className="flex min-h-9 cursor-pointer items-center rounded-2xl px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedValuesSet.has(option.value)}
                    onCheckedChange={(checked) => setOptionSelected(option.value, checked)}
                  />
                  <span className="truncate">{option.label}</span>
                </Label>
              ))
            ) : (
              <div className="rounded-2xl px-2 py-1.5 text-muted-foreground">{emptyMessage}</div>
            )}
            {isLoadingMoreOptions ? (
              <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-muted-foreground">
                <Spinner data-icon="inline-start" />
                {loadingMoreMessage ?? loadingMessage ?? emptyMessage}
              </div>
            ) : null}
          </ScrollArea>
          {hasBottomClearSelection ? <div className="-mx-4 border-t bg-popover p-3">{clearSelectionButton}</div> : null}
        </PopoverContent>
      </Popover>
      <FieldError>{error}</FieldError>
    </Field>
  )
}
