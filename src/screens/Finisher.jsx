import { useEffect, useRef, useState } from 'react'
import BottomBar, { BarraSalir, BotonBarra, BotonSalir } from '../components/BottomBar.jsx'

/** Cronómetro ascendente: solo mide, no hay tiempo objetivo ni cuenta regresiva. */
function useCronometroAscendente(corriendo) {
  const [transcurrido, setTranscurrido] = useState(0)
  const inicioRef = useRef(null)

  useEffect(() => {
    if (!corriendo) return
    if (inicioRef.current === null) inicioRef.current = performance.now()
    const id = setInterval(() => {
      setTranscurrido(Math.floor((performance.now() - inicioRef.current) / 1000))
    }, 250)
    return () => clearInterval(id)
  }, [corriendo])

  return transcurrido
}

function reloj(segundos) {
  const min = Math.floor(segundos / 60)
  return `${min}:${String(segundos % 60).padStart(2, '0')}`
}

export default function Finisher({ fase, onCompletar, onSaltar, onSalir }) {
  const { esquema, ejercicios } = fase
  const [hechos, setHechos] = useState(() => new Set())
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  const completo = hechos.size === esquema.length * ejercicios.length
  const tiempo = useCronometroAscendente(!completo)

  const escalonHecho = (e) => ejercicios.every((_, j) => hechos.has(`${e}:${j}`))
  // El escalón actual es el primero sin terminar: se deriva, no hace falta guardarlo.
  const actual = esquema.findIndex((_, e) => !escalonHecho(e))

  const alternar = (e, j) => {
    setHechos((previos) => {
      const copia = new Set(previos)
      const clave = `${e}:${j}`
      if (copia.has(clave)) copia.delete(clave)
      else copia.add(clave)
      return copia
    })
  }

  return (
    <section className="finisher">
      <header className="finisher-cabecera">
        <BotonSalir onClick={() => setConfirmandoSalida(true)} />
        <p className="label">{fase.bloqueNombre}</p>
        <p className="finisher-reloj" data-completo={completo}>
          {reloj(tiempo)}
        </p>
      </header>

      <ol className="finisher-escalones">
        {esquema.map((reps, e) => (
          <li
            key={e}
            className="escalon"
            data-estado={escalonHecho(e) ? 'hecho' : e === actual ? 'actual' : 'pendiente'}
          >
            <span className="escalon-reps">{reps}</span>
            <div className="escalon-ejercicios">
              {ejercicios.map((ejercicio, j) => (
                <button
                  key={ejercicio}
                  className="check"
                  aria-pressed={hechos.has(`${e}:${j}`)}
                  onClick={() => alternar(e, j)}
                >
                  {ejercicio}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {confirmandoSalida ? (
        <BarraSalir onCancelar={() => setConfirmandoSalida(false)} onSalir={onSalir} />
      ) : (
        <BottomBar>
          {completo ? (
            <BotonBarra onClick={onCompletar} variante="activo">
              Seguir · {reloj(tiempo)}
            </BotonBarra>
          ) : (
            <BotonBarra onClick={onSaltar}>Saltar bloque</BotonBarra>
          )}
        </BottomBar>
      )}
    </section>
  )
}
