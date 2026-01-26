const fs = require('fs');
const path = require('path');

const files = [
    'public/script.js',
    'public/styles.css',
    'public/index.html',
    'updateDB.js'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Regex to match conflict blocks and keep HEAD
        // Note: [^] matches any character including newline
        // We use non-greedy matching *?
        content = content.replace(/<<<<<<< HEAD\s+([\s\S]*?)\s+=======\s+[\s\S]*?\s+>>>>>>> [a-f0-9]+/g, '$1');

        fs.writeFileSync(filePath, content);
        console.log(`Resolved ${file} (Kept HEAD)`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
