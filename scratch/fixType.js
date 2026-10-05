const fs = require('fs');
let content = fs.readFileSync('src/components/tutor/SessionCbtManager.tsx', 'utf8');
content = content.replace(/variant="outline"/g, 'variant="secondary"');
fs.writeFileSync('src/components/tutor/SessionCbtManager.tsx', content);
