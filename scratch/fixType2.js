const fs = require('fs');
let content = fs.readFileSync('src/components/tutor/SessionCbtManager.tsx', 'utf8');
content = content.replace(/size="icon"/g, 'size="sm"');
fs.writeFileSync('src/components/tutor/SessionCbtManager.tsx', content);
