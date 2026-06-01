import { useState, type Dispatch, type FocusEvent } from 'react'
import { IconCheck, IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { CustomerSearchItem } from '../services/ccc.service'

interface CustomerSearchFieldProps {
  id: string
  value: string
  selectedCustomerName?: string
  placeholder: string
  disabled?: boolean
  invalid?: boolean
  isLoading: boolean
  searchError?: string | null
  options: CustomerSearchItem[]
  noResultsText: string
  searchingText: string
  selectedText: string
  onValueChange: Dispatch<string>
  onClearSelection: Dispatch<void>
  onSelect: Dispatch<CustomerSearchItem>
  selectedCustomerId: string
}

export function CustomerSearchField({
  id,
  value,
  selectedCustomerName = '',
  placeholder,
  disabled = false,
  invalid = false,
  isLoading,
  searchError,
  options,
  noResultsText,
  searchingText,
  selectedText,
  onValueChange,
  onClearSelection,
  onSelect,
  selectedCustomerId,
}: CustomerSearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldShowResults = value.trim().length >= 2
  const hasSelectedCustomer =
    selectedCustomerId.trim().length > 0 &&
    selectedCustomerName.trim().length > 0 &&
    selectedCustomerName.trim() === value.trim()
  const showPanel = isOpen && (shouldShowResults || hasSelectedCustomer)

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" onFocusCapture={() => setIsOpen(true)} onBlurCapture={handleBlur}>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        placeholder={placeholder}
        className={hasSelectedCustomer ? 'pr-10' : undefined}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {hasSelectedCustomer ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          <IconCheck className="size-4" />
        </span>
      ) : null}

      {showPanel ? (
        <div className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-3xl border border-border/70 bg-popover shadow-lg">
          <div className="max-h-72 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground">
                <Spinner />
                {searchingText}
              </div>
            ) : searchError ? (
              <div className="rounded-2xl px-3 py-2 text-sm text-destructive">{searchError}</div>
            ) : hasSelectedCustomer ? (
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-accent/70 px-3 py-2 text-left text-sm text-accent-foreground transition-colors hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onClearSelection()
                  setIsOpen(false)
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <IconSearch className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{selectedCustomerName}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{selectedText}</span>
                  <IconCheck className="size-4 shrink-0" />
                </span>
              </button>
            ) : options.length > 0 ? (
              options.map((customer) => {
                const isSelected = customer._id === selectedCustomerId

                return (
                  <button
                    key={customer._id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected ? 'bg-accent/70 text-accent-foreground' : '',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onSelect(customer)
                      setIsOpen(false)
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <IconSearch className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{customer.clientName}</span>
                    </span>
                    {isSelected ? <IconCheck className="size-4 shrink-0" /> : null}
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl px-3 py-2 text-sm text-muted-foreground">{noResultsText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
