// Lógica pura del reloj, sin React. Todo se deriva del reloj real (milisegundos de
// `performance.now()`), nunca de contar ticks: si el móvil apaga la pantalla o el
// navegador estrangula el intervalo, los ticks se pierden pero el reloj no miente.
//
// Convención: `finEn` es el timestamp en ms en que termina la fase actual, o `null`
// si la fase no va por reloj (el finisher).

/** Timestamp de fin de la fase `idx` si arranca en `ahora`. `null` si es interactiva. */
export function finDeFase(timeline, idx, ahora) {
  const fase = timeline[idx]
  return fase.interactivo ? null : ahora + fase.duracion * 1000
}

/** Segundos que faltan, redondeados hacia arriba (una fase de 40s muestra 40 al arrancar). */
export function segundosRestantes(finEn, ahora) {
  if (finEn === null) return null
  return Math.max(0, Math.ceil((finEn - ahora) / 1000))
}

/**
 * Avanza tantas fases como haga falta para ponerse al día con `ahora`.
 *
 * Encadena desde el `finEn` anterior (no desde `ahora`), así el error no se acumula:
 * si un tick llega 80 ms tarde, esos 80 ms no se le regalan a la fase siguiente.
 *
 * Si en el camino cae una fase interactiva, corta ahí: el tiempo sobrante se descarta,
 * que es lo correcto — el finisher no va por reloj y espera a que la UI lo cierre.
 */
export function avanzarFases(timeline, idx, finEn, ahora) {
  let i = idx
  let fin = finEn

  while (fin !== null && ahora >= fin) {
    i += 1
    if (i >= timeline.length) {
      return { idx: timeline.length - 1, finEn: null, terminado: true }
    }
    fin = timeline[i].interactivo ? null : fin + timeline[i].duracion * 1000
  }

  return { idx: i, finEn: fin, terminado: false }
}
