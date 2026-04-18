import { useEffect, useRef, useState } from 'react'

/** Debounces `value` by `delayMs`. When `delayMs` is 0, returns `value` on every render (no debounce). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  const prevDelayMs = useRef(delayMs)

  useEffect(() => {
    const prev = prevDelayMs.current
    prevDelayMs.current = delayMs

    if (delayMs <= 0) {
      /* Only sync internal state when leaving debounced mode (avoids an extra setState per keystroke while immediate). */
      if (prev > 0) setDebounced(value)
      return
    }

    if (prev <= 0) setDebounced(value)
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return delayMs <= 0 ? value : debounced
}
