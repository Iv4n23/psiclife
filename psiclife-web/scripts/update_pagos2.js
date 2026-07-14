const fs = require('fs');

const path = 'c:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-web/src/pages/Pagos.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace state variables
content = content.replace(
  "  const [motivoAnularPago, setMotivoAnularPago] = useState('')\n  const [anulandoPago,    setAnulandoPago]    = useState(false)\n",
  "  const [motivoAnularPago, setMotivoAnularPago] = useState('')\n  const [anulandoPago,    setAnulandoPago]    = useState(false)\n  const [modalRechazarPago, setModalRechazarPago] = useState(null)\n  const [motivoRechazo, setMotivoRechazo] = useState('')\n  const [modalAnularFactura, setModalAnularFactura] = useState(false)\n"
);

// Replace anularFactura
content = content.replace(
  "    try {\n      await facturacionApi.anular(detalle.id, { motivo: motivoAnular })\n      toast.success('Factura anulada')\n      setVista('lista'); await cargar()\n    } catch {} finally { setGuardando(false) }\n  }",
  "    try {\n      await facturacionApi.anular(detalle.id, { motivo: motivoAnular })\n      toast.success('Recibo anulado')\n      setModalAnularFactura(false)\n      setVista('lista'); await cargar()\n    } catch {} finally { setGuardando(false) }\n  }"
);

// Replace rechazarPago
content = content.replace(
  "  const rechazarPago = async (pagoId) => {\n    if (!window.confirm('¿Seguro que deseas rechazar este pago? Se notificará al paciente.')) return\n    setGuardando(true)\n    try {\n      await facturacionApi.rechazarPago(pagoId)\n      toast.success('Pago rechazado correctamente.')\n      if (detalle?.id) {\n        await verDetalle(detalle.id)\n      }\n      await cargar()\n    } catch (err) {\n      const msg = err.response?.data?.mensaje ?? 'Error al rechazar pago'\n      toast.error(msg)\n    } finally { setGuardando(false) }\n  }",
  "  const rechazarPago = (pagoId) => {\n    setModalRechazarPago(pagoId)\n    setMotivoRechazo('')\n  }\n\n  const confirmarRechazoPago = async () => {\n    if (motivoRechazo.trim().length < 10) { toast.error('El motivo de rechazo debe tener al menos 10 caracteres'); return }\n    setGuardando(true)\n    try {\n      await facturacionApi.rechazarPago(modalRechazarPago, { motivo: motivoRechazo })\n      toast.success('Pago rechazado y notificado')\n      if (detalle?.id) {\n        await verDetalle(detalle.id)\n      }\n      setModalRechazarPago(null)\n      await cargar()\n    } catch (err) {\n      const msg = err.response?.data?.mensaje ?? 'Error al rechazar pago'\n      toast.error(msg)\n    } finally { setGuardando(false) }\n  }"
);

// Replace Anular recibo button action
content = content.replace(
  "              <button className=\"btn btn-ghost\" onClick={() => setModalAnularPago(detalle)} style={{ borderRadius: 12, color: 'var(--danger)', border: '1px solid var(--danger-bg)' }}>\n                <Trash2 size={16}/> Anular recibo\n              </button>",
  "              <button className=\"btn btn-ghost\" onClick={() => setModalAnularFactura(true)} style={{ borderRadius: 12, color: 'var(--danger)', border: '1px solid var(--danger-bg)' }}>\n                <Trash2 size={16}/> Anular recibo\n              </button>"
);

// Add Modal Anular Factura at the bottom of verDetalle
content = content.replace(
  "      </div>\n    )\n  }\n\n  // ── Formulario ─────────────────────────────────────────────",
  "        {/* ── Modal Anular Factura ── */}\n        {modalAnularFactura && (\n          <div className=\"modal-overlay\" onClick={() => setModalAnularFactura(false)}>\n            <div className=\"modal\" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>\n              <div className=\"modal-header\">\n                <span className=\"modal-title\" style={{ color: 'var(--danger)' }}>Anular Recibo</span>\n                <button className=\"modal-close\" onClick={() => setModalAnularFactura(false)}><X size={18}/></button>\n              </div>\n              <div className=\"modal-body\">\n                <div className=\"form-group\" style={{ marginBottom: 16 }}>\n                  <label className=\"form-label\" style={{ fontSize: 13 }}>Motivo de anulación <span className=\"required\">*</span></label>\n                  <textarea className=\"form-control\" rows={3} value={motivoAnular}\n                    onChange={e => setMotivoAnular(e.target.value)} placeholder=\"Escribe el motivo detallado...\" style={{ borderRadius: 12 }} />\n                </div>\n                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>\n                  <button className=\"btn btn-ghost\" onClick={() => setModalAnularFactura(false)}>Cancelar</button>\n                  <button className=\"btn btn-danger\" onClick={anularFactura} disabled={guardando}>\n                    {guardando ? 'Anulando...' : 'Anular recibo'}\n                  </button>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}\n      </div>\n    )\n  }\n\n  // ── Formulario ─────────────────────────────────────────────"
);

fs.writeFileSync(path, content);
console.log('State and methods updated successfully');
