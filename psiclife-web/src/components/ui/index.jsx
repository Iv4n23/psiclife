// src/components/ui/Modal.jsx
import { X } from 'lucide-react'

export function Modal({ titulo, onClose, children, ancho = '540px' }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: ancho }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>{titulo}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}


// src/components/ui/Confirm.jsx
import { AlertTriangle } from 'lucide-react'

export function Confirm({ titulo, descripcion, onConfirm, onCancel, cargando }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-icon modal-icon-danger">
          <AlertTriangle size={20} />
        </div>
        <div className="modal-title">{titulo}</div>
        <div className="modal-desc">{descripcion}</div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={cargando}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={cargando}>
            {cargando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}


// src/components/ui/EmptyState.jsx
import { PackageOpen } from 'lucide-react'

export function EmptyState({ titulo = 'Sin registros', descripcion = 'No hay datos para mostrar.' }) {
  return (
    <div className="empty-state">
      <PackageOpen className="empty-state-icon" />
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
    </div>
  )
}


// src/components/ui/Spinner.jsx
export function Spinner() {
  return (
    <div className="spinner">
      <div className="spinner-ring" />
    </div>
  )
}

export { CalendarioSemanal } from './CalendarioSemanal.jsx'
export { CalendarioMensual } from './CalendarioMensual.jsx'
