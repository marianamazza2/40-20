import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Autoalojadas: se empaquetan con el build, sin pedidos a Google en cada arranque.
// Solo el subset latin y los pesos que se usan — la app se abre entrenando, con la
// conexión que haya.
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
