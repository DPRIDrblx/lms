const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('Loader2') && !content.includes('CenterLoader')) {
        // Add import
        content = content.replace(/(import.*lucide-react['"];)/, "$1\nimport { CenterLoader } from \"@/components/ui/center-loader\";");
        
        // Replace large Loader2 with CenterLoader
        content = content.replace(/<Loader2[^>]*?(w-8 h-8|w-12 h-12|h-8 w-8|h-10 w-10|w-10 h-10)[^>]*?\/>/g, '<CenterLoader size="md" />');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, '..', 'src', 'app', '(dashboard)', 'student'));
