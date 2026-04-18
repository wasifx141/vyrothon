interface Props {
  color: string
  active: boolean
  direction: 'forward' | 'backward'
}

export function ConnectorLine({ color, active, direction }: Props) {
  const stroke = color.startsWith('var(') ? `hsl(${color})` : color
  const safeId = `grad-${stroke.replace(/[^a-z0-9]/gi, '')}`
  return (
    <div className="relative flex h-7 justify-center pointer-events-none">
      <svg width="40" height="28" viewBox="0 0 40 28" className="overflow-visible">
        <defs>
          <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.15" />
            <stop offset="50%" stopColor={stroke} stopOpacity="0.6" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <line
          x1="20"
          y1="0"
          x2="20"
          y2="28"
          stroke={`url(#${safeId})`}
          strokeWidth="2"
          strokeDasharray="4 4"
          className={
            active
              ? direction === 'forward'
                ? 'connector-flow'
                : 'connector-flow-reverse'
              : ''
          }
        />
        {active ? (
          <circle r="3" fill={stroke}>
            <animate
              attributeName="cy"
              from={direction === 'forward' ? '0' : '28'}
              to={direction === 'forward' ? '28' : '0'}
              dur="1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cx"
              from="20"
              to="20"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        ) : null}
      </svg>
    </div>
  )
}
