const VITE_PRELOAD_ERROR_EVENT = 'vite:preloadError'
const PRELOAD_RELOAD_KEY = 'vite-preload-error-reload-at'
const PRELOAD_RELOAD_COOLDOWN_MS = 10_000

function getLastReloadAt() {
  return Number(window.sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? '0')
}

function markReloadAttempt() {
  window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()))
}

function shouldReload() {
  return Date.now() - getLastReloadAt() > PRELOAD_RELOAD_COOLDOWN_MS
}

// When a new deploy replaces old lazy chunks, reload once onto the current build.
window.addEventListener(VITE_PRELOAD_ERROR_EVENT, (event) => {
  if (!shouldReload()) {
    return
  }

  event.preventDefault()
  markReloadAttempt()
  window.location.reload()
})
