const fs = require('fs');
const path = 'c:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-web/src/pages/Pagos.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update verDetalle to detect pending efectivo
content = content.replace(
  "      const pagadoCalc = (f.pagos || []).filter(p => p.confirmado && !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0)\n      const restanteCalc = Number(f.total) - pagadoCalc\n\n      setFormPago({ metodo: 'efectivo', monto: restanteCalc > 0 ? restanteCalc.toFixed(2) : '', codigo_referencia: '' })",
  "      const pagadoCalc = (f.pagos || []).filter(p => p.confirmado && !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0)\n      const restanteCalc = Number(f.total) - pagadoCalc\n      const pendingEfectivo = (f.pagos || []).find(p => p.confirmado === false && !p.anulado && p.metodo === 'efectivo')\n\n      if (pendingEfectivo) {\n        setFormPago({ metodo: 'efectivo', monto: Number(pendingEfectivo.monto).toFixed(2), codigo_referencia: '', id_pendiente: pendingEfectivo.id })\n      } else {\n        setFormPago({ metodo: 'efectivo', monto: restanteCalc > 0 ? restanteCalc.toFixed(2) : '', codigo_referencia: '' })\n      }"
);

// 2. Fix the Detalle de Pago card styles for dark mode
const oldCard = `<div className="card" style={{ background: 'linear-gradient(145deg, #ffffff, #f8fafc)', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', borderRadius: 20 }}>
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
                )}`;

const newCard = `<div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', borderRadius: 20 }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
              <span className="card-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Detalle de Pago</span>
            </div>
            <div className="card-body" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Servicio</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{detalle.descripcion_servicio}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Profesional a cargo</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{detalle.psicologo?.nombres} {detalle.psicologo?.apellidos}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Total</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>S/ {Number(detalle.total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Pagado</span>
                  <span style={{ color: 'var(--success)', fontSize: 15, fontWeight: 700 }}>S/ {pagado.toFixed(2)}</span>
                </div>
                {restante > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.1)', padding: '12px 16px', borderRadius: 12, marginTop: 8 }}>
                    <span style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>Saldo pendiente</span>
                    <span style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 800 }}>S/ {restante.toFixed(2)}</span>
                  </div>
                )}`;
content = content.replace(oldCard, newCard);

// 3. Update Registrar Pago block to disable inputs if formPago.id_pendiente is present, and show approve/reject buttons
const oldFormGroup1 = `<div className="form-group">
                      <label className="form-label">Método de pago</label>
                      <select className="form-control" value={formPago.metodo}
                        onChange={e => setFormPago(p => ({ ...p, metodo: e.target.value, codigo_referencia: '' }))}>`;
const newFormGroup1 = `<div className="form-group">
                      <label className="form-label">Método de pago</label>
                      <select className="form-control" value={formPago.metodo} disabled={!!formPago.id_pendiente}
                        onChange={e => setFormPago(p => ({ ...p, metodo: e.target.value, codigo_referencia: '' }))}>`;
content = content.replace(oldFormGroup1, newFormGroup1);

const oldFormGroup2 = `<div className="form-group">
                      <label className="form-label">Monto (S/) <span className="required">*</span></label>
                      <input type="number" className={\`form-control \${errPago.monto?'error':''}\`}
                        value={formPago.monto} min={0.01} step="0.01"
                        onChange={e => { setFormPago(p => ({ ...p, monto: e.target.value })); setErrPago({}) }}
                        placeholder={\`Máx. S/ \${restante.toFixed(2)}\`} />`;
const newFormGroup2 = `<div className="form-group">
                      <label className="form-label">Monto (S/) <span className="required">*</span></label>
                      <input type="number" className={\`form-control \${errPago.monto?'error':''}\`}
                        value={formPago.monto} min={0.01} step="0.01"
                        disabled={!!formPago.id_pendiente}
                        onChange={e => { setFormPago(p => ({ ...p, monto: e.target.value })); setErrPago({}) }}
                        placeholder={\`Máx. S/ \${restante.toFixed(2)}\`} />`;
content = content.replace(oldFormGroup2, newFormGroup2);

// 4. Update the submit buttons
const oldButtons = `<div className="form-footer" style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={registrarPago} disabled={guardando} style={{ width: '100%', justifyContent: 'center' }}>
                      <CheckCircle size={14}/> {guardando ? 'Procesando...' : (formPago.metodo === 'efectivo' ? 'Registrar pago' : 'Enviar comprobante')}
                    </button>
                  </div>`;
const newButtons = `<div className="form-footer" style={{ marginTop: 14 }}>
                    {formPago.id_pendiente ? (
                      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                        <button className="btn btn-primary" onClick={() => confirmarPagoYape(formPago.id_pendiente)} disabled={guardando} style={{ flex: 1, justifyContent: 'center' }}>
                          <CheckCircle size={14}/> Aprobar
                        </button>
                        <button className="btn btn-danger" onClick={() => rechazarPago(formPago.id_pendiente)} disabled={guardando} style={{ flex: 1, justifyContent: 'center' }}>
                          <X size={14}/> Rechazar
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={registrarPago} disabled={guardando} style={{ width: '100%', justifyContent: 'center' }}>
                        <CheckCircle size={14}/> {guardando ? 'Procesando...' : (formPago.metodo === 'efectivo' ? 'Registrar pago' : 'Enviar comprobante')}
                      </button>
                    )}
                  </div>`;
content = content.replace(oldButtons, newButtons);

// 5. Update the titles for Registrar Pago to indicate pending verification
const oldFormTitle = `<div className="card-header"><span className="card-title">Registrar Pago</span></div>`;
const newFormTitle = `<div className="card-header"><span className="card-title">{formPago.id_pendiente ? 'Verificar Pago Efectivo' : 'Registrar Pago'}</span></div>`;
content = content.replace(oldFormTitle, newFormTitle);

fs.writeFileSync(path, content);
console.log('Pagos.jsx updated successfully');
