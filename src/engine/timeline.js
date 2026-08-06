// Expande los bloques de una sesión a un array plano de fases.
//
// La idea: precalcular TODA la sesión acá, para que el motor del reloj no tenga
// que saber nada de rondas ni de tipos de bloque — solo avanza un índice.
// Con eso, "saltar bloque" y "Sigue: …" salen gratis.
//
// Forma de una fase:
//   {
//     tipo: 'prepara' | 'trabajo' | 'descanso' | 'libre' | 'finisher',
//     duracion,            // segundos. null en finisher (no va por reloj).
//     bloqueIdx,           // índice del bloque de origen → para saltar bloque
//     bloqueNombre,
//     ejercicio,           // null si no aplica (descansos largos, warmup, prepara)
//     ronda, totalRondas,  // null si no aplica
//     motivo,              // en descansos: 'ronda' | 'tabata' | null
//     items,               // solo warmup/cooldown: lista de guía en pantalla
//     esquema,             // solo finisher
//     ejercicios,          // solo finisher
//     interactivo,         // true solo en finisher: el motor se detiene y espera a la UI
//   }

const PREPARA = 5 // countdown de entrada antes del primer trabajo de un bloque

function nuevaFase(base) {
  return {
    tipo: base.tipo,
    duracion: base.duracion ?? null,
    bloqueIdx: base.bloqueIdx,
    bloqueNombre: base.bloqueNombre,
    ejercicio: base.ejercicio ?? null,
    ronda: base.ronda ?? null,
    totalRondas: base.totalRondas ?? null,
    motivo: base.motivo ?? null,
    items: base.items ?? null,
    esquema: base.esquema ?? null,
    ejercicios: base.ejercicios ?? null,
    interactivo: base.interactivo ?? false,
  }
}

// warmup / cooldown → un único countdown, con los items como guía en pantalla.
// No llevan 'prepará': no hay fase de trabajo que anticipar.
function expandirLibre(bloque, bloqueIdx) {
  return [
    nuevaFase({
      tipo: 'libre',
      duracion: bloque.duracion,
      bloqueIdx,
      bloqueNombre: bloque.nombre,
      items: bloque.items,
    }),
  ]
}

// intervals → por cada ronda, cada ejercicio hace trabajo + descanso.
// Al cerrar la ronda, si no es la última, se suma descansoEntreRondas.
function expandirIntervals(bloque, bloqueIdx) {
  const { trabajo, descanso, rondas, descansoEntreRondas, ejercicios } = bloque
  const comun = { bloqueIdx, bloqueNombre: bloque.nombre, totalRondas: rondas }
  const fases = [nuevaFase({ ...comun, tipo: 'prepara', duracion: PREPARA, ronda: 1 })]

  for (let ronda = 1; ronda <= rondas; ronda++) {
    for (const ejercicio of ejercicios) {
      fases.push(nuevaFase({ ...comun, tipo: 'trabajo', duracion: trabajo, ejercicio, ronda }))
      fases.push(nuevaFase({ ...comun, tipo: 'descanso', duracion: descanso, ronda }))
    }
    if (ronda < rondas) {
      fases.push(
        nuevaFase({ ...comun, tipo: 'descanso', duracion: descansoEntreRondas, ronda, motivo: 'ronda' }),
      )
    }
  }

  return fases
}

// tabata → por cada ejercicio, `rondas` vueltas de trabajo/descanso (20/10).
// Entre un tabata y el siguiente, descansoEntreTabatas.
function expandirTabata(bloque, bloqueIdx) {
  const { trabajo, descanso, rondas, descansoEntreTabatas, ejercicios } = bloque
  const comun = { bloqueIdx, bloqueNombre: bloque.nombre, totalRondas: rondas }
  const fases = [nuevaFase({ ...comun, tipo: 'prepara', duracion: PREPARA, ronda: 1 })]

  ejercicios.forEach((ejercicio, i) => {
    for (let ronda = 1; ronda <= rondas; ronda++) {
      fases.push(nuevaFase({ ...comun, tipo: 'trabajo', duracion: trabajo, ejercicio, ronda }))
      fases.push(nuevaFase({ ...comun, tipo: 'descanso', duracion: descanso, ejercicio, ronda }))
    }
    if (i < ejercicios.length - 1) {
      fases.push(
        nuevaFase({ ...comun, tipo: 'descanso', duracion: descansoEntreTabatas, motivo: 'tabata' }),
      )
    }
  })

  return fases
}

// finisher → una sola fase interactiva. No se expande y no lleva duración:
// el motor se detiene acá hasta que la UI (el checklist) avisa que terminó.
function expandirFinisher(bloque, bloqueIdx) {
  return [
    nuevaFase({
      tipo: 'finisher',
      duracion: null,
      bloqueIdx,
      bloqueNombre: bloque.nombre,
      esquema: bloque.esquema,
      ejercicios: bloque.ejercicios,
      interactivo: true,
    }),
  ]
}

const EXPANSORES = {
  warmup: expandirLibre,
  cooldown: expandirLibre,
  intervals: expandirIntervals,
  tabata: expandirTabata,
  finisher: expandirFinisher,
}

/** Sesión (día del PLAN) → array plano de fases. */
export function construirTimeline(sesion) {
  return sesion.bloques.flatMap((bloque, i) => {
    const expandir = EXPANSORES[bloque.tipo]
    if (!expandir) throw new Error(`Tipo de bloque desconocido: ${bloque.tipo}`)
    return expandir(bloque, i)
  })
}

/** Segundos cronometrados de la sesión. El finisher no suma: no va por reloj. */
export function duracionTotal(timeline) {
  return timeline.reduce((total, fase) => total + (fase.duracion ?? 0), 0)
}

/** Índice de la primera fase del bloque siguiente al de `faseIdx`. -1 si no hay. */
export function inicioProximoBloque(timeline, faseIdx) {
  const bloqueActual = timeline[faseIdx].bloqueIdx
  return timeline.findIndex((fase, i) => i > faseIdx && fase.bloqueIdx > bloqueActual)
}

/**
 * Qué anunciar en el "Sigue: …". Busca el próximo trabajo dentro del bloque actual;
 * si el bloque se termina antes, anuncia el bloque que viene. `null` si es el final.
 */
export function queSigue(timeline, faseIdx) {
  const bloqueActual = timeline[faseIdx].bloqueIdx
  for (let i = faseIdx + 1; i < timeline.length; i++) {
    if (timeline[i].bloqueIdx !== bloqueActual) return timeline[i].bloqueNombre
    if (timeline[i].tipo === 'trabajo') return timeline[i].ejercicio
  }
  return null
}

/** "30 min" / "5:30" para mostrar duraciones estimadas. */
export function formatearDuracion(segundos) {
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  return seg === 0 ? `${min} min` : `${min}:${String(seg).padStart(2, '0')}`
}

/** "~31 min" para las cards del home, donde el segundo exacto no aporta nada. */
export function formatearMinutos(segundos) {
  return `~${Math.round(segundos / 60)} min`
}
