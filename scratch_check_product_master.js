const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: 3306,  
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'ctpl@123',
    database: process.env.DB_NAME || 'supplierportalnest'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
    
    db.query('DESCRIBE ProductMaster', (err, rows) => {
        console.log('ProductMaster schema:', rows);
        db.end();
    });
});
