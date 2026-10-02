const fs = require('fs'); 
const file = 'src/components/tutor/SessionCbtManager.tsx'; 
let data = fs.readFileSync(file, 'utf8'); 
data = data.split('variant="outline"').join('variant="secondary"'); 
data = data.split('variant="destructive"').join('variant="danger"'); 
fs.writeFileSync(file, data);
