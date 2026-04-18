import { useCallback, useEffect, useState } from 'react'
import { BookOpen, TerminalSquare, Settings, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import type { CipherListItem } from '@/cipher-ui'
import {
  assertRoundTrip,
  buildPreset,
  MIN_PIPELINE_NODES,
  newNodeId,
  pipelinePresets,
  starterPipeline,
  type PipelineNode,
} from '@/cipherstack'
import { useChainDNA } from '@/hooks/useChainDNA'
import { usePipeline } from '@/hooks/usePipeline'
import { usePipelineStorage } from '@/hooks/usePipelineStorage'
import { CipherLibrary } from './CipherLibrary'
import { ControlPanel, type Mode } from './ControlPanel'
import { IntermediateSteps } from './IntermediateSteps'
import { PipelineCanvas } from './PipelineCanvas'
import { ThemeToggle } from './ThemeToggle'

type MobileTab = 'library' | 'pipeline' | 'control'

export function PipelineWorkbench() {
  const [nodes, setNodes] = useState<PipelineNode[]>(starterPipeline)
  const [mode, setMode] = useState<Mode>('encrypt')
  const [mobileTab, setMobileTab] = useState<MobileTab>('pipeline')
  const [inputText, setInputText] = useState('Hello, World! 123')
  const [livePreview, setLivePreview] = useState(true)
  const [interactionError, setInteractionError] = useState<string | null>(null)
  const [roundTrip, setRoundTrip] = useState<{
    ok: boolean
    ts: number
  } | null>(null)

  const {
    steps,
    finalOutput,
    pipelineError,
    isValid,
    run,
    isRunning,
    activeNodeId,
    hasRun,
    setHasRun,
  } = usePipeline(nodes, inputText, mode, { livePreview, debounceMs: 300 })

  const dna = useChainDNA(nodes)
  const { exportPipeline, importPipeline } = usePipelineStorage()

  const clearAfterStructureChange = useCallback(() => {
    setHasRun(false)
    setRoundTrip(null)
    setInteractionError(null)
  }, [setHasRun])

  useEffect(() => {
    document.title = 'CipherStack — Cascade Encryption Pipeline'
  }, [])

  useEffect(() => {
    /* clear action errors when the pipeline or input context changes */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on dependency change
    setInteractionError(null)
  }, [inputText, nodes, mode])

  const canRun = nodes.length >= MIN_PIPELINE_NODES && isValid

  const onAdd = useCallback(
    (cipher: CipherListItem) => {
      setNodes((ns) => [
        ...ns,
        {
          id: newNodeId(),
          cipherId: cipher.id,
          config: { ...cipher.defaultConfig },
        },
      ])
      clearAfterStructureChange()
    },
    [clearAfterStructureChange],
  )

  const onRun = useCallback(async () => {
    setInteractionError(null)
    if (!canRun) {
      setInteractionError(
        nodes.length < MIN_PIPELINE_NODES
          ? `Pipeline requires at least ${MIN_PIPELINE_NODES} nodes`
          : 'Fix configuration errors on highlighted nodes.',
      )
      return
    }
    await run()
  }, [canRun, nodes.length, run])

  const onVerify = useCallback(() => {
    setInteractionError(null)
    if (!canRun) {
      setInteractionError('Pipeline requires at least 3 valid nodes')
      return
    }
    try {
      const { ok } = assertRoundTrip(nodes, inputText)
      setRoundTrip({ ok, ts: Date.now() })
      if (ok) toast.success('Round-trip verified')
      else toast.error('Round-trip mismatch')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRoundTrip({ ok: false, ts: Date.now() })
      toast.error(msg)
    }
  }, [canRun, nodes, inputText])

  const onExport = useCallback(() => {
    exportPipeline(nodes, dna)
  }, [exportPipeline, nodes, dna])

  const onImport = useCallback(
    async (file: File) => {
      const next = await importPipeline(file)
      if (!next) return
      setNodes(next)
      clearAfterStructureChange()
    },
    [importPipeline, clearAfterStructureChange],
  )

  const onPreset = useCallback(
    (presetId: string) => {
      const label =
        pipelinePresets.find((p) => p.id === presetId)?.label ?? presetId
      setNodes(buildPreset(presetId))
      clearAfterStructureChange()
      toast.success(`Loaded ${label}`)
    },
    [clearAfterStructureChange],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        void onRun()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onRun])

  const errorMessage = interactionError ?? pipelineError
  const output = errorMessage ? '' : finalOutput

  const gatedSteps = hasRun || livePreview ? steps : []

  const mobileTabs: { id: MobileTab; label: string; Icon: typeof BookOpen }[] = [
    { id: 'library', label: 'Library', Icon: BookOpen },
    { id: 'pipeline', label: 'Pipeline', Icon: Workflow },
    { id: 'control', label: 'Control', Icon: Settings },
  ]

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:h-14 md:px-6">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background md:h-9 md:w-9">
            <TerminalSquare size={15} className="md:hidden" />
            <TerminalSquare size={17} className="hidden md:block" />
          </div>
          <div>
            <h1 className="font-display text-[15px] font-bold leading-none tracking-tight text-foreground md:text-[17px]">
              CipherStack
            </h1>
            <p className="mt-0.5 hidden text-[10.5px] tracking-wide text-muted-foreground sm:block md:mt-1">
              Cascade Encryption Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-md border border-border bg-secondary px-2.5 py-1.5 font-mono-c text-[10.5px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            client-side · zero-network
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Cipher Library — full-screen on mobile when active, fixed sidebar on desktop */}
        <div
          className={`${mobileTab === 'library' ? 'flex' : 'hidden'} w-full flex-col md:flex md:w-auto`}
        >
          <CipherLibrary onAdd={(c) => { onAdd(c); setMobileTab('pipeline') }} />
        </div>

        {/* Pipeline Canvas — full-screen on mobile when active */}
        <main
          className={`${mobileTab === 'pipeline' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col md:flex`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PipelineCanvas
              nodes={nodes}
              setNodes={setNodes}
              activeNodeId={activeNodeId}
              steps={gatedSteps}
              direction={mode}
              isRunning={isRunning}
            />
            <div className="px-4 pb-4 md:px-8 md:pb-8">
              <IntermediateSteps steps={gatedSteps} direction={mode} />
            </div>
          </div>
        </main>

        {/* Control Panel — full-screen on mobile when active, fixed sidebar on desktop */}
        <div
          className={`${mobileTab === 'control' ? 'flex' : 'hidden'} w-full flex-col md:flex md:w-auto`}
        >
          <ControlPanel
            mode={mode}
            setMode={(m) => {
              setMode(m)
              setRoundTrip(null)
              setInteractionError(null)
              setHasRun(false)
            }}
            inputText={inputText}
            setInputText={(s) => {
              setInputText(s)
              setRoundTrip(null)
              setHasRun(false)
            }}
            livePreview={livePreview}
            setLivePreview={setLivePreview}
            onRun={onRun}
            onVerify={onVerify}
            output={output}
            error={errorMessage}
            isRunning={isRunning}
            roundTrip={roundTrip}
            dna={dna}
            onExport={onExport}
            onImport={onImport}
            onPreset={onPreset}
            canRun={canRun}
          />
        </div>
      </div>

      {/* Mobile bottom tab navigation */}
      <nav className="flex shrink-0 border-t border-border bg-card md:hidden">
        {mobileTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileTab(id)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              mobileTab === id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon
              size={18}
              strokeWidth={mobileTab === id ? 2.4 : 1.8}
              className={mobileTab === id ? 'text-foreground' : ''}
            />
            {label}
            {mobileTab === id && (
              <span className="absolute bottom-0 h-0.5 w-10 rounded-t-full bg-foreground" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
