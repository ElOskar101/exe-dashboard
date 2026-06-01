export const _base64Encode = (data: string) => globalThis.btoa(data)
export const _base64Decode = (data: string) => globalThis.atob(data)

export const getDiffDates = (date1: string, date2: string, unit: 's' | 'm' | 'h' | 'd' | 'w' = 's') => {
  const diffMs = Math.abs(new Date(date1).getTime() - new Date(date2).getTime())

  switch (unit) {
    case 's':
      return diffMs / 1000 + unit

    case 'm':
      return diffMs / 1000 / 60 + unit

    case 'h':
      return diffMs / 1000 / 60 / 60 + unit

    case 'd':
      return diffMs / 1000 / 60 / 60 / 24 + unit

    case 'w':
      return diffMs / 1000 / 60 / 60 / 24 / 7 + unit
  }
}
