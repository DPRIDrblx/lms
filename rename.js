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
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/rayha/Downloads/lmsss/src');
// Add other root files if necessary, like layout.tsx, but it's inside src/

let changedFiles = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/Nusantara International Academy \(NIA\)/g, "IGNITE")
        .replace(/Nusantara International Academy/g, "IGNITE")
        .replace(/Nusantara \(NIA\)/g, "IGNITE")
        .replace(/\bNIA Tutoring\b/g, "IGNITE Tutoring")
        .replace(/\bSobat NIA\b/g, "Sobat IGNITE")
        .replace(/\bNIA-/g, "IGNITE-")
        .replace(/\bNIA\b/g, "IGNITE");

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});
console.log(`Finished. Updated ${changedFiles} files.`);
