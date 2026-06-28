const fs = require('fs');
const path = 'c:/Users/rayha/Downloads/lmsss/ace-system.sql';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_]+)/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2');
fs.writeFileSync(path, content);
console.log('Done!');
