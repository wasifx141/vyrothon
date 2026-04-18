import { AppToaster } from './components/AppToaster'
import { PipelineWorkbench } from './components/PipelineWorkbench'
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <AppToaster />
      <PipelineWorkbench />
    </ThemeProvider>
  )
}

export default App
