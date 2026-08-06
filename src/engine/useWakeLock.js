import { useEffect, useRef } from 'react'

/**
 * Mantiene la pantalla encendida mientras `activo` sea true.
 *
 * El navegador suelta el lock solo al pasar la pestaña a segundo plano (cambiar de app,
 * bloquear el teléfono), y no lo devuelve al volver: hay que pedirlo de nuevo a mano.
 *
 * Todo va en try/catch a propósito. La API no existe en todos lados y el navegador
 * puede negarla (batería baja, por ejemplo); nada de eso debe cortar el entrenamiento.
 */
export function useWakeLock(activo) {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return

    let cancelado = false

    const pedir = async () => {
      if (lockRef.current || document.visibilityState !== 'visible') return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelado) {
          lock.release()
          return
        }
        lockRef.current = lock
        lock.addEventListener('release', () => {
          lockRef.current = null
        })
      } catch {
        // Sin lock se entrena igual: la pantalla se apaga y listo.
      }
    }

    const alVolver = () => {
      if (document.visibilityState === 'visible') pedir()
    }

    pedir()
    document.addEventListener('visibilitychange', alVolver)

    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', alVolver)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [activo])
}
