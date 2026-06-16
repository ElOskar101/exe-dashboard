export const cccUserKeys = {
  all: ['ccc-users'] as const,
  search: (fullName: string, options: { limit?: number } = {}) =>
    [...cccUserKeys.all, 'search', fullName, options] as const,
}
