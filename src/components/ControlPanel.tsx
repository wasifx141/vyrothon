import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Fingerprint,
  Loader2,
  Lock,
  Play,
  Unlock,
  Upload,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type Mode = 'encrypt' | 'decrypt'

interface Props {
  mode: Mode
  setMode: (m: Mode) => void
  inputText: string
  setInputText: (s: string) => void
  livePreview: boolean
  setLivePreview: (v: boolean) => void
  onRun: () => void
  onVerify: () => void
  output: string
  error: string | null
  isRunning: boolean
  roundTrip: { ok: boolean; ts: number } | null
  dna: string
  onExport: () => void
  onImport: (file: File) => void
  onPreset: (preset: 'classic' | 'max' | 'demo') => void
  canRun: boolean
}

export function ControlPanel(p: Props) {
  const [presetOpen, setPresetOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(t)
  }, [copied])

  const copy = async () => {
    if (!p.output) return
    await navigator.clipboard.writeText(p.output)
    setCopied(true)
  }

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col overflow-y-auto border-l border-border bg-card p-5">
      <div className="text-eyebrow mb-2">Mode</div>
      <div className="relative mb-5 grid grid-cols-2 rounded-lg border border-border bg-secondary p-1">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md border border-border bg-background shadow-sm"
          style={{
            left: p.mode === 'encrypt' ? 4 : 'calc(50% + 0px)',
          }}
        />
        <button
          type="button"
          onClick={() => p.setMode('encrypt')}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            p.mode === 'encrypt' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Lock size={12} />
          Encrypt
        </button>
        <button
          type="button"
          onClick={() => p.setMode('decrypt')}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            p.mode === 'decrypt' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Unlock size={12} />
          Decrypt
        </button>
      </div>

      <label className="text-eyebrow mb-1.5 block">
        {p.mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
      </label>
      <textarea
        value={p.inputText}
        onChange={(e) => p.setInputText(e.target.value)}
        rows={5}
        placeholder={
          p.mode === 'encrypt'
            ? 'Enter text to encrypt…'
            : 'Paste ciphertext to decrypt…'
        }
        spellCheck={false}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 font-mono-c text-[13px] text-foreground placeholder:text-muted-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
      />

      <label className="group mt-3 flex cursor-pointer items-center gap-2.5">
        <div className="relative h-5 w-9 rounded-full border border-border bg-secondary transition-colors">
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 h-4 w-4 rounded-full"
            style={{
              left: p.livePreview ? 18 : 2,
              background: p.livePreview
                ? 'hsl(var(--accent))'
                : 'hsl(var(--muted-foreground))',
            }}
          />
          <input
            type="checkbox"
            checked={p.livePreview}
            onChange={(e) => p.setLivePreview(e.target.checked)}
            className="sr-only"
          />
        </div>
        <span className="text-xs text-foreground">
          Live preview{' '}
          <span className="text-muted-foreground">(300ms debounce)</span>
        </span>
      </label>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={p.onRun}
          disabled={!p.canRun || p.isRunning}
          className="relative flex items-center justify-center gap-2 rounded-md bg-foreground py-2.5 text-xs font-semibold uppercase tracking-wider text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {p.isRunning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          Run Pipeline
        </button>
        <button
          type="button"
          onClick={p.onVerify}
          disabled={!p.canRun || p.isRunning}
          className="flex items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Zap size={13} />
          Verify Round-Trip
        </button>
      </div>

      <AnimatePresence mode="wait">
        {p.roundTrip ? (
          <motion.div
            key={p.roundTrip.ts}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className={`mt-3 flex items-center justify-center gap-2 rounded-md border py-2.5 text-xs font-semibold ${
              p.roundTrip.ok
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {p.roundTrip.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {p.roundTrip.ok ? 'Round-trip verified' : 'Round-trip mismatch'}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {p.error ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          {p.error}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-eyebrow">Output</span>
          <button
            type="button"
            onClick={copy}
            disabled={!p.output}
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-30"
          >
            <Copy size={10} />
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        <div className="max-h-[220px] min-h-[88px] overflow-auto rounded-md border border-border bg-background p-3 font-mono-c text-[12.5px] break-all whitespace-pre-wrap text-foreground">
          {p.output ? (
            p.output
          ) : (
            <span className="text-muted-foreground">
              Run the pipeline to see output…
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-md border border-border bg-secondary px-3 py-2.5">
        <Fingerprint size={15} className="shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Chain DNA
          </div>
          <div
            title={p.dna}
            className="truncate font-mono-c text-[11.5px] text-foreground"
          >
            {p.dna && p.dna !== '…'
              ? `${p.dna.slice(0, 14)}…${p.dna.slice(-4)}`
              : '—'}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={p.onExport}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-background py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground transition hover:bg-secondary"
        >
          <Download size={11} />
          Export
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-background py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground transition hover:bg-secondary"
        >
          <Upload size={11} />
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) p.onImport(f)
            e.target.value = ''
          }}
        />
      </div>

      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => setPresetOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition hover:bg-secondary"
        >
          Load Preset
          <ChevronDown
            size={13}
            className={`transition-transform ${presetOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <AnimatePresence>
          {presetOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
            >
              {[
                {
                  id: 'classic' as const,
                  label: 'Classic Stack',
                  desc: 'Caesar + Vigenère + XOR',
                },
                {
                  id: 'max' as const,
                  label: 'Max Security',
                  desc: 'All 4 main ciphers',
                },
                {
                  id: 'demo' as const,
                  label: 'Quick Demo',
                  desc: 'Caesar + XOR + Rail fence',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    p.onPreset(opt.id)
                    setPresetOpen(false)
                  }}
                  className="w-full border-b border-border px-3 py-2.5 text-left transition last:border-0 hover:bg-secondary"
                >
                  <div className="text-xs font-semibold text-foreground">
                    {opt.label}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-muted-foreground">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  )
}
