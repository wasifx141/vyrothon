import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import {
  assertRoundTrip,
  computeChainDna,
  exportPipelineSnapshot,
  getCipherDefinition,
  importPipelineSnapshot,
  listCipherDefinitions,
  MIN_PIPELINE_NODES,
  PipelineError,
  PipelineSnapshotError,
  pipelinePresets,
  runDecryptPipeline,
  runEncryptPipeline,
  type PipelineNode,
  type PipelineRunResult,
} from '../cipherstack'
import { NodeConfigForm } from './NodeConfigForm'
import { SortableNodeCard } from './SortableNodeCard'
import './workbench.css'

function newId(): string {
  return crypto.randomUUID()
}

function starterPipeline(): PipelineNode[] {
  return [
    { instanceId: newId(), cipherId: 'caesar', config: { shift: 3 } },
    { instanceId: newId(), cipherId: 'vigenere', config: { keyword: 'hack' } },
    { instanceId: newId(), cipherId: 'xor', config: { key: 'ab' } },
  ]
}

function validateNodes(nodes: PipelineNode[]): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const n of nodes) {
    const def = getCipherDefinition(n.cipherId)
    if (!def) {
      errors[n.instanceId] = `Unknown cipher: ${n.cipherId}`
      continue
    }
    const msg = def.validateConfig(n.config)
    if (msg) errors[n.instanceId] = msg
  }
  return errors
}

const CIPHER_GLYPH: Record<string, string> = {
  caesar: 'C',
  vigenere: 'V',
  xor: 'Φ',
  railFence: 'R',
}

type Mode = 'encrypt' | 'decrypt'

export function PipelineWorkbench() {
  const [nodes, setNodes] = useState<PipelineNode[]>(starterPipeline)
  const [mode, setMode] = useState<Mode>('encrypt')
  const [inputText, setInputText] = useState('CipherStack')
  const [result, setResult] = useState<PipelineRunResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [chainDna, setChainDna] = useState('…')
  const [copied, setCopied] = useState(false)
  const [roundTripOk, setRoundTripOk] = useState<boolean | null>(null)
  const [roundTripDetail, setRoundTripDetail] = useState<string | null>(null)
  const [runGeneration, setRunGeneration] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [importDraft, setImportDraft] = useState('')
  const [labMessage, setLabMessage] = useState<string | null>(null)
  const [labError, setLabError] = useState<string | null>(null)

  const defs = listCipherDefinitions()
  const configErrors = useMemo(() => validateNodes(nodes), [nodes])
  const canRun =
    nodes.length >= MIN_PIPELINE_NODES &&
    Object.keys(configErrors).length === 0

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const id = await computeChainDna(nodes)
      if (!cancelled) setChainDna(id)
    })()
    return () => {
      cancelled = true
    }
  }, [nodes])

  const clearOutputs = useCallback(() => {
    setResult(null)
    setRunError(null)
    setRoundTripOk(null)
    setRoundTripDetail(null)
    setLabMessage(null)
    setLabError(null)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setNodes((prev) => {
      const oldIndex = prev.findIndex((n) => n.instanceId === active.id)
      const newIndex = prev.findIndex((n) => n.instanceId === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
    clearOutputs()
  }, [clearOutputs])

  const handleAdd = useCallback(
    (cipherId: string) => {
      const def = getCipherDefinition(cipherId)
      if (!def) return
      setNodes((prev) => [
        ...prev,
        {
          instanceId: newId(),
          cipherId,
          config: structuredClone(def.defaultConfig),
        },
      ])
      clearOutputs()
    },
    [clearOutputs],
  )

  const handleRemove = useCallback(
    (instanceId: string) => {
      setNodes((prev) => prev.filter((n) => n.instanceId !== instanceId))
      clearOutputs()
    },
    [clearOutputs],
  )

  const patchConfig = useCallback(
    (instanceId: string, partial: unknown) => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.instanceId !== instanceId) return n
          if (partial && typeof partial === 'object' && !Array.isArray(partial)) {
            return {
              ...n,
              config: { ...(n.config as object), ...(partial as object) },
            }
          }
          return { ...n, config: partial }
        }),
      )
      clearOutputs()
    },
    [clearOutputs],
  )

  const handleRun = useCallback(() => {
    setRunError(null)
    setRoundTripOk(null)
    setRoundTripDetail(null)
    if (!canRun) {
      setRunError(
        nodes.length < MIN_PIPELINE_NODES
          ? `Add at least ${MIN_PIPELINE_NODES} nodes (currently ${nodes.length}).`
          : 'Fix configuration errors on highlighted nodes.',
      )
      return
    }
    try {
      if (mode === 'encrypt') {
        setResult(runEncryptPipeline(nodes, inputText))
      } else {
        setResult(runDecryptPipeline(nodes, inputText))
      }
      setRunGeneration((g) => g + 1)
    } catch (e) {
      setResult(null)
      const msg =
        e instanceof PipelineError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e)
      setRunError(msg)
    }
  }, [canRun, inputText, mode, nodes])

  const handleVerifyRoundTrip = useCallback(() => {
    setRunError(null)
    setRoundTripOk(null)
    setRoundTripDetail(null)
    if (!canRun) {
      setRunError('Fix pipeline before verifying.')
      return
    }
    try {
      const { ok, recovered } = assertRoundTrip(nodes, inputText)
      setRoundTripOk(ok)
      setRoundTripDetail(
        ok ? null : `Recovered: ${JSON.stringify(recovered)}`,
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRunError(msg)
    }
  }, [canRun, inputText, nodes])

  const handleCopyOutput = useCallback(async () => {
    if (!result?.output) return
    try {
      await navigator.clipboard.writeText(result.output)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setRunError('Could not copy to clipboard.')
    }
  }, [result])

  const copyStepField = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(key)
      window.setTimeout(() => {
        setCopiedField((c) => (c === key ? null : c))
      }, 1600)
    } catch {
      setRunError('Could not copy.')
    }
  }, [])

  const handleResetDemo = useCallback(() => {
    setNodes(starterPipeline())
    setInputText('CipherStack')
    setMode('encrypt')
    setResult(null)
    setRunError(null)
    setRoundTripOk(null)
    setRoundTripDetail(null)
    setCopied(false)
    setRunGeneration((g) => g + 1)
    setLabMessage(null)
    setLabError(null)
    setImportDraft('')
  }, [])

  const handleExportSnapshot = useCallback(async () => {
    setLabError(null)
    setLabMessage(null)
    try {
      const json = exportPipelineSnapshot(nodes)
      await navigator.clipboard.writeText(json)
      setLabMessage('Snapshot JSON copied to clipboard.')
      window.setTimeout(() => setLabMessage(null), 2800)
    } catch {
      setLabError('Could not copy to clipboard.')
    }
  }, [nodes])

  const handleImportSnapshot = useCallback(() => {
    setLabError(null)
    setLabMessage(null)
    try {
      const next = importPipelineSnapshot(importDraft.trim())
      setNodes(next)
      clearOutputs()
      setImportDraft('')
      setLabMessage('Pipeline loaded from snapshot.')
      window.setTimeout(() => setLabMessage(null), 2800)
    } catch (e) {
      const msg =
        e instanceof PipelineSnapshotError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e)
      setLabError(msg)
    }
  }, [importDraft, clearOutputs])

  const handleApplyPreset = useCallback(
    (build: () => PipelineNode[]) => {
      setLabError(null)
      setLabMessage(null)
      setNodes(build())
      clearOutputs()
      setImportDraft('')
      setLabMessage('Preset applied.')
      window.setTimeout(() => setLabMessage(null), 2200)
    },
    [clearOutputs],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleRun])

  const stepIntro =
    mode === 'encrypt'
      ? 'Data moves forward: each row is one hop through the stack.'
      : 'Inverses run in reverse: row 1 is the last node peeling off first.'

  const flowItems = useMemo(() => {
    if (nodes.length === 0) return null
    return nodes.flatMap((n, i) => {
      const def = getCipherDefinition(n.cipherId)
      const short = CIPHER_GLYPH[n.cipherId] ?? def?.label.slice(0, 2) ?? '?'
      const el = (
        <span key={n.instanceId} className="wb-flow-chip" title={def?.label}>
          <span className="wb-flow-glyph">{short}</span>
          <span className="wb-flow-name">{def?.label ?? n.cipherId}</span>
        </span>
      )
      if (i === 0) return [el]
      return [
        <span key={`arr-${n.instanceId}`} className="wb-flow-arrow" aria-hidden>
          →
        </span>,
        el,
      ]
    })
  }, [nodes])

  return (
    <div
      className={`wb wb-shell wb--${mode}`}
      data-ready={canRun ? 'true' : 'false'}
    >
      <header className="wb-hero">
        <div className="wb-hero-grid" aria-hidden="true" />
        <p className="wb-eyebrow">VYROTHON · CipherStack</p>
        <h1 className="wb-title">
          Cascade <span className="wb-title-accent">encryption</span> lab
        </h1>
        <p className="wb-sub">
          Stack ciphers, drag to reorder, run encrypt or decrypt. Every hop is
          visible — built to prove correctness under pressure.
        </p>
        <div className="wb-hero-meta">
          <div className="wb-dna-card">
            <span className="wb-dna-label">Chain DNA</span>
            <code className="wb-dna-value" aria-live="polite">
              {chainDna}
            </code>
          </div>
          <div className="wb-hero-hint">
            <kbd className="wb-kbd">Ctrl</kbd>
            <span className="wb-hero-hint-plus">/</span>
            <kbd className="wb-kbd">⌘</kbd>
            <span className="wb-hero-hint-plus">+</span>
            <kbd className="wb-kbd">Enter</kbd>
            <span className="wb-hero-hint-text">run</span>
          </div>
        </div>
      </header>

      <section className="wb-lab" aria-labelledby="lab-heading">
        <div className="wb-lab-head">
          <h2 id="lab-heading">Lab tools</h2>
          <p className="wb-lab-lead">
            Presets for instant demos; export/import JSON to share exact stacks with
            judges or teammates.
          </p>
        </div>

        <div className="wb-lab-row">
          <span className="wb-lab-label">Presets</span>
          <div className="wb-lab-presets" role="group" aria-label="Pipeline presets">
            {pipelinePresets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="wb-preset-btn"
                title={p.hint}
                onClick={() => handleApplyPreset(p.build)}
              >
                <span className="wb-preset-name">{p.label}</span>
                <span className="wb-preset-hint">{p.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wb-lab-row wb-lab-snapshot">
          <span className="wb-lab-label">Snapshot</span>
          <div className="wb-lab-snapshot-actions">
            <button
              type="button"
              className="wb-btn wb-btn-secondary"
              onClick={handleExportSnapshot}
            >
              Copy JSON
            </button>
            <label className="wb-lab-import-label">
              <span className="wb-sr-only">Paste pipeline JSON</span>
              <textarea
                className="wb-lab-textarea"
                rows={3}
                value={importDraft}
                onChange={(e) => {
                  setImportDraft(e.target.value)
                  setLabError(null)
                }}
                placeholder='{"version":1,"cipherStack":{"nodes":[...]}}'
                spellCheck={false}
              />
            </label>
            <button
              type="button"
              className="wb-btn wb-btn-primary"
              onClick={handleImportSnapshot}
              disabled={!importDraft.trim()}
            >
              Load JSON
            </button>
          </div>
        </div>

        {labMessage ? (
          <p className="wb-lab-flash wb-lab-flash--ok" role="status">
            {labMessage}
          </p>
        ) : null}
        {labError ? (
          <p className="wb-lab-flash wb-lab-flash--err" role="alert">
            {labError}
          </p>
        ) : null}
      </section>

      <div className="wb-layout">
        <section
          className="wb-panel wb-panel-pipeline"
          aria-labelledby="pipeline-heading"
        >
          <div className="wb-panel-head">
            <div>
              <h2 id="pipeline-heading">Build the stack</h2>
              <p className="wb-panel-desc">
                Add nodes, configure, drag handles to reorder. Minimum{' '}
                {MIN_PIPELINE_NODES} nodes to run.
              </p>
            </div>
            <span
              className={`wb-badge ${nodes.length >= MIN_PIPELINE_NODES ? 'wb-badge-ok' : ''}`}
            >
              {nodes.length} node{nodes.length === 1 ? '' : 's'}
              {nodes.length < MIN_PIPELINE_NODES
                ? ` · need ${MIN_PIPELINE_NODES}+`
                : ' · ready'}
            </span>
          </div>

          <div className="wb-palette" role="group" aria-label="Add cipher nodes">
            {defs.map((d) => (
              <button
                key={d.id}
                type="button"
                className="wb-palette-btn"
                onClick={() => handleAdd(d.id)}
                title={d.description}
              >
                <span className="wb-palette-glyph" aria-hidden>
                  {CIPHER_GLYPH[d.id] ?? d.label.slice(0, 1)}
                </span>
                <span className="wb-palette-text">{d.label}</span>
              </button>
            ))}
          </div>

          {nodes.length > 0 ? (
            <div className="wb-flow-strip-wrap">
              <span className="wb-flow-label">Flow</span>
              <div className="wb-flow-strip" aria-hidden="true">
                {flowItems}
              </div>
            </div>
          ) : null}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={nodes.map((n) => n.instanceId)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="wb-node-list">
                {nodes.map((n, index) => {
                  const def = getCipherDefinition(n.cipherId)
                  const label = def?.label ?? n.cipherId
                  const err = configErrors[n.instanceId]
                  return (
                    <SortableNodeCard key={n.instanceId} id={n.instanceId}>
                      <div className="wb-node-top">
                        <span className="wb-node-index">{index + 1}</span>
                        <div className="wb-node-title">
                          <span className="wb-node-name">{label}</span>
                          <span className="wb-node-id">{n.cipherId}</span>
                        </div>
                        <button
                          type="button"
                          className="wb-icon-btn wb-icon-btn-danger"
                          aria-label={`Remove ${label}`}
                          onClick={() => handleRemove(n.instanceId)}
                        >
                          ✕
                        </button>
                      </div>
                      <NodeConfigForm
                        cipherId={n.cipherId}
                        config={n.config}
                        onChange={(next) => patchConfig(n.instanceId, next)}
                      />
                      {err ? (
                        <p className="wb-node-error" role="alert">
                          {err}
                        </p>
                      ) : null}
                    </SortableNodeCard>
                  )
                })}
              </ol>
            </SortableContext>
          </DndContext>

          {nodes.length === 0 ? (
            <p className="wb-empty">
              Add ciphers from the strip above. You need at least{' '}
              {MIN_PIPELINE_NODES} for a valid cascade.
            </p>
          ) : null}
        </section>

        <section className="wb-panel wb-panel-io" aria-labelledby="io-heading">
          <h2 id="io-heading" className="wb-sr-only">
            Input and output
          </h2>

          <fieldset className="wb-mode">
            <legend className="wb-mode-legend">Direction</legend>
            <div className="wb-segment" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'encrypt'}
                className={mode === 'encrypt' ? 'is-active' : ''}
                onClick={() => {
                  setMode('encrypt')
                  clearOutputs()
                }}
              >
                <span className="wb-segment-ico" aria-hidden>
                  →
                </span>
                Encrypt
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'decrypt'}
                className={mode === 'decrypt' ? 'is-active' : ''}
                onClick={() => {
                  setMode('decrypt')
                  clearOutputs()
                }}
              >
                <span className="wb-segment-ico" aria-hidden>
                  ←
                </span>
                Decrypt
              </button>
            </div>
          </fieldset>

          <label className="wb-field wb-field-block">
            <span className="wb-field-label">
              {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
            </span>
            <textarea
              className="wb-textarea"
              rows={6}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                clearOutputs()
              }}
              spellCheck={false}
              placeholder={
                mode === 'encrypt'
                  ? 'Type a message to encrypt…'
                  : 'Paste ciphertext (e.g. hex from XOR) to decrypt…'
              }
            />
          </label>

          <div className="wb-actions">
            <button
              type="button"
              className="wb-btn wb-btn-primary"
              disabled={!canRun}
              onClick={handleRun}
            >
              Run pipeline
            </button>
            <button
              type="button"
              className="wb-btn wb-btn-secondary"
              disabled={!canRun}
              onClick={handleVerifyRoundTrip}
              title="Encrypts then decrypts; must match input for a valid stack."
            >
              Verify round-trip
            </button>
            <button
              type="button"
              className="wb-btn wb-btn-muted"
              onClick={handleResetDemo}
              title="Restore default 3-node pipeline and sample plaintext."
            >
              Reset demo
            </button>
          </div>
          <p className="wb-kbd-hint">
            Shortcut: <kbd className="wb-kbd">Ctrl</kbd> +{' '}
            <kbd className="wb-kbd">Enter</kbd> to run
          </p>

          {runError ? (
            <div className="wb-alert wb-alert-error" role="alert">
              {runError}
            </div>
          ) : null}

          {roundTripOk !== null ? (
            <div
              className={`wb-alert ${roundTripOk ? 'wb-alert-success' : 'wb-alert-error'}`}
              role="status"
            >
              Round-trip:{' '}
              {roundTripOk
                ? 'PASS — plaintext recovered exactly.'
                : 'FAIL — check configs and order.'}
            </div>
          ) : null}

          {roundTripDetail ? (
            <p className="wb-verify-detail" role="status">
              {roundTripDetail}
            </p>
          ) : null}

          <div className="wb-output-block">
            <div className="wb-output-head">
              <span className="wb-output-label">
                {mode === 'encrypt' ? 'Final ciphertext' : 'Recovered text'}
              </span>
              {result ? (
                <button
                  type="button"
                  className="wb-btn wb-btn-ghost"
                  onClick={handleCopyOutput}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              ) : null}
            </div>
            <output className="wb-output" aria-live="polite">
              {result ? result.output : 'Run the pipeline — output appears here.'}
            </output>
          </div>
        </section>
      </div>

      <section
        className="wb-panel wb-panel-steps"
        aria-labelledby="steps-heading"
      >
        <div className="wb-steps-head">
          <h2 id="steps-heading">Hop-by-hop trace</h2>
          <p className="wb-steps-intro">{stepIntro}</p>
        </div>
        {result && result.steps.length > 0 ? (
          <div className="wb-steps-grid" key={runGeneration}>
            {result.steps.map((s, i) => (
              <article
                key={`${s.instanceId}-${i}-${runGeneration}`}
                className="wb-step-card"
                style={
                  {
                    '--wb-step-delay': `${i * 70}ms`,
                  } as CSSProperties
                }
              >
                <header className="wb-step-head">
                  <span className="wb-step-num">{i + 1}</span>
                  <span className="wb-step-title">{s.label}</span>
                </header>
                <div className="wb-step-body">
                  <div className="wb-step-col">
                    <div className="wb-step-col-head">
                      <span>In</span>
                      <button
                        type="button"
                        className="wb-step-copy"
                        onClick={() =>
                          copyStepField(`in-${i}`, s.input)
                        }
                      >
                        {copiedField === `in-${i}` ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <pre className="wb-step-pre">{s.input}</pre>
                  </div>
                  <div className="wb-step-mid" aria-hidden="true">
                    →
                  </div>
                  <div className="wb-step-col">
                    <div className="wb-step-col-head">
                      <span>Out</span>
                      <button
                        type="button"
                        className="wb-step-copy"
                        onClick={() =>
                          copyStepField(`out-${i}`, s.output)
                        }
                      >
                        {copiedField === `out-${i}` ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <pre className="wb-step-pre">{s.output}</pre>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="wb-steps-empty">
            <p className="wb-muted">
              Run the pipeline to see every transformation between nodes — this
              is your correctness proof.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
