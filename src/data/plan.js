// Rutina del reto de 30 días. Todo hardcodeado — no hay editor ni persistencia (v1).
// Para ajustar la progresión semanal se edita este archivo a mano:
//   Sem 2: +1 ronda al Bloque 1 (martes y jueves).
//   Sem 3: descansoEntreRondas 45 → 30.
//   Sem 4: finisher a [12, 10, 8, 6, 4]; sábado a 4 rondas firmes.

// Warmup y cooldown son iguales en los 3 días: se definen una vez y se referencian.
export const WARMUP = {
  tipo: 'warmup',
  nombre: 'Entrada en calor',
  duracion: 300, // 5 min, un solo countdown
  items: [
    'Jumping jacks suaves',
    'Círculos de brazos',
    'Balanceos de pierna',
    'Sentadillas al aire lentas',
    'High knees ritmo medio',
    'Movilidad tobillo y cadera',
  ],
}

export const COOLDOWN = {
  tipo: 'cooldown',
  nombre: 'Vuelta a la calma',
  duracion: 180, // 3 min
  items: [
    'Caminar en el lugar',
    'Estiramiento cuádriceps',
    'Estiramiento isquios',
    'Apertura de pecho y hombros',
  ],
}

export const PLAN = {
  martes: {
    titulo: 'Martes',
    subtitulo: 'Bajo impacto · superior + core',
    bloques: [
      WARMUP,
      {
        tipo: 'intervals',
        nombre: 'Bloque 1 · Intervalos 40/20',
        trabajo: 40,
        descanso: 20,
        rondas: 3,
        descansoEntreRondas: 45,
        ejercicios: [
          'Mountain climbers rápidos',
          'Thrusters (mancuernas livianas)',
          'Plancha con toque de hombro',
          'High knees máxima velocidad',
        ],
      },
      {
        tipo: 'tabata',
        nombre: 'Bloque 2 · Tabata',
        trabajo: 20,
        descanso: 10,
        rondas: 8,
        descansoEntreTabatas: 60,
        ejercicios: ['Escaladores cruzados', 'Sentadillas rápidas al aire'],
      },
      COOLDOWN,
    ],
  },

  jueves: {
    titulo: 'Jueves',
    subtitulo: 'Full intenso · con saltos',
    bloques: [
      WARMUP,
      {
        tipo: 'intervals',
        nombre: 'Bloque 1 · Intervalos 40/20',
        trabajo: 40,
        descanso: 20,
        rondas: 3,
        descansoEntreRondas: 45,
        ejercicios: [
          'Burpees',
          'Squat jumps',
          'Mountain climbers rápidos',
          'Skaters (saltos laterales)',
        ],
      },
      {
        tipo: 'finisher',
        nombre: 'Finisher descendente',
        esquema: [10, 8, 6, 4, 2], // reps por escalón
        ejercicios: ['Burpees', 'Jump lunges', 'Push-ups'],
      },
      COOLDOWN,
    ],
  },

  sabado: {
    titulo: 'Sábado',
    subtitulo: 'Conservador · bajo impacto',
    bloques: [
      WARMUP,
      {
        tipo: 'intervals',
        nombre: 'Bloque único · Intervalos 30/30',
        trabajo: 30,
        descanso: 30,
        rondas: 4,
        descansoEntreRondas: 45,
        ejercicios: [
          'Jumping jacks',
          'Sentadilla sumo al aire',
          'Escaladores cruzados',
          'Zancadas caminando',
          'Plancha con toque de hombro',
        ],
      },
      COOLDOWN,
    ],
  },
}

// Orden fijo de render en el home. No confiar en el orden de claves del objeto.
export const DIAS = ['martes', 'jueves', 'sabado']
