import { useEffect } from 'react'
import { PipelineWorkbench } from './components/PipelineWorkbench'
import './App.css'

function App() {
  useEffect(() => {
    document.body.classList.add('app-cipherstack')
    return () => document.body.classList.remove('app-cipherstack')
  }, [])

  return (
    <div className="cs-root">
      <PipelineWorkbench />
    </div>
  )
}

export default App
