import BottomBar, { BotonBarra } from '../components/BottomBar.jsx'

export default function Done({ sesion, onVolver }) {
  return (
    <main className="cierre">
      <p className="cierre-marca">✓</p>
      <p className="cierre-texto">Sesión completa</p>
      <p className="label">{sesion.titulo}</p>

      <BottomBar>
        <BotonBarra onClick={onVolver} variante="activo">
          Volver al inicio
        </BotonBarra>
      </BottomBar>
    </main>
  )
}
