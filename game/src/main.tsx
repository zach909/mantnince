import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { useBugStore } from './state/bugStore'
import { useActivityLog } from './state/activityLog'
import { bugRegistry } from './state/bugRegistry'

if (import.meta.env.DEV) {
  ;(window as any).__stores = { bugStore: useBugStore, activityLog: useActivityLog, bugRegistry }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
