import { duracionTotal, formatearDuracion } from '../engine/timeline.js'
import BottomBar, { BotonBarra } from '../components/BottomBar.jsx'

// Qué mostrar debajo del nombre de cada bloque, en lectura.
function detalle(bloque) {
  switch (bloque.tipo) {
    case 'warmup':
    case 'cooldown':
      return formatearDuracion(bloque.duracion)
    case 'intervals':
      return `${bloque.trabajo}/${bloque.descanso} · ${bloque.rondas} rondas · ${bloque.descansoEntreRondas}s entre rondas`
    case 'tabata':
      return `${bloque.trabajo}/${bloque.descanso} · ${bloque.rondas} rondas · ${bloque.descansoEntreTabatas}s entre tabatas`
    case 'finisher':
      return `${bloque.esquema.join(' · ')} reps · por repeticiones, sin reloj`
    default:
      return ''
  }
}

export default function Preview({ sesion, timeline, onEmpezar, onVolver }) {
  return (
    <main className="preview">
      <header className="preview-cabecera">
        <h1 className="preview-titulo">{sesion.titulo}</h1>
        <p className="label">{sesion.subtitulo}</p>
        <p className="label">{formatearDuracion(duracionTotal(timeline))} cronometrados</p>
      </header>

      <ol className="preview-lista">
        {sesion.bloques.map((bloque, i) => (
          <li key={i} className="bloque">
            <p className="bloque-nombre">{bloque.nombre}</p>
            <p className="bloque-detalle label">{detalle(bloque)}</p>
            <ul className="bloque-items">
              {(bloque.ejercicios ?? bloque.items).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <BottomBar>
        <BotonBarra onClick={onVolver}>Volver</BotonBarra>
        <BotonBarra onClick={onEmpezar} variante="activo">
          Empezar
        </BotonBarra>
      </BottomBar>
    </main>
  )
}
