const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

let replacedFiles = 0;

files.forEach(file => {
  // Skip the layout and GlobalConfirmModal to avoid recursive issues
  if (file.includes('GlobalConfirmModal') || file.includes('exam\\\\page.tsx')) return;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to find: if (!confirm("...")) return;
  // This is tricky because confirm is synchronous, but showConfirm is async.
  // if (!confirm("Hapus soal ini?")) return;
  // -> showConfirm({ title: 'Konfirmasi', message: 'Hapus soal ini?', onConfirm: () => { ... } })
  // Since it's not possible to easily turn synchronous confirm into asynchronous one via simple regex,
  // we have to be careful.
});
console.log(`Replaced in ${replacedFiles} files`);
