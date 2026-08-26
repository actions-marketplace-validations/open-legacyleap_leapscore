const fs = require('fs');
const path = require('path');
const RUBRIC_DIR = path.resolve(__dirname, "..", "..", "..", "docs/rubric");
const files = fs.readdirSync(RUBRIC_DIR).filter(f => f.match(/^(?!00)\d{2}_.*\.md$/));
console.log("Files:", files);
files.forEach(file => {
    const content = fs.readFileSync(path.join(RUBRIC_DIR, file), 'utf-8');
    const lines = content.split('\n');
    let indicators = 0;
    lines.forEach(line => {
        if (line.startsWith('### ')) {
            indicators++;
        }
    });
    console.log(file, "indicators:", indicators);
});
