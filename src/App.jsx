import { useMemo, useState } from 'react'
import { PLAN } from './data/plan.js'
import { construirTimeline } from './engine/timeline.js'
import { despertarAudio } from './engine/audio.js'
import Home from './screens/Home.jsx'
import Preview from './screens/Preview.jsx'
import Session from './screens/Session.jsx'
import Done from './screens/Done.jsx'

// Navegación por estado, sin router: son cuatro pantallas y una sola ruta.
export default function App() {
  const [pantalla, setPantalla] = useState('home')
  const [dia, setDia] = useState(null)

  const timeline = useMemo(() => (dia ? construirTimeline(PLAN[dia]) : null), [dia])

  const elegirDia = (d) => {
    setDia(d)
    setPantalla('preview')
  }

  const empezar = () => {
    // Este tap es el gesto que destraba el audio en iOS. Tiene que ser sincrónico.
    despertarAudio()
    setPantalla('sesion')
  }

  const volverAlHome = () => {
    setDia(null)
    setPantalla('home')
  }

  switch (pantalla) {
    case 'preview':
      return (
        <Preview
          sesion={PLAN[dia]}
          timeline={timeline}
          onEmpezar={empezar}
          onVolver={volverAlHome}
        />
      )
    case 'sesion':
      return <Session timeline={timeline} onTerminar={() => setPantalla('fin')} />
    case 'fin':
      return <Done sesion={PLAN[dia]} onVolver={volverAlHome} />
    default:
      return <Home onElegir={elegirDia} />
  }
}
