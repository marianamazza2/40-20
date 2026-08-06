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
