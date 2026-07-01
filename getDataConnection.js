const mysql = require('mysql2');


// Create connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: 3306,  
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'ctpl@123',
    database: process.env.DB_NAME || 'supplierportalnest'
});

// Connect to DB
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

const getRegisteredProducts = (req, res) => {
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: UserId not found in session' });
    }

    const sql = 'SELECT * FROM registerproducts WHERE UserId = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }

        res.status(200).json({ products: results });
    });
};

// const getUserDetails = (req, res) => {
//     const { userName } = req.query;

//     if (!userName) {
//         return res.status(400).json({ error: 'Username is required' });
//     }

//     const sql = 'SELECT * FROM createnewuser WHERE UserName = ?';
//     db.query(sql, [userName], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ error: 'Database query failed' });
//         }

//         if (results.length === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         res.status(200).json({ user: results[0] });
//     });
// };




module.exports = {
    // existing exports...
    getRegisteredProducts
   
};




