const fs = require('fs');

let content = fs.readFileSync('src/pages/Pagos.jsx', 'utf8');

// 1. In `vista === 'detalle'`, replace the "Pagos pendientes" section to ONLY show 'efectivo'
const regexPendientes = /\{\/\*\s*──\s*Pagos pendientes de confirmación.*?\}\)\}/s;
const newPendientes = `{/* ── Pagos pendientes de confirmación (Efectivo) ── */}
        {detalle.pagos?.some(p => p.metodo === 'efectivo' && p.confirmado === false && p.anulado === false) && (
          <div className="card" style={{
            marginTop: 16,
            border: '2px solid rgba(16,185,129,0.25)',
            background: 'linear-gradient(135deg, rgba(232,252,246,0.95), rgba(217,249,239,0.95))',
          }}>
            <div className="card-header" style={{ background: 'rgba(16,185,129,0.12)', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--success)" />
                <span className="card-title" style={{ color: 'var(--success)' }}>Verificar Pago Efectivo</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--success)', color: '#fff', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {detalle.pagos.filter(p => p.metodo === 'efectivo' && p.confirmado === false && p.anulado === false).length} pendiente(s)
                </span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detalle.pagos.filter(p => p.metodo === 'efectivo' && p.confirmado === false && p.anulado === false).map(p => (
                <div key={p.id} style={{
                  display: 'flex', gap: 18, alignItems: 'flex-start',
                  padding: '16px 18px', borderRadius: 14,
                  background: 'var(--surface)', border: '1.5px solid rgba(16,185,129,0.22)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  flexWrap: 'wrap',
                }}>
                  {/* Datos */}
                  <div style={{ flex: 1, fontSize: 13, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>Pago por Efectivo</span>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid rgba(58,174,216,0.35)', fontWeight: 600 }}>⏳ Pendiente</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Monto:</span> <strong>S/ {Number(p.monto).toFixed(2)}</strong></div>
                      <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-muted)' }}>Enviado:</span> {new Date(p.pagado_en).toLocaleString('es-PE')}</div>
                    </div>
                  </div>

                  {/* Acciones */}
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
                      <CheckCircle size={15} /> Aprobar Efectivo
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
                </div>
              ))}
            </div>
          </div>
        )}`;

content = content.replace(regexPendientes, newPendientes);


// 2. Remove "Historial de todos los pagos" from `vista === 'detalle'`
const regexHistorial = /\{\/\*\s*──\s*Historial de todos los pagos\s*──\s*\*\/\}.*?\}\)\}/s;
content = content.replace(regexHistorial, "");


// 3. The facturas table logic:
// Above the facturas table, they want a filter. I'll need to check where the facturas table is rendered.
// Let's just output the current changes, write the script and run it, and then I'll inspect the facturas table directly.

fs.writeFileSync('src/pages/Pagos.jsx', content, 'utf8');
console.log('Fixed Pagos.jsx');
