export const cccUserKeys = {
  all: ['ccc-users'] as const,
  search: (fullName: string, options: { limit?: number; page?: number } = {}) =>
    [...cccUserKeys.all, 'search', fullName, options] as const,
  infiniteSearch: (fullName: string) => [...cccUserKeys.all, 'infinite-search', fullName] as const,
}
