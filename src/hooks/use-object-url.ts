import { useEffect, useMemo } from 'react'

export function useObjectUrl(content: string | undefined, type: string) {
  const objectUrl = useMemo(() => {
    return content ? URL.createObjectURL(new Blob([content], { type })) : undefined
  }, [content, type])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  return objectUrl
}
