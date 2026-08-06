# PASOS · Construcción de la App HIIT Timer

Plan de implementación incremental para el [brief](./brief-app-hiit.md).
Cada paso deja la app **corriendo y usable** — nada de etapas que rompan el build.
Al final de cada paso hay un **"Listo cuando"**: si no lo cumplís, no pases al siguiente.

Orden pensado para que lo más riesgoso (el motor del timer) llegue temprano y con poca UI encima,
y lo cosmético quede al final donde es barato iterar.

---

## Paso 0 · Esqueleto y deploy vacío

**Objetivo:** tener el tubo completo (local → Vercel) funcionando antes de escribir lógica.

- `npm create vite@latest . -- --template react` (JS, sin TS — el brief pide simple).
- Limpiar el boilerplate: borrar `App.css`, logos, contenido de `index.css`.
- Setear `<meta name="viewport">` con `viewport-fit=cover` y `<title>`.
- `App.jsx` que renderice un "40·20" centrado.
- Deploy a Vercel (`vercel` → link → `vercel --prod`).

**Estructura de archivos objetivo** (a la que vamos llegando, no hace falta crearla toda ahora):

```
src/
  App.jsx            # router de pantallas (estado, sin react-router)
  data/plan.js       # PLAN, WARMUP, COOLDOWN
  engine/timeline.js # expansión de bloques → fases
  engine/useTimer.js # hook del reloj
  engine/audio.js    # beeps (Web Audio)
  engine/useWakeLock.js
  screens/Home.jsx
  screens/Preview.jsx
  screens/Session.jsx
  screens/Done.jsx
  components/BottomBar.jsx
  styles.css         # tokens + estilos
```

**Listo cuando:** abrís la URL de Vercel desde el móvil y ves el título.

---

## Paso 1 · Datos de la rutina

**Objetivo:** el `PLAN` completo, sin UI que lo consuma todavía.

- `src/data/plan.js` con `WARMUP` y `COOLDOWN` como constantes aparte, referenciadas
  en los tres días (el brief lo marca explícitamente: no duplicar).
- Los tres días: `martes`, `jueves`, `sabado`, con los bloques tal cual el brief.
- Exportar también `DIAS = ['martes','jueves','sabado']` para fijar el orden de render.

**Listo cuando:** `console.log(PLAN)` muestra los 3 días con todos sus bloques.

---

## Paso 2 · Timeline: bloques → lista plana de fases

**Objetivo:** la pieza más importante y la que más fácil se rompe. Va sola, sin reloj todavía.

La idea: en vez de que el timer tenga un `switch` gigante por tipo de bloque, **precalculás
toda la sesión como un array plano de fases**. El reloj después solo avanza un índice.
Esto hace que "saltar bloque" y "mostrar el que sigue" sean triviales.

```js
// forma de una fase
{
  tipo: 'prepara' | 'trabajo' | 'descanso' | 'libre',
  duracion: 40,              // segundos
  bloqueIdx: 1,              // para saltar bloque completo
  bloqueNombre: 'Bloque 1 · Intervalos 40/20',
  ejercicio: 'Burpees',      // null en descansos entre rondas
  ronda: 2, totalRondas: 3,  // null si no aplica
  items: [...],              // solo warmup/cooldown
}
```

Reglas de expansión (una función por tipo):

- **`warmup` / `cooldown`** → 1 fase `libre` de `duracion`, con `items` para mostrar en pantalla.
- **`intervals`** → por cada ronda: por cada ejercicio → fase `trabajo` + fase `descanso`.
  Cerrada la ronda, si **no** es la última, una fase `descanso` de `descansoEntreRondas`.
- **`tabata`** → por cada ejercicio: 8 rondas de `trabajo`/`descanso`. Entre ejercicio y
  ejercicio (no después del último), `descansoEntreTabatas`.
- **`finisher`** → **no se expande**. Se marca el bloque como `interactivo` y el motor se detiene
  ahí hasta que la UI le avise que terminó.
- Antes del primer `trabajo` de cada bloque, insertar fase `prepara` de 5s.

**Decidido al implementar** (había anticipado lo contrario): el `descanso` que cierra cada
ejercicio **se emite siempre**, incluso el último de la última ronda. Omitirlo dejaba
`trabajo 40s → prepará 5s → trabajo 20s` al pasar de intervals a tabata, que es brutal.
Además, emitirlo siempre es lo que da los ~30 min del brief. Consecuencia: entre rondas
quedan dos descansos seguidos (20s + 45s entre rondas; 10s + 60s entre tabatas).

**Listo cuando:** una tabla en pantalla (fea, temporal) lista todas las fases del jueves
y la suma de duraciones da algo cercano a los ~30 min esperados.

---

## Paso 3 · Motor del reloj

**Objetivo:** que el timeline avance solo, con pausa exacta.

- `useTimer.js`: **no** uses `setInterval` como fuente de verdad — deriva del reloj real
  (`performance.now()`) y usá el intervalo solo para repintar. Si no, el móvil con la pantalla
  apagada o la pestaña en background te desincroniza.
- Estado: `faseIdx`, `restante`, `corriendo`.
- Pausar guarda el `restante` exacto; reanudar recalcula el timestamp de fin.
- Al llegar a 0 → siguiente fase. Si no hay más → `onFin()`.
- `saltarBloque()`: avanza al primer índice cuyo `bloqueIdx` sea mayor al actual.

**Listo cuando:** con UI mínima (número + botón pausa) corrés el sábado entero,
pausás a mitad, reanudás, y los tiempos cierran contra el cronómetro del celular.

---

## Paso 4 · Pantalla de sesión

**Objetivo:** la pantalla que realmente vas a mirar entrenando.

- Countdown gigante en mono, centrado, legible a 1-2 m.
- Nombre del bloque arriba, ejercicio actual grande, `Ronda 2/3`.
- Fondo/color según `tipo` de fase: TRABAJO y DESCANSO bien diferenciados.
- `Sigue: …` con la fase siguiente (leer `timeline[faseIdx + 1]`).
- En fases `libre` (warmup/cooldown): mostrar la lista de `items` como guía.
- Barra flotante inferior: Pausa/Reanudar · Saltar bloque.

**Listo cuando:** desde el móvil corrés el martes completo sin tocar nada
y en todo momento sabés qué ejercicio te toca.

---

## Paso 5 · Audio

**Objetivo:** que puedas no mirar la pantalla.

- Web Audio API, oscillator simple, **sin assets**.
- Beep corto en cada cambio de fase.
- Triple beep al cerrar un bloque.
- Cuenta regresiva en los últimos 3s de cada fase de **trabajo**.
- **Crítico en iOS:** el `AudioContext` solo arranca dentro de un gesto del usuario.
  Creá y hacé `resume()` del contexto en el tap de EMPEZAR, no en el primer beep.
  Si no, en iPhone no suena nada y el bug es confuso de diagnosticar.

**Listo cuando:** corrés una sesión con el móvil boca abajo y los avisos alcanzan para seguirla.

---

## Paso 6 · Wake Lock

**Objetivo:** que no se apague la pantalla.

- `useWakeLock.js`: pedir el lock al empezar, liberarlo al terminar/salir.
- Re-pedirlo en el evento `visibilitychange` (el navegador lo suelta al cambiar de app).
- Envolver en `try/catch` — la API no existe en todos lados y no debe romper la sesión.

**Listo cuando:** 30 min de sesión con la pantalla siempre encendida.

---

## Paso 7 · Home y Preview

**Objetivo:** cerrar el flujo de navegación.

- Navegación por estado en `App.jsx` (`home | preview | sesion | fin`), sin router.
- **Home:** título del reto + 3 cards grandes con subtítulo y duración estimada
  (calculala sumando el timeline, no la hardcodees — así queda sola si tocás la rutina).
- **Preview:** bloques del día en lectura, con ejercicios, rondas y tiempos.
  Barra flotante inferior con EMPEZAR.
- **Fin:** "Sesión completa ✓" + volver al home.

**Listo cuando:** entrás, elegís día, ves qué toca, entrenás y volvés al home. Ciclo cerrado.

---

## Paso 8 · Finisher

**Objetivo:** el único bloque que no va por reloj.

- Cuando el motor llega a un bloque `finisher`, se pausa y la UI cambia a modo checklist.
- Filas por escalón (10-8-6-4-2), cada una con los 3 ejercicios y un check tappable.
- Escalón completo → se marca y se destaca el siguiente.
- Cronómetro **ascendente** arriba (solo mide, sin presión).
- Tildar el último (el de 2) → cierra el bloque y el motor sigue con el cooldown.

**Listo cuando:** corrés el jueves entero, timer → finisher → cooldown, sin tocar código.

---

## Paso 9 · Diseño

**Objetivo:** que se vea M·NK MODE. Va al final porque acá es barato iterar.

- DM Sans + DM Mono; labels y estados en UPPERCASE.
- Dark-first: fondo ink, `#f1ede1` para texto/acentos. Radios 3px.
- Tokens como custom properties en `styles.css` — incluidos los dos colores de
  TRABAJO y DESCANSO, para poder probarlos rápido.
- Tap targets grandes (manos sudadas, sin precisión).
- `env(safe-area-inset-bottom)` en la barra flotante, o en iPhone queda debajo de la barra de gestos.

**Listo cuando:** lo abrís entrenando y no te molesta nada.

---

## Paso 10 · Pulido final

- Bloquear scroll y pull-to-refresh durante la sesión (`overscroll-behavior: none`).
- Confirmar antes de salir de una sesión en curso.
- Agregar a pantalla de inicio: `manifest.json` + ícono, para abrirla como app.
- Correr las 3 sesiones enteras en el móvil real, con auriculares y sin.

---

## Notas

**Lo que más probable falle:** el audio en iOS (Paso 5) y la deriva del timer en background
(Paso 3). Los dos se resuelven en el paso donde aparecen — no los dejes para el final.

**Fuera de alcance, no lo metas por las dudas:** Supabase, editor de rutinas, login, histórico.
Todo eso está descartado explícitamente en el brief.

**Progresión semanal:** por ahora se ajusta a mano editando `plan.js` (sem 2: +1 ronda;
sem 3: descansos 45s→30s; sem 4: finisher 12-10-8-6-4). El selector de semana es v2 —
si llegás al Paso 10 y la app está en uso, ahí sí vale la pena.
