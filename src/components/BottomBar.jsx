// Barra flotante inferior. Tap targets grandes: se usa con las manos sudadas.
export default function BottomBar({ children }) {
  return <nav className="barra">{children}</nav>
}

export function BotonBarra({ onClick, children, variante = 'normal', disabled }) {
  return (
    <button className="barra-boton" data-variante={variante} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

/** Cruz de salida. Va arriba, lejos de Pausa: no se toca por accidente. */
export function BotonSalir({ onClick }) {
  return (
    <button className="boton-salir" onClick={onClick} aria-label="Salir de la sesión">
      ✕
    </button>
  )
}

/**
 * Confirmación de salida. Reemplaza la barra en vez de tapar la pantalla,
 * así el countdown sigue a la vista mientras decidís.
 */
export function BarraSalir({ onCancelar, onSalir }) {
  return (
    <BottomBar>
      <BotonBarra onClick={onCancelar} variante="activo">
        Seguir
      </BotonBarra>
      <BotonBarra onClick={onSalir} variante="peligro">
        Salir
      </BotonBarra>
    </BottomBar>
  )
}
