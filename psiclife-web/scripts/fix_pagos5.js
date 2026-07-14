const fs = require('fs');
let content = fs.readFileSync('src/pages/Pagos.jsx', 'utf8');

// 1. Add state variables for filters
const stateAnchor = `const [pagosConf,       setPagosConf]       = useState([])`;
const stateInjection = `const [pagosConf,       setPagosConf]       = useState([])
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')`;
content = content.replace(stateAnchor, stateInjection);

// 2. Add facturasFiltradas before `if (vista === 'detalle' && detalle)`
const renderAnchor = `if (vista === 'detalle' && detalle) {`;
const filteredFacturasStr = `
  const facturasFiltradas = facturas.filter(f => {
    let pasa = true;
    if (filtroMetodo) {
      const methods = f.pagos?.map(p => p.metodo) || [];
      if (!methods.includes(filtroMetodo)) pasa = false;
    }
    if (filtroFecha) {
      const fDate = new Date(f.emitida_en).toISOString().split('T')[0];
      if (fDate !== filtroFecha) pasa = false;
    }
    return pasa;
  });

  if (vista === 'detalle' && detalle) {`;
content = content.replace(renderAnchor, filteredFacturasStr);

// 3. Add filters UI above the table and update table mapping
// the table is inside `tab === 'facturas'` -> around line 606 `cargando && facturas.length === 0`
const tableAnchor = `        {cargando && facturas.length === 0 ? <Spinner /> : facturas.length === 0
          ? <EmptyState titulo="Sin facturas" descripcion="Crea la primera factura con el botón de arriba." />
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>N° Factura</th><th>Paciente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {facturas.map(f => (`;

const tableReplacement = `        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: 180, fontSize: 13 }} value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
            <option value="">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="yape">Yape</option>
            <option value="transferencia">Transferencia</option>
          </select>
          <input type="date" className="form-control" style={{ width: 180, fontSize: 13 }} value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
          {(filtroMetodo || filtroFecha) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFiltroMetodo(''); setFiltroFecha(''); }}>Limpiar</button>
          )}
        </div>

        {cargando && facturas.length === 0 ? <Spinner /> : facturasFiltradas.length === 0
          ? <EmptyState titulo="Sin facturas" descripcion="Crea la primera factura con el botón de arriba, o prueba limpiando los filtros." />
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>N° Factura</th><th>Paciente</th><th>Fecha</th><th>Método de pago</th><th>Total</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {facturasFiltradas.map(f => {
                    const metodos = Array.from(new Set(f.pagos?.map(p => p.metodo))).filter(Boolean);
                    const metodoTxt = metodos.length > 0 ? metodos.join(', ') : '—';
                    return (
`;
content = content.replace(tableAnchor, tableReplacement);

// We need to also add the `<td>` for the payment method and fix the closing `return (` for the map we just opened.
const tableRowAnchor = `                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12.5 }}>{f.numero_factura}</td>
                      <td style={{ fontWeight: 500 }}>{f.paciente?.apellidos}, {f.paciente?.nombres}</td>
                      <td>{new Date(f.emitida_en).toLocaleDateString('es-PE')}</td>
                      <td style={{ fontWeight: 600 }}>S/ {Number(f.total).toFixed(2)}</td>`;
const tableRowReplacement = `                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12.5 }}>{f.numero_factura}</td>
                      <td style={{ fontWeight: 500 }}>{f.paciente?.apellidos}, {f.paciente?.nombres}</td>
                      <td>{new Date(f.emitida_en).toLocaleDateString('es-PE')}</td>
                      <td style={{ textTransform: 'capitalize' }}>{metodoTxt}</td>
                      <td style={{ fontWeight: 600 }}>S/ {Number(f.total).toFixed(2)}</td>`;
content = content.replace(tableRowAnchor, tableRowReplacement);

// Close the map block properly since we added `{... return (`
const tableEndAnchor = `                  ))}
                </tbody>
              </table>`;
const tableEndReplacement = `                  )})}
                </tbody>
              </table>`;
content = content.replace(tableEndAnchor, tableEndReplacement);


fs.writeFileSync('src/pages/Pagos.jsx', content, 'utf8');
console.log('Fixed filters in Pagos.jsx');
