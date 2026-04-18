import { getCipherDefinition } from '../cipherstack'
import type {
  CaesarConfig,
  RailFenceConfig,
  VigenereConfig,
  XorConfig,
} from '../cipherstack'

type Props = {
  cipherId: string
  config: unknown
  disabled?: boolean
  onChange: (next: unknown) => void
}

/** Per-cipher controls — keeps pipeline UI aligned with registry definitions. */
export function NodeConfigForm({ cipherId, config, disabled, onChange }: Props) {
  const def = getCipherDefinition(cipherId)
  if (!def) return null

  if (cipherId === 'caesar') {
    const c = config as CaesarConfig
    const shift = typeof c?.shift === 'number' && Number.isFinite(c.shift) ? c.shift : 0
    return (
      <label className="wb-field">
        <span className="wb-field-label">Shift</span>
        <input
          type="number"
          className="wb-input"
          disabled={disabled}
          value={shift}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10)
            onChange({ shift: Number.isNaN(v) ? 0 : v })
          }}
        />
      </label>
    )
  }

  if (cipherId === 'xor') {
    const c = config as XorConfig
    const key = typeof c?.key === 'string' ? c.key : ''
    return (
      <label className="wb-field">
        <span className="wb-field-label">Key</span>
        <input
          type="text"
          className="wb-input wb-input-mono"
          disabled={disabled}
          value={key}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange({ key: e.target.value })}
        />
      </label>
    )
  }

  if (cipherId === 'railFence') {
    const c = config as RailFenceConfig
    const rails =
      typeof c?.rails === 'number' && Number.isFinite(c.rails) ? c.rails : 3
    return (
      <label className="wb-field">
        <span className="wb-field-label">Rails</span>
        <input
          type="number"
          className="wb-input"
          min={2}
          max={64}
          disabled={disabled}
          value={rails}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10)
            onChange({ rails: Number.isNaN(v) ? 2 : v })
          }}
        />
      </label>
    )
  }

  if (cipherId === 'vigenere') {
    const c = config as VigenereConfig
    const keyword = typeof c?.keyword === 'string' ? c.keyword : ''
    return (
      <label className="wb-field">
        <span className="wb-field-label">Keyword</span>
        <input
          type="text"
          className="wb-input"
          disabled={disabled}
          value={keyword}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange({ keyword: e.target.value })}
        />
      </label>
    )
  }

  return (
    <p className="wb-field-hint">No form for cipher &quot;{cipherId}&quot;.</p>
  )
}
