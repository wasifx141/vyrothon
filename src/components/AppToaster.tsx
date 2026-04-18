import { Toaster } from 'sonner'
import { useTheme } from './use-theme'

export function AppToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      toastOptions={{
        classNames: {
          toast:
            'group border border-border bg-background text-foreground shadow-lg',
        },
      }}
    />
  )
}
