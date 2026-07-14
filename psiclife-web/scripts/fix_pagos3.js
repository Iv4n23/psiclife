const fs = require('fs')

let code = fs.readFileSync('src/pages/Pagos.jsx', 'utf8')

// 1. Line 1051 -> 1038 in restored
code = code.replace(
  "const hayPend  = mf.pagos?.some(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false)",
  "const hayPend  = mf.pagos?.some(p => p.confirmado === false && !p.anulado)"
)

// 2. Line 1111 -> 1098 in restored
code = code.replace(
  "const esPend = (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false",
  "const esPend = p.confirmado === false && !p.anulado"
)

// 3. Line 1132 -> 1119 in restored
code = code.replace(
  `<span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.metodo}</span>`,
  `<span className={\`badge \${p.metodo === 'efectivo' ? 'badge-success' : p.metodo === 'yape' ? 'badge-warning' : p.metodo === 'transferencia' ? 'badge-info' : 'badge-ghost'}\`} style={{ textTransform: 'capitalize' }}>{p.metodo === 'efectivo' ? '💵 Efectivo' : p.metodo === 'yape' ? '📱 Yape' : p.metodo === 'transferencia' ? '🏦 Transferencia' : p.metodo}</span>`
)

// 4. Line 681 (color bar)
code = code.replace(
  `<div style={{ height:3, background: p.metodo === 'yape' ? 'linear-gradient(90deg,#7c3aed,#9333ea)' : 'linear-gradient(90deg,#2563eb,#0ea5e9)' }} />`,
  `<div style={{ height:3, background: p.metodo === 'efectivo' ? 'linear-gradient(90deg,#10b981,#059669)' : p.metodo === 'yape' ? 'linear-gradient(90deg,#7c3aed,#9333ea)' : 'linear-gradient(90deg,#2563eb,#0ea5e9)' }} />`
)

// 5. Line 684-705 (Image hide)
code = code.replace(
  `{/* Voucher image */}
                      <div style={{ flexShrink:0 }}>`,
  `{/* Voucher image */}
                      {p.metodo !== 'efectivo' && (
                      <div style={{ flexShrink:0 }}>`
)
code = code.replace(
  `                        )}
                      </div>

                      {/* Info */}`,
  `                        )}
                      </div>
                      )}

                      {/* Info */}`
)

// 6. Line 715-720 (Badge styles)
code = code.replace(
  `                            background: p.metodo === 'yape' ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)',
                            color: p.metodo === 'yape' ? '#7c3aed' : '#2563eb',
                            border: \`1px solid \${p.metodo === 'yape' ? 'rgba(124,58,237,0.3)' : 'rgba(37,99,235,0.3)'}\`,
                            textTransform:'capitalize',
                          }}>
                            {p.metodo === 'yape' ? '📱 Yape' : '🏦 Transferencia'}`,
  `                            background: p.metodo === 'efectivo' ? 'rgba(16,185,129,0.1)' : p.metodo === 'yape' ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)',
                            color: p.metodo === 'efectivo' ? '#10b981' : p.metodo === 'yape' ? '#7c3aed' : '#2563eb',
                            border: \`1px solid \${p.metodo === 'efectivo' ? 'rgba(16,185,129,0.3)' : p.metodo === 'yape' ? 'rgba(124,58,237,0.3)' : 'rgba(37,99,235,0.3)'}\`,
                            textTransform:'capitalize',
                          }}>
                            {p.metodo === 'efectivo' ? '💵 Efectivo' : p.metodo === 'yape' ? '📱 Yape' : '🏦 Transferencia'}`
)

// 7. Line 697 (N operacion)
code = code.replace(
  `<div><span style={{ color:'var(--text-muted)' }}>N° Operación:</span> <code style={{ background:'var(--surface-2)', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{p.codigo_referencia || '—'}</code></div>`,
  `{p.metodo !== 'efectivo' && <div><span style={{ color:'var(--text-muted)' }}>N° Operación:</span> <code style={{ background:'var(--surface-2)', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{p.codigo_referencia || '—'}</code></div>}`
)

// 8. Line 1097 (Modal Factura - Add Modality)
code = code.replace(
  `<div><span style={{ color: 'var(--text-muted)' }}>Servicio:</span> {mf.descripcion_servicio}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fecha emisión:</span>`,
  `<div><span style={{ color: 'var(--text-muted)' }}>Servicio:</span> {mf.descripcion_servicio}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Modalidad:</span> <span style={{ textTransform: 'capitalize' }}>{mf.cita?.modalidad || '—'}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fecha emisión:</span>`
)


fs.writeFileSync('src/pages/Pagos.jsx', code)
console.log('Fixed Pagos.jsx')
