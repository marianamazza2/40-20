import { PLAN, DIAS } from '../data/plan.js'
import { construirTimeline, duracionTotal, formatearMinutos } from '../engine/timeline.js'

// La duración sale del timeline, no está hardcodeada: si tocás la rutina en plan.js
// (progresión semanal), las cards se actualizan solas.
function resumen(dia) {
  const sesion = PLAN[dia]
  const cronometrado = formatearMinutos(duracionTotal(construirTimeline(sesion)))
  const tieneFinisher = sesion.bloques.some((b) => b.tipo === 'finisher')
  return tieneFinisher ? `${cronometrado} + finisher` : cronometrado
}

export default function Home({ onElegir }) {
  return (
    <main className="home">
      <header className="home-cabecera">
        <h1 className="marca">40·20</h1>
        <p className="label">Reto 30 días</p>
      </header>

      <div className="home-cards">
        {DIAS.map((dia) => (
          <button key={dia} className="card" onClick={() => onElegir(dia)}>
            <span className="card-dia">{PLAN[dia].titulo}</span>
            <span className="card-sub">{PLAN[dia].subtitulo}</span>
            <span className="card-dur label">{resumen(dia)}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
