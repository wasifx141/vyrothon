import { useEffect, useState } from 'react'

/** Debounces `value` by `delayMs`. When `delayMs` is 0, returns `value` on every render (no debounce). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value)
      return
    }
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return delayMs <= 0 ? value : debounced
}
