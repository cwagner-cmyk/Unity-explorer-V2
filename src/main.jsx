import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import UnityReportExplorerUnified from '../UnityReportExplorer_Unified.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UnityReportExplorerUnified />
  </StrictMode>
)

