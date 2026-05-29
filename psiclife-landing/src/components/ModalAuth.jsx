// src/components/ModalAuth.jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './ModalAuth.module.css'

export default function ModalAuth({ open, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const panelUrl = import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'

  const handleGoToLogin = () => {
    window.location.href = `${panelUrl}/login`
  }

  const handleRegistro = (e) => {
    e.preventDefault()
    alert('¡Solicitud enviada! Nos contactaremos contigo en menos de 24 horas.')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}><X size={16} /></button>

        <div className={styles.logo}>Psic<em>Life</em></div>

        <form onSubmit={handleRegistro}>
          <div className={styles.title}>Comienza hoy</div>
          <div className={styles.sub}>Primera consulta de diagnóstico gratuita.</div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Nombres</label>
              <input className={styles.input} type="text" placeholder="Juan" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Apellidos</label>
              <input className={styles.input} type="text" placeholder="Pérez" required />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Correo electrónico</label>
            <input className={styles.input} type="email" placeholder="tu@correo.pe" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>WhatsApp</label>
            <input className={styles.input} type="tel" placeholder="+51 987 654 321" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Empresa (opcional)</label>
            <input className={styles.input} type="text" placeholder="¿Dónde trabajas?" />
          </div>
          <button type="submit" className={styles.submit}>Solicitar consulta gratuita →</button>
          <div className={styles.footer}>
            ¿Ya tienes cuenta?{' '}
            <span onClick={handleGoToLogin} style={{ cursor: 'pointer', color: 'var(--c1)', fontWeight: 600 }}>
              Inicia sesión aquí
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

