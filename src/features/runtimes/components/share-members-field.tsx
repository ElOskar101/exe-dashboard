import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cccUserKeys, searchCCCUsers, type CCCUser, type PlaywrightRuntimeSharedMember } from '@/features/executions'
import { AuthContext } from '@/features/auth'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useCccApiUrl } from '@/hooks/use-ccc-api-url'
import { cn } from '@/lib/utils'
import { useInfiniteQuery } from '@tanstack/react-query'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

const SHARE_MEMBER_USER_LIMIT = 50
const SHARE_MEMBER_SEARCH_DELAY_MS = 300
const SHARE_MEMBER_PANEL_OFFSET_PX = 8
const USER_PICTURES_PATH = '/pictures/'

const SAFE_IMAGE_SCHEMES = new Set(['http:', 'https:'])

const isSafeImageUrl = (value: string) => {
  try {
    return SAFE_IMAGE_SCHEMES.has(new URL(value).protocol)
  } catch {
    return false
  }
}

const getUserDisplayName = (user: PlaywrightRuntimeSharedMember) => user.fullName
const getUserImageSrc = (user: PlaywrightRuntimeSharedMember, cccApiUrl: string) => {
  if (!user.urlImage) {
    return ''
  }

  const absoluteUrl = cccApiUrl + USER_PICTURES_PATH + user.urlImage

  return isSafeImageUrl(absoluteUrl) ? absoluteUrl : ''
}
const getUserFallbackLetter = (user: PlaywrightRuntimeSharedMember) => {
  const trimmedName = user.fullName.trim()

  return trimmedName ? trimmedName.charAt(0).toUpperCase() : '?'
}

function ShareMemberAvatar({
  size = 'default',
  user,
}: {
  size?: 'default' | 'sm'
  user: PlaywrightRuntimeSharedMember
}) {
  const { cccApiUrl } = useCccApiUrl()
  const displayName = getUserDisplayName(user)
  const userImageSrc = getUserImageSrc(user, cccApiUrl)

  return (
    <Avatar size={size}>
      {userImageSrc ? <AvatarImage src={userImageSrc} alt={displayName} /> : null}
      <AvatarFallback>{getUserFallbackLetter(user)}</AvatarFallback>
    </Avatar>
  )
}

export function ShareMembersField({
  disabled,
  id,
  members,
  onAdd,
  onRemove,
}: {
  disabled: boolean
  id: string
  members: PlaywrightRuntimeSharedMember[]
  onAdd: (member: PlaywrightRuntimeSharedMember) => void
  onRemove: (memberId: string) => void
}) {
  const { t } = useTranslation('runtimes')
  const { user: currentUser } = useContext(AuthContext)
  const currentUserId = currentUser?._id
  const [searchValue, setSearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<Pick<DOMRect, 'bottom' | 'left' | 'width'> | null>(null)
  const debouncedSearchValue = useDebouncedValue(searchValue.trim(), SHARE_MEMBER_SEARCH_DELAY_MS)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const usersQuery = useInfiniteQuery({
    queryKey: [...cccUserKeys.infiniteSearch(debouncedSearchValue)],
    queryFn: async ({ pageParam }) => {
      const response = await searchCCCUsers(debouncedSearchValue, {
        limit: SHARE_MEMBER_USER_LIMIT,
        page: pageParam,
      })

      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (allPages.length < lastPage.totalPages) {
        return allPages.length + 1
      }

      return undefined
    },
    enabled: !disabled,
  })

  const allUsers = useMemo(() => {
    const seen = new Set<string>()
    const uniqueUsers: CCCUser[] = []

    usersQuery.data?.pages.forEach((page) => {
      page.users.forEach((user) => {
        if (!seen.has(user._id)) {
          seen.add(user._id)
          uniqueUsers.push(user)
        }
      })
    })

    const excludedIds = new Set<string>(members.map((member) => member._id))

    if (currentUserId) {
      excludedIds.add(currentUserId)
    }

    return uniqueUsers.filter((user) => !excludedIds.has(user._id))
  }, [usersQuery.data, currentUserId, members])

  const selectedMemberIds = useMemo(() => new Set(members.map((member) => member._id)), [members])
  const showPanel = isOpen && !disabled && anchorRect
  const canRenderPanel = typeof document !== 'undefined'

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry?.isIntersecting && usersQuery.hasNextPage && !usersQuery.isFetchingNextPage) {
          void usersQuery.fetchNextPage()
        }
      },
      { rootMargin: '120px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [usersQuery])

  const updateAnchorRect = (element: HTMLElement) => {
    const nextAnchorRect = element.getBoundingClientRect()

    setAnchorRect({
      bottom: nextAnchorRect.bottom,
      left: nextAnchorRect.left,
      width: nextAnchorRect.width,
    })
  }

  const handleSelect = (user: CCCUser) => {
    onAdd(user)
    setSearchValue('')
    setIsOpen(false)
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={id}>{t('share.fields.user')}</FieldLabel>
        <Input
          id={id}
          value={searchValue}
          onChange={(event) => {
            updateAnchorRect(event.currentTarget)
            setSearchValue(event.target.value)
            setIsOpen(true)
          }}
          onFocus={(event) => {
            updateAnchorRect(event.currentTarget)
            setIsOpen(true)
          }}
          onBlur={() => setIsOpen(false)}
          placeholder={t('share.placeholders.user')}
          disabled={disabled}
          autoComplete="off"
        />
        {showPanel && canRenderPanel
          ? createPortal(
              <div
                className="fixed z-50 overflow-hidden rounded-3xl border border-border/70 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10"
                style={{
                  top: anchorRect.bottom + SHARE_MEMBER_PANEL_OFFSET_PX,
                  left: anchorRect.left,
                  width: anchorRect.width,
                }}
              >
                <div className="max-h-72 overflow-y-auto p-2">
                  {usersQuery.isPending ? (
                    <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground">
                      <Spinner />
                      {t('share.searchingUsers')}
                    </div>
                  ) : usersQuery.isError ? (
                    <div className="rounded-2xl px-3 py-2 text-sm text-destructive">{t('share.searchError')}</div>
                  ) : allUsers.length > 0 ? (
                    allUsers.map((user) => {
                      const isSelected = selectedMemberIds.has(user._id)

                      return (
                        <button
                          key={user._id}
                          type="button"
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                            isSelected ? 'bg-accent/70 text-accent-foreground' : '',
                          )}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelect(user)}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <ShareMemberAvatar user={user} />
                            <span className="min-w-0">
                              <span className="block truncate">{getUserDisplayName(user)}</span>
                              <span className="block truncate text-xs text-muted-foreground">{user.username}</span>
                            </span>
                          </span>
                          {isSelected ? (
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-muted-foreground">{t('share.selected')}</span>
                              <IconCheck className="size-4" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl px-3 py-2 text-sm text-muted-foreground">{t('share.noUsersFound')}</div>
                  )}
                  <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
                  {usersQuery.isFetchingNextPage ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground">
                      <Spinner />
                      {t('share.loadingMoreUsers')}
                    </div>
                  ) : null}
                </div>
              </div>,
              document.body,
            )
          : null}
        <FieldDescription>{t('share.description')}</FieldDescription>
      </Field>

      {members.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const memberLabel = getUserDisplayName(member)

            return (
              <Badge key={member._id} variant="secondary" className="h-12 gap-2 py-1 pr-1.5 pl-1.5">
                <ShareMemberAvatar user={member} />
                <span className="flex min-w-0 max-w-56 flex-col items-start leading-tight">
                  <span className="max-w-full truncate text-sm">{memberLabel}</span>
                  <span className="max-w-full truncate text-xs font-normal text-muted-foreground">
                    {member.username}
                  </span>
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onRemove(member._id)}
                  disabled={disabled}
                  aria-label={t('share.removeLabel', { member: memberLabel })}
                >
                  <IconX />
                </Button>
              </Badge>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('share.empty')}</p>
      )}
    </FieldGroup>
  )
}
