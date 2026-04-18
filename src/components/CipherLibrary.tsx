import { motion } from 'framer-motion'
import { Plus, Settings2 } from 'lucide-react'
import { listCipherListItems, type CipherListItem } from '@/cipher-ui'

interface Props {
  onAdd: (cipher: CipherListItem) => void
}

export function CipherLibrary({ onAdd }: Props) {
  const items = listCipherListItems()
  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-card p-4 md:w-[280px] md:shrink-0 md:p-5">
      <div className="mb-5">
        <div className="text-eyebrow mb-1">Cipher Library</div>
      </div>

      <div className="space-y-2.5">
        {items.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group relative rounded-lg border border-border bg-background transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="p-3">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
                    style={{
                      background: `hsl(${c.colorHsl} / 0.12)`,
                      color: `hsl(${c.colorHsl})`,
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[14px] font-semibold leading-tight text-foreground">
                        {c.label}
                      </h3>
                      {c.configFields.length > 0 ? (
                        <Settings2 size={11} className="text-muted-foreground" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                      {c.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(c)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-secondary py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  <Plus size={12} strokeWidth={3} />
                  Add
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </aside>
  )
}
