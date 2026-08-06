import { useCallback, useEffect, useRef, useState } from 'react'
import { inicioProximoBloque } from './timeline.js'
import { avanzarFases, finDeFase, segundosRestantes } from './reloj.js'

// El intervalo solo dispara el repintado; la cuenta sale del reloj real (ver reloj.js).
// 100 ms alcanza para que el número cambie a tiempo sin gastar batería de más.
const TICK = 100

/**
 * Motor de la sesión: recorre el timeline avanzando un índice.
 *
 * `onCambioFase(fase, idx)` se usa para el audio (Paso 5).
 * `onFin()` dispara la pantalla de cierre.
 */
export function useTimer(timeline, { onCambioFase, onFin } = {}) {
  const [faseIdx, setFaseIdx] = useState(0)
  const [restante, setRestante] = useState(() => timeline[0]?.duracion ?? null)
  const [corriendo, setCorriendo] = useState(false)
  const [terminado, setTerminado] = useState(false)

  const faseIdxRef = useRef(0)
  const finEnRef = useRef(null)
  const restanteMsRef = useRef(null) // congelado mientras está en pausa

  // Los callbacks van por ref para que el intervalo no se reinicie en cada render.
  const cbRef = useRef({ onCambioFase, onFin })
  useEffect(() => {
    cbRef.current = { onCambioFase, onFin }
  })

  const finalizar = useCallback(() => {
    finEnRef.current = null
    restanteMsRef.current = null
    setCorriendo(false)
    setTerminado(true)
    setRestante(0)
    cbRef.current.onFin?.()
  }, [])

  const irAFase = useCallback(
    (idx, ahora, enPausa) => {
      faseIdxRef.current = idx
      finEnRef.current = finDeFase(timeline, idx, ahora)
      // Si saltamos estando en pausa, hay que congelar la fase nueva también.
      restanteMsRef.current =
        enPausa && finEnRef.current !== null ? finEnRef.current - ahora : null
      setFaseIdx(idx)
      setRestante(segundosRestantes(finEnRef.current, ahora))
      cbRef.current.onCambioFase?.(timeline[idx], idx)
    },
    [timeline],
  )

  const tick = useCallback(() => {
    const ahora = performance.now()
    const r = avanzarFases(timeline, faseIdxRef.current, finEnRef.current, ahora)

    if (r.terminado) {
      finalizar()
      return
    }

    if (r.idx !== faseIdxRef.current) {
      faseIdxRef.current = r.idx
      finEnRef.current = r.finEn
      setFaseIdx(r.idx)
      cbRef.current.onCambioFase?.(timeline[r.idx], r.idx)
    }

    setRestante(segundosRestantes(finEnRef.current, ahora))
  }, [timeline, finalizar])

  useEffect(() => {
    if (!corriendo || terminado) return
    const id = setInterval(tick, TICK)
    return () => clearInterval(id)
  }, [corriendo, terminado, tick])

  // Al volver de segundo plano, ponerse al día sin esperar al próximo tick.
  useEffect(() => {
    if (!corriendo) return
    const alVolver = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [corriendo, tick])

  const empezar = useCallback(() => {
    setTerminado(false)
    setCorriendo(true)
    irAFase(0, performance.now(), false)
  }, [irAFase])

  const alternarPausa = useCallback(() => {
    const ahora = performance.now()
    if (corriendo) {
      // Guardar el resto exacto en ms, no en segundos: reanudar no debe regalar tiempo.
      restanteMsRef.current = finEnRef.current === null ? null : finEnRef.current - ahora
      setCorriendo(false)
    } else {
      if (restanteMsRef.current !== null) finEnRef.current = ahora + restanteMsRef.current
      setCorriendo(true)
    }
  }, [corriendo])

  const saltarBloque = useCallback(() => {
    const siguiente = inicioProximoBloque(timeline, faseIdxRef.current)
    if (siguiente === -1) {
      finalizar()
      return
    }
    irAFase(siguiente, performance.now(), !corriendo)
  }, [timeline, irAFase, finalizar, corriendo])

  /** Cierra una fase interactiva (el finisher) y sigue con la que viene. */
  const completarInteractiva = useCallback(() => {
    const siguiente = faseIdxRef.current + 1
    if (siguiente >= timeline.length) {
      finalizar()
      return
    }
    irAFase(siguiente, performance.now(), !corriendo)
  }, [timeline, irAFase, finalizar, corriendo])

  return {
    faseIdx,
    fase: timeline[faseIdx],
    proximaFase: timeline[faseIdx + 1] ?? null,
    restante,
    corriendo,
    terminado,
    empezar,
    alternarPausa,
    saltarBloque,
    completarInteractiva,
  }
}
