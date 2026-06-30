const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const f of files) {
  const filePath = path.join(pagesDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern: {cargando ? <Spinner /> : array.length === 0
  // Replacement: {cargando && array.length === 0 ? <Spinner /> : array.length === 0
  const spinnerRegex = /\{cargando \? <Spinner \/> : (\w+)\.length === 0/g;
  if (spinnerRegex.test(content)) {
    content = content.replace(spinnerRegex, '{cargando && $1.length === 0 ? <Spinner /> : $1.length === 0');
    changed = true;
  }

  // Same pattern with a space before length: array .length
  // Pattern: <div className="card">\s*\{cargando &&
  const cardRegex = /<div className="card">\s*\{cargando &&/g;
  if (cardRegex.test(content)) {
    content = content.replace(cardRegex, '<div className="card" style={{ opacity: cargando ? 0.6 : 1, transition: \'opacity 0.2s\', pointerEvents: cargando ? \'none\' : \'auto\' }}>\n        {cargando &&');
    changed = true;
  }

  // What about WebMedica?
  // if (cargando) return <Spinner />
  // -> if (cargando && !data) return <Spinner /> ?
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + f);
  }
}
