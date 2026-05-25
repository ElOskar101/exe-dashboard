import { useEffect, useMemo } from 'react'

export function useObjectUrl(content: string | undefined, type: string) {
  const objectUrlResult = useMemo(() => {
    if (!content) return { error: null, url: undefined }

    try {
      return { error: null, url: URL.createObjectURL(new Blob([content], { type })) }
    } catch (error) {
      return { error, url: undefined }
    }
  }, [content, type])

  useEffect(() => {
    return () => {
      if (objectUrlResult.url) URL.revokeObjectURL(objectUrlResult.url)
    }
  }, [objectUrlResult.url])

  return objectUrlResult
}
