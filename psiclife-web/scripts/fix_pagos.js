const fs = require('fs');

const path = 'c:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-web/src/pages/Pagos.jsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '    const pagado    = detalle.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0';
const endStr = '  // ── Formulario ─────────────────────────────────────────────';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.error('start or end index not found');
  process.exit(1);
}

const replacement = `    const pagado    = detalle.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0
    const restante  = Number(detalle.total) - pagado
    const puedePagar = ['pendiente','parcial'].includes(detalle.estado)
    const puedeAnular = ['pendiente','parcial'].includes(detalle.estado)

    return (
      <div className="page-enter">
        <div className="section-header" style={{ marginBottom: 24, padding: '0 8px' }}>
          <div>
            <div className="section-title" style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={24} color="var(--primary)" />
              {detalle.numero_factura.replace('FAC-', 'REC-')}
            </div>
            <div className="section-subtitle" style={{ fontSize: 14, marginTop: 4 }}>
              {detalle.paciente?.nombres} {detalle.paciente?.apellidos} ·
              <span className={\`badge \${ESTADO_BADGE[detalle.estado]}\`} style={{ marginLeft: 8, padding: '4px 10px', fontSize: 12 }}>{detalle.estado}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {puedeAnular && (
              <button className="btn btn-ghost" onClick={() => setModalAnularFactura(true)} style={{ borderRadius: 12, color: 'var(--danger)', border: '1px solid var(--danger-bg)' }}>
                <Trash2 size={16}/> Anular recibo
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setVista('lista')} style={{ borderRadius: 12 }}><X size={16}/> Cerrar</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* Detalles del Recibo */}
          <div className="card" style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', borderRadius: 20 }}>
            <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Detalle de Pago</span>
            </div>
            <div className="card-body" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Servicio</span>
                  <span style={{ color: '#1e293b', fontSize: 14, fontWeight: 600 }}>{detalle.descripcion_servicio}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Profesional a cargo</span>
                  <span style={{ color: '#1e293b', fontSize: 14, fontWeight: 600 }}>{detalle.psicologo?.nombres} {detalle.psicologo?.apellidos}</span>
                </div>
                <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Total</span>
                  <span style={{ color: '#0f172a', fontSize: 16, fontWeight: 800 }}>S/ {Number(detalle.total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Pagado</span>
                  <span style={{ color: '#059669', fontSize: 15, fontWeight: 700 }}>S/ {pagado.toFixed(2)}</span>
                </div>
                {restante > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '12px 16px', borderRadius: 12, marginTop: 8 }}>
                    <span style={{ color: '#1d4ed8', fontSize: 14, fontWeight: 600 }}>Saldo pendiente</span>
                    <span style={{ color: '#2563eb', fontSize: 18, fontWeight: 800 }}>S/ {restante.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloques Dinámicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Registro de pago (Si está pendiente o parcial) */}
            {puedePagar && (
              <div className="card" style={{ borderRadius: 20 }}>
                <div className="card-header"><span className="card-title">Registrar Pago</span></div>
                <div className="card-body">
                  <div className="form-grid" style={{ gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Método de pago</label>
                      <select className="form-control" value={formPago.metodo}
                        onChange={e => setFormPago(p => ({ ...p, metodo: e.target.value, codigo_referencia: '' }))}>
                        {['efectivo','yape','transferencia','tarjeta']
                          .filter(m => config[\`pago_\${m}_activo\`] === 'true')
                          .map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monto (S/) <span className="required">*</span></label>
                      <input type="number" className={\`form-control \${errPago.monto?'error':''}\`}
                        value={formPago.monto} min={0.01} step="0.01"
                        onChange={e => { setFormPago(p => ({ ...p, monto: e.target.value })); setErrPago({}) }}
                        placeholder={\`Máx. S/ \${restante.toFixed(2)}\`} />
                      {errPago.monto && <span className="form-error">{errPago.monto}</span>}
                    </div>
                    
                    {formPago.metodo !== 'efectivo' && formPago.metodo !== 'tarjeta' && (
                      <div className="form-group">
                        <label className="form-label">
                          Código / referencia <span className="required">*</span>
                        </label>
                        <input
                          className={\`form-control \${errPago.codigo_referencia ? 'error' : ''}\`}
                          inputMode="numeric"
                          pattern="\\d*"
                          value={formPago.codigo_referencia}
                          maxLength={16}
                          onChange={e => {
                            const val = e.target.value.replace(/[^\\d-]/g, '').slice(0, 16)
                            setFormPago(p => ({ ...p, codigo_referencia: val }))
                            setErrPago(er => ({ ...er, codigo_referencia: '' }))
                          }}
                          placeholder="N° operación (mín. 8 caracteres)" />
                        {errPago.codigo_referencia && <span className="form-error">{errPago.codigo_referencia}</span>}
                      </div>
                    )}
                  </div>
                  <div className="form-footer" style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={registrarPago} disabled={guardando} style={{ width: '100%', justifyContent: 'center' }}>
                      <CheckCircle size={14}/> {guardando ? 'Procesando...' : (formPago.metodo === 'efectivo' ? 'Registrar pago' : 'Enviar comprobante')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Resumen de ciclo pagado */}
            {detalle.estado === 'pagada' && (
              <div className="card" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 20 }}>
                <div className="card-body" style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={24} color="#fff" />
                  </div>
                  <h3 style={{ margin: 0, color: '#065f46', fontSize: 18 }}>Ciclo Completado</h3>
                  <p style={{ margin: 0, color: '#047857', fontSize: 14 }}>Esta factura ha sido pagada en su totalidad.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Pagos pendientes de confirmación (Yape + Transferencia) ── */}
        {detalle.pagos?.some(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false && p.anulado === false) && (
          <div className="card" style={{
            marginTop: 16,
            border: '2px solid rgba(58,174,216,0.25)',
            background: 'linear-gradient(135deg, rgba(232,246,252,0.95), rgba(217,239,249,0.95))',
          }}>
            <div className="card-header" style={{ background: 'rgba(58,174,216,0.12)', borderBottom: '1px solid rgba(58,174,216,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--info)" />
                <span className="card-title" style={{ color: 'var(--info)' }}>Verificar Comprobante</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--info)', color: '#fff', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {detalle.pagos.filter(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false && p.anulado === false).length} pendiente(s)
                </span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detalle.pagos.filter(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false && p.anulado === false).map(p => (
                <div key={p.id} style={{
                  display: 'flex', gap: 18, alignItems: 'flex-start',
                  padding: '16px 18px', borderRadius: 14,
                  background: 'var(--surface)', border: '1.5px solid rgba(58,174,216,0.22)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  flexWrap: 'wrap',
                }}>
                  {/* Comprobante */}
                  <div style={{ flexShrink: 0 }}>
                    {p.url_comprobante ? (
                      <div
                        onClick={() => setImagenExpandida(getImageUrl(p.url_comprobante))}
                        title="Click para ampliar"
                        style={{ cursor: 'zoom-in' }}
                      >
                        <img
                          src={getImageUrl(p.url_comprobante)}
                          alt="Comprobante"
                          style={{
                            width: 110, height: 110, objectFit: 'cover',
                            borderRadius: 10, border: '2px solid rgba(58,174,216,0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.18)' }}
                          onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
                        />
                        <div style={{ fontSize: 11, color: 'var(--info)', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>🔍 Ver completo</div>
                      </div>
                    ) : (
                      <div style={{
                        width: 110, height: 110, borderRadius: 10,
                        background: 'var(--info-bg)', border: '2px dashed rgba(58,174,216,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                      }}>
                        <ImageOff size={24} color="var(--info)" />
                        <span style={{ fontSize: 10, color: 'var(--info)' }}>Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Datos */}
                  <div style={{ flex: 1, fontSize: 13, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--info)', fontSize: 14 }}>Pago por {p.metodo}</span>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid rgba(58,174,216,0.35)', fontWeight: 600 }}>⏳ Pendiente</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Monto:</span> <strong>S/ {Number(p.monto).toFixed(2)}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Código op.:</span> <strong style={{ fontFamily: 'monospace' }}>{p.codigo_referencia || '—'}</strong></div>
                      <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-muted)' }}>Enviado:</span> {new Date(p.pagado_en).toLocaleString('es-PE')}</div>
                    </div>
                    
                    {/* Sección de Rechazo */}
                    {modalRechazarPago === p.id && (
                      <div style={{ marginTop: 12, padding: 12, background: 'rgba(224,48,80,0.05)', borderRadius: 8, border: '1px solid rgba(224,48,80,0.2)' }}>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginBottom: 6 }}>Motivo de rechazo <span className="required">*</span></label>
                        <textarea 
                          className="form-control" 
                          rows={2} 
                          value={motivoRechazo} 
                          onChange={e => setMotivoRechazo(e.target.value)} 
                          placeholder="Mínimo 10 caracteres..." 
                          style={{ fontSize: 13, borderColor: 'var(--danger-bg)' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModalRechazarPago(null)} style={{ fontSize: 12 }}>Cancelar</button>
                          <button className="btn btn-danger btn-sm" onClick={confirmarRechazoPago} disabled={guardando} style={{ fontSize: 12 }}>
                            {guardando ? 'Rechazando...' : 'Confirmar Rechazo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {!modalRechazarPago && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => confirmarPagoYape(p.id)}
                        disabled={guardando}
                        style={{
                          padding: '9px 16px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white', border: 'none', fontSize: 13, fontWeight: 700,
                          cursor: guardando ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          opacity: guardando ? 0.7 : 1, transition: 'all 0.2s',
                          boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                        }}
                      >
                        <CheckCircle size={15} /> Aprobar
                      </button>
                      <button
                        onClick={() => rechazarPago(p.id)}
                        disabled={guardando}
                        style={{
                          padding: '9px 16px', borderRadius: 10,
                          background: 'rgba(224,48,80,0.1)', color: 'var(--danger)',
                          border: '1.5px solid rgba(224,48,80,0.3)', fontSize: 13, fontWeight: 700,
                          cursor: guardando ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          opacity: guardando ? 0.7 : 1, transition: 'all 0.2s',
                        }}
                      >
                        <X size={14} /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Historial de todos los pagos ── */}
        {detalle.pagos?.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Historial de pagos</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Método</th><th>Monto</th><th>Referencia</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {detalle.pagos.map(p => (
                    <tr key={p.id}>
                      <td><span className="badge badge-info">{p.metodo}</span></td>
                      <td style={{ fontWeight: 600 }}>S/ {Number(p.monto).toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{p.codigo_referencia ?? '—'}</td>
                      <td>
                        {p.anulado ? (
                          <span className="badge badge-danger" title={p.motivo_anulacion}>Rechazado/Anulado</span>
                        ) : p.metodo === 'yape' || p.metodo === 'transferencia' ? (
                          <span className={\`badge \${p.confirmado ? 'badge-success' : 'badge-info'}\`}>
                            {p.confirmado ? '✓ Confirmado' : '⏳ Pendiente'}
                          </span>
                        ) : (
                          <span className="badge badge-success">✓ Confirmado</span>
                        )}
                      </td>
                      <td>{new Date(p.pagado_en).toLocaleString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Modal Anular Factura ── */}
        {modalAnularFactura && (
          <div className="modal-overlay" onClick={() => setModalAnularFactura(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
              <div className="modal-header">
                <span className="modal-title" style={{ color: 'var(--danger)' }}>Anular Recibo</span>
                <button className="modal-close" onClick={() => setModalAnularFactura(false)}><X size={18}/></button>
              </div>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 13 }}>Motivo de anulación <span className="required">*</span></label>
                  <textarea className="form-control" rows={3} value={motivoAnular}
                    onChange={e => setMotivoAnular(e.target.value)} placeholder="Escribe el motivo detallado..." style={{ borderRadius: 12 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setModalAnularFactura(false)}>Cancelar</button>
                  <button className="btn btn-danger" onClick={anularFactura} disabled={guardando}>
                    {guardando ? 'Anulando...' : 'Anular recibo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
\n`;

const before = content.slice(0, startIndex);
const after = content.slice(endIndex);

fs.writeFileSync(path, before + replacement + after);
console.log('Pagos.jsx corrected successfully');
