/** Reactアプリのエントリーポイント。index.htmlの#rootへAppを描画します。 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// StrictModeを有効にし、開発中に副作用やcleanup漏れを見つけやすくします。
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
