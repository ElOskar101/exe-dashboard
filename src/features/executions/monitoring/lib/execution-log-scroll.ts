const LOG_SCROLL_BOTTOM_THRESHOLD = 24

export const getCanScrollToBottom = (viewport: HTMLDivElement) =>
  viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > LOG_SCROLL_BOTTOM_THRESHOLD

export const getIsScrolledToBottom = (viewport: HTMLDivElement) =>
  viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= LOG_SCROLL_BOTTOM_THRESHOLD
