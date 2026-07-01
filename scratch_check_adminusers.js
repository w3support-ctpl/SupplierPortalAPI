const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'ctpl@123',
    database: 'supplierportalnest'
});

db.query('DESCRIBE adminusers', (err, results) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Columns:", results);
    }
    process.exit();
});
