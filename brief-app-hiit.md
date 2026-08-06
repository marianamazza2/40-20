# BRIEF · App HIIT Timer (reto 30 días)

## CONTEXTO Y OBJETIVO

App personal de un solo uso: correr las sesiones de HIIT del reto de 30 días sin mirar el reloj ni un papel. Selecciono el día (martes / jueves / sábado), le doy play, y el timer me guía bloque por bloque con cuenta regresiva y avisos sonoros. El único bloque que no va por reloj es el finisher (por repeticiones → checklist).

Referencia de estilo y arquitectura: **M·NK MODE** (misma lógica de sesión guiada, timer y barra flotante inferior).

---

## ALCANCE

**v1 (esto):**
- 3 sesiones fijas hardcodeadas (martes / jueves / sábado).
- Timer automático para todos los bloques por tiempo.
- Finisher como checklist de reps (sin cronómetro).
- Audio de transición + wake lock (que no se apague la pantalla).
- Pausa / reanudar / saltar bloque.
- Todo client-side, sin login, sin backend.

**Fuera de alcance v1:**
- Supabase / persistencia / histórico de sesiones.
- Editor de rutinas (los datos van hardcodeados).
- Progresión semanal automática (la ajusto a mano por ahora; ver nota al final).
- Panel, cuentas, multiusuario.

---

## STACK

- **React + Vite**, single-file / pocos componentes.
- Sin dependencias externas de timer — motor propio con `setInterval` o `requestAnimationFrame`.
- Deploy en Vercel.
- Mobile-first (se usa desde el móvil entrenando).

---

## MODELO DE DATOS

Toda la rutina va como constante. El motor del timer recorre `bloques` en orden. Tipos de bloque: `warmup`, `intervals`, `tabata`, `finisher`, `cooldown`.

```js
const PLAN = {
  martes: {
    titulo: "Martes",
    subtitulo: "Bajo impacto · superior + core",
    bloques: [
      {
        tipo: "warmup",
        nombre: "Entrada en calor",
        duracion: 300, // 5 min, un solo countdown
        items: [
          "Jumping jacks suaves",
          "Círculos de brazos",
          "Balanceos de pierna",
          "Sentadillas al aire lentas",
          "High knees ritmo medio",
          "Movilidad tobillo y cadera",
        ],
      },
      {
        tipo: "intervals",
        nombre: "Bloque 1 · Intervalos 40/20",
        trabajo: 40,
        descanso: 20,
        rondas: 3,
        descansoEntreRondas: 45,
        ejercicios: [
          "Mountain climbers rápidos",
          "Thrusters (mancuernas livianas)",
          "Plancha con toque de hombro",
          "High knees máxima velocidad",
        ],
      },
      {
        tipo: "tabata",
        nombre: "Bloque 2 · Tabata",
        trabajo: 20,
        descanso: 10,
        rondas: 8,
        descansoEntreTabatas: 60,
        ejercicios: [
          "Escaladores cruzados",
          "Sentadillas rápidas al aire",
        ],
      },
      {
        tipo: "cooldown",
        nombre: "Vuelta a la calma",
        duracion: 180, // 3 min
        items: [
          "Caminar en el lugar",
          "Estiramiento cuádriceps",
          "Estiramiento isquios",
          "Apertura de pecho y hombros",
        ],
      },
    ],
  },

  jueves: {
    titulo: "Jueves",
    subtitulo: "Full intenso · con saltos",
    bloques: [
      { tipo: "warmup", nombre: "Entrada en calor", duracion: 300, items: [/* mismo warmup */] },
      {
        tipo: "intervals",
        nombre: "Bloque 1 · Intervalos 40/20",
        trabajo: 40, descanso: 20, rondas: 3, descansoEntreRondas: 45,
        ejercicios: [
          "Burpees",
          "Squat jumps",
          "Mountain climbers rápidos",
          "Skaters (saltos laterales)",
        ],
      },
      {
        tipo: "finisher",
        nombre: "Finisher descendente",
        esquema: [10, 8, 6, 4, 2], // reps por escalón
        ejercicios: ["Burpees", "Jump lunges", "Push-ups"],
      },
      { tipo: "cooldown", nombre: "Vuelta a la calma", duracion: 180, items: [/* mismo cooldown */] },
    ],
  },

  sabado: {
    titulo: "Sábado",
    subtitulo: "Conservador · bajo impacto",
    bloques: [
      { tipo: "warmup", nombre: "Entrada en calor", duracion: 300, items: [/* mismo warmup */] },
      {
        tipo: "intervals",
        nombre: "Bloque único · Intervalos 30/30",
        trabajo: 30, descanso: 30, rondas: 4, descansoEntreRondas: 45,
        ejercicios: [
          "Jumping jacks",
          "Sentadilla sumo al aire",
          "Escaladores cruzados",
          "Zancadas caminando",
          "Plancha con toque de hombro",
        ],
      },
      { tipo: "cooldown", nombre: "Vuelta a la calma", duracion: 180, items: [/* mismo cooldown */] },
    ],
  },
};
```

*(Nota: warmup y cooldown se repiten en los 3 días; conviene extraerlos a constantes `WARMUP` y `COOLDOWN` y referenciarlos, para no duplicar.)*

---

## PANTALLAS Y FLUJO

**1. Home / selección de día**
- Título del reto arriba.
- Tres cards grandes tappables: MARTES / JUEVES / SÁBADO, cada una con su subtítulo (bajo impacto / full intenso / conservador) y duración estimada (~30 min).
- Tap en una card → pantalla de preview.

**2. Preview de la sesión**
- Lista de los bloques del día, uno abajo del otro, con sus ejercicios, rondas y tiempos (solo lectura, para ver qué toca).
- Barra flotante inferior con botón **EMPEZAR**.

**3. Sesión en curso (pantalla del timer)**
- Ocupa toda la pantalla, alto contraste, legible a distancia.
- Muestra: nombre del bloque · ejercicio actual (grande) · **countdown gigante** · indicador de ronda (ej. "Ronda 2/3") · estado TRABAJO / DESCANSO (color distinto).
- Preview chico del próximo ejercicio ("Sigue: …").
- Barra flotante inferior: Pausa/Reanudar · Saltar bloque.
- Al terminar todos los bloques → pantalla de cierre ("Sesión completa ✓") con botón para volver al home.

---

## MOTOR DE TIMER · comportamiento

- Recorre `bloques` en orden; dentro de cada uno maneja su lógica.
- **`intervals`**: por cada ronda, itera los ejercicios → fase TRABAJO (`trabajo`s) + fase DESCANSO (`descanso`s). Al cerrar la ronda, si no es la última, mete `descansoEntreRondas`s. Muestra ronda actual y ejercicio actual.
- **`tabata`**: por cada ejercicio del array, 8 rondas de `trabajo`/`descanso` (20/10). Entre los dos tabatas, `descansoEntreTabatas`s de pausa.
- **`warmup` / `cooldown`**: un único countdown de `duracion`. Muestra la lista de `items` en pantalla como guía (no cronometra cada item por separado — un solo timer corriendo).
- **`finisher`**: NO usa timer. Ver sección aparte.

**Transiciones y audio:**
- Beep corto en cada cambio de fase (trabajo→descanso y viceversa).
- Beep distinto (o triple) al terminar un bloque completo.
- Cuenta regresiva sonora en los últimos 3s de cada fase de trabajo.
- Usar Web Audio API (oscillator simple) para no depender de assets de sonido.

**Detalles clave de UX (que hacen que sea usable de verdad):**
- **Wake Lock API** activo durante la sesión → que la pantalla no se apague mientras entreno.
- Pausa/reanudar que congela el countdown exacto.
- Saltar bloque = avanza al siguiente bloque completo.
- Al arrancar cada bloque, mostrar 5s de "PREPARÁ… " antes del primer trabajo (countdown de entrada).

---

## FINISHER (implementación por reps)

En vez de cronómetro, es un **checklist de repeticiones**:
- Muestra el esquema descendente (10-8-6-4-2) como filas.
- Por cada escalón, los ejercicios del array (burpees / jump lunges / push-ups) con un check tappable.
- A medida que voy completando, tildo. Cuando tildo todos los del escalón, se marca ese nivel y paso al siguiente.
- No hay tiempo objetivo; el bloque se cierra cuando tildo el último (el de 2 reps).
- Opcional lindo: un cronómetro **ascendente** (que solo mide cuánto tardé, sin presión), para ir viendo si mejoro semana a semana. Sin cuenta regresiva.

---

## SISTEMA DE DISEÑO

Alineado a M·NK MODE / MAZZMKT:
- **Tipografía:** DM Sans (texto) + DM Mono / labels en UPPERCASE para etiquetas y estados.
- **Paleta:** dark-first (fondo ink oscuro), cream `#f1ede1` para texto/acentos. Estado TRABAJO y DESCANSO con dos colores bien diferenciados y de alto contraste.
- **Radios:** 3px.
- **Countdown:** número enorme, mono, centrado, legible a 1-2 metros.
- **Barra flotante inferior** para las acciones principales (empezar / pausa / saltar).
- Mobile-first, tap targets grandes (se usa con las manos sudadas, sin precisión).

---

## NOTA · progresión semanal (para v2 si engancha)

Por ahora ajusto a mano según la semana del reto:
- Sem 2: +1 ronda al Bloque 1 (martes y jueves).
- Sem 3: descansos entre rondas 45s → 30s.
- Sem 4: finisher a 12-10-8-6-4; sábado a 4 rondas firmes.

Se podría meter un selector de semana (1-4) que module `rondas` y `descansoEntreRondas` sobre el mismo `PLAN`, pero queda fuera de v1.
