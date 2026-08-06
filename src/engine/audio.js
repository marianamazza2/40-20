// Avisos sonoros con Web Audio API. Sin assets: todo son osciladores.
//
// iOS: el AudioContext nace 'suspended' y SOLO se puede desbloquear dentro de un
// gesto real del usuario. Por eso `despertarAudio()` se llama en el tap que arranca
// la sesión, no en el primer beep — si no, en iPhone no suena nada y el síntoma
// (silencio total, sin error en consola) es confuso de diagnosticar.

let ctx = null

/** Fases cuyos últimos 3 segundos llevan cuenta regresiva sonora. */
const CON_CUENTA_ATRAS = new Set(['trabajo', 'prepara'])

function tono(frecuencia, desfase, duracion, volumen) {
  const t0 = ctx.currentTime + desfase
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = frecuencia

  // Rampa corta en la entrada y caída exponencial: sin esto se escucha un clic.
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.linearRampToValueAtTime(volumen, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion)

  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duracion + 0.02)
}

/** Debe llamarse DENTRO de un gesto del usuario (el tap de empezar). */
export function despertarAudio() {
  if (!ctx) {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext
    if (!AudioCtx) return
    ctx = new AudioCtx()
    // Al volver de segundo plano el contexto queda suspendido: hay que revivirlo.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ctx?.resume()
    })
  }
  ctx.resume()
  // Un tono inaudible termina de destrabar la salida en iOS.
  tono(440, 0, 0.02, 0.0002)
}

/** Cambio de fase: agudo y seco al entrar en trabajo, grave y largo al descansar. */
export function sonarCambioDeFase(tipo) {
  if (!ctx) return
  if (tipo === 'trabajo') tono(1180, 0, 0.16, 0.3)
  else if (tipo === 'prepara') tono(760, 0, 0.14, 0.22)
  else tono(520, 0, 0.24, 0.24)
}

/** Bloque terminado: triple, para que se distinga de un cambio de fase cualquiera. */
export function sonarFinDeBloque() {
  if (!ctx) return
  tono(660, 0, 0.12, 0.28)
  tono(880, 0.16, 0.12, 0.28)
  tono(1320, 0.32, 0.3, 0.3)
}

/** Uno de los últimos 3 segundos de una fase de trabajo. */
export function sonarCuentaAtras() {
  if (!ctx) return
  tono(880, 0, 0.07, 0.22)
}

export function llevaCuentaAtras(tipo) {
  return CON_CUENTA_ATRAS.has(tipo)
}
