const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

const lines = content.split('\n');
console.log('--- req.session in app.js ---');
lines.forEach((line, index) => {
    if (line.includes("req.session")) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
