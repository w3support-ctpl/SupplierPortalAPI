const fs = require('fs');
const content = fs.readFileSync('frontend/src/app/portal/dashboard/page.tsx', 'utf8');

const lines = content.split('\n');
console.log('--- Search products in dashboard ---');
lines.forEach((line, index) => {
    if (line.includes("products") || line.includes("products") || line.includes("master")) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
