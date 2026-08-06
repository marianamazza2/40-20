import { useCallback, useEffect, useRef } from 'react'
import { useTimer } from '../engine/useTimer.js'
import { useWakeLock } from '../engine/useWakeLock.js'
import { queSigue } from '../engine/timeline.js'
import {
  llevaCuentaAtras,
  sonarCambioDeFase,
  sonarCuentaAtras,
  sonarFinDeBloque,
} from '../engine/audio.js'
import BottomBar, { BotonBarra } from '../components/BottomBar.jsx'
import Finisher from './Finisher.jsx'

const ETIQUETAS = {
  prepara: 'Prepará',
  trabajo: 'Trabajo',
  descanso: 'Descanso',
}

function etiquetaEstado(fase) {
  if (fase.motivo === 'ronda') return 'Entre rondas'
  if (fase.motivo === 'tabata') return 'Entre tabatas'
  return ETIQUETAS[fase.tipo] ?? fase.bloqueNombre
}

export default function Session({ timeline, onTerminar }) {
  const bloqueAnteriorRef = useRef(null)

  const alCambiarFase = useCallback((fase) => {
    const anterior = bloqueAnteriorRef.current
    bloqueAnteriorRef.current = fase.bloqueIdx
    if (anterior !== null && fase.bloqueIdx !== anterior) sonarFinDeBloque()
    else sonarCambioDeFase(fase.tipo)
  }, [])

  const alTerminar = useCallback(() => {
    sonarFinDeBloque()
    onTerminar()
  }, [onTerminar])

  const t = useTimer(timeline, { onCambioFase: alCambiarFase, onFin: alTerminar })
  const { fase, restante, corriendo, terminado, empezar } = t

  // Se mantiene también en pausa: parás para recuperar aire, no para que se apague.
  useWakeLock(!terminado)

  // La sesión arranca sola al montar: el tap de EMPEZAR ya fue en la preview.
  useEffect(() => {
    empezar()
  }, [empezar])

  // Cuenta regresiva de los últimos 3s. `restante` solo cambia una vez por segundo,
  // así que el efecto dispara un tic por segundo aunque el tick corra a 100 ms.
  useEffect(() => {
    if (!corriendo || terminado) return
    if (!llevaCuentaAtras(fase.tipo)) return
    if (restante > 0 && restante <= 3) sonarCuentaAtras()
  }, [restante, corriendo, terminado, fase.tipo])

  // Al terminar, App cambia de pantalla y este componente se desmonta.
  if (terminado) return null

  // El finisher no va por reloj: se lleva la pantalla entera con su propio checklist.
  if (fase.interactivo) {
    return <Finisher fase={fase} onCompletar={t.completarInteractiva} onSaltar={t.saltarBloque} />
  }

  const sigue = queSigue(timeline, t.faseIdx)

  return (
    <section className="sesion" data-tipo={fase.tipo}>
      <header className="sesion-cabecera">
        <p className="label">{fase.bloqueNombre}</p>
        {fase.ronda && (
          <p className="label">
            Ronda {fase.ronda}/{fase.totalRondas}
          </p>
        )}
      </header>

      <div className="sesion-centro">
        <p className="sesion-estado">{etiquetaEstado(fase)}</p>
        {fase.ejercicio && <p className="sesion-ejercicio">{fase.ejercicio}</p>}
        <p className="sesion-cuenta">{restante}</p>
        {fase.items && (
          <ul className="sesion-items">
            {fase.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <footer className="sesion-pie">
        {sigue && <p className="sesion-sigue">Sigue: {sigue}</p>}
      </footer>

      <BottomBar>
        <BotonBarra onClick={t.alternarPausa} variante={corriendo ? 'normal' : 'activo'}>
          {corriendo ? 'Pausa' : 'Reanudar'}
        </BotonBarra>
        <BotonBarra onClick={t.saltarBloque}>Saltar bloque</BotonBarra>
      </BottomBar>
    </section>
  )
}

