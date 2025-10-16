import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 导入所有CSS文件（顺序很重要）
import './styles/legacy-bridge.css'
import './index.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* noop */
    })
  })
}
