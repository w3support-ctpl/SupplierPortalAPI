require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 87;
const path = require('path');
const SapCfAxios = require("sap-cf-axios").default;
var nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const axios = require("axios");
const cors = require("cors");
const session = require('express-session');
const { compareSync } = require('bcryptjs');
const { url } = require('inspector');
const bcrypt = require("bcryptjs")
const mysql = require('mysql2');
const dbConnection = require('./dbConnection');
const getDataConnection = require('./getDataConnection');
const fileUpload = require('express-fileupload');
const fs = require('fs');
app.use(fileUpload());


const { Sequelize, DataTypes } = require('sequelize');


// Setting up the view engine and views directory (Disabled for headless API)
// app.set('views', __dirname + '/app/server/views');
// app.set('view engine', 'ejs');

// Serving static files from the public directory (Disabled for headless API)
// app.use(express.static(__dirname + '/app/public'));

// app.use('/app/images', express.static(path.join(__dirname, 'app/images')));

// app.use('/app/styles/', express.static(path.join(__dirname, 'app/styles')));
// app.use('/app/styles', express.static(path.join(__dirname, 'app/public/styles')));

//const filePath = path.join(__dirname, 'server', 'Template download', 'product-template.xlsx');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/fileUploads', express.static(path.join(__dirname, 'fileUploads')));



// Importing routes from the routes file
//require('./app/routes')(app);

const hana_connection = "Gate_appDEV";  // Dev server
//const hostname = 'my401677-api.s4hana.cloud.sap';
const hostname = 'https://my401677-api.s4hana.cloud.sap';
//const AuthorizationPrd = 'Basic Q1RQTEFCQVA6UGFzc3dvcmRAIzA5ODc2NTQzMjE=';

const AuthorizationPrd = 'Basic Y3RwbGFiYXA6UGFzc3dvcmRAIzA5ODc2NTQzMjE=';



app.use(express.json()); // required to parse JSON body
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const corsOptions = {
    origin: true, // or specify your frontend origin like 'http://localhost:3000'
    credentials: true
};
app.use(cors(corsOptions));

// Add session middleware
app.use(session({
    secret: 'CTPLABAP', // replace with your own secret
    resave: false,
    saveUninitialized: true,

}));

// Attach username and session to every request/response if session exists
app.use((req, res, next) => {
    if (req.session && req.session.username) {
        req.username = req.session.username;
        console.log("Middleware: Username from session is", req.username);
    }
    res.locals.session = req.session || {};
    next();
});
// require('./app/routes')(app); // EJS UI routes disabled

// MY SQL CONNECTION



// Example route to get data from the database

app.get("/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is working",
        timestamp: new Date().toISOString()
    });
});

app.post('/save', dbConnection.pracSave);
app.post('/createUserNow', dbConnection.pracCreateNewUser);
app.post('/RegiComp', dbConnection.regiCompDb);
app.post('/EmailCheck', dbConnection.EmailDb);
app.post('/RegiPro', dbConnection.regiProDb);
app.post('/DeliLoc', dbConnection.deliLocDb);
app.post('/PayInfo', dbConnection.payInfoDb);
app.post('/AddPro', dbConnection.addProDb);
app.post('/getProductCategory', dbConnection.getProductCategory);
app.post('/getProductPacking', dbConnection.getProductPacking);
app.post('/getMeasurementUnit', dbConnection.getMeasurementUnit);
app.post('/getCurrency', dbConnection.getCurrency);
app.post('/getCountryOfOperation', dbConnection.getCountryOfOperation);
app.post('/getStates', dbConnection.getStates);
app.post('/getdistricts', dbConnection.getdistricts);
app.post('/getcities', dbConnection.getcities);
app.post('/getDeliveryMode', dbConnection.getDeliveryMode);
app.post('/getDeliveryPartners', dbConnection.getDeliveryPartners);
app.get('/getProductCatalogue', dbConnection.getProductCatalogue);
app.post('/addProductCatalogue', dbConnection.addProductCatalogue);
app.post('/updateProductCatalogue', dbConnection.updateProductCatalogue);
app.post('/deleteProductCatalogue', dbConnection.deleteProductCatalogue);
app.post('/registerSupplierProduct', dbConnection.registerSupplierProduct);
app.get('/getSupplierMappings', dbConnection.getSupplierMappings);
app.post('/proposeNewProduct', dbConnection.proposeNewProduct);
app.get('/getSupplierProposals', dbConnection.getSupplierProposals);
app.get('/getAdminPendingApprovals', dbConnection.getAdminPendingApprovals);
app.post('/approveProductMapping', dbConnection.approveProductMapping);
app.post('/approveProductPrice', dbConnection.approveProductPrice);
app.get('/getAdminProposals', dbConnection.getAdminProposals);
app.post('/reviewProposal', dbConnection.reviewProposal);
app.post('/createContract', dbConnection.createContract);
app.get('/getContracts', dbConnection.getContracts);
app.post('/bulkUploadProductMaster', dbConnection.bulkUploadProductMaster);
app.post('/bulkUploadSupplierMappings', dbConnection.bulkUploadSupplierMappings);
app.get('/getProductCatalogueReport', dbConnection.getProductCatalogueReport);
app.post('/syncSapMaterials', dbConnection.syncSapMaterials);
app.post('/saveOdataProduct', dbConnection.saveOdataProduct);
app.post('/uploadProductEdits', dbConnection.uploadProductEdits);
app.get('/getProductEditsApprovals', dbConnection.getProductEditsApprovals);
app.post('/approveProductEdit', dbConnection.approveProductEdit);
app.post('/rejectProductEdit', dbConnection.rejectProductEdit);
app.post('/parseProductEdits', dbConnection.parseProductEdits);



app.post('/RegistrationStatusload', dbConnection.RegistrationStatus);
app.post('/CompDoc', dbConnection.compDocDb);



app.post('/getAddModalProdCateg', dbConnection.getProductCategory);
app.post('/getAddModalProdPacking', dbConnection.getProductPacking);
app.post('/getAddModalMeasurementUnit', dbConnection.getMeasurementUnit);
app.post('/getAddModalCurrency', dbConnection.getCurrency);

//For the Registration status
app.post('/allRegistrationStatus', dbConnection.allRegistrationStatus);
app.get('/getOnboardingUsersList', dbConnection.getOnboardingUsersList);
app.get('/getCompletedSuppliers', dbConnection.getCompletedSuppliers);
app.post('/rejectOnboardingUser', dbConnection.rejectOnboardingUser);
app.post('/approveOnboardingUser', dbConnection.approveOnboardingUser);
app.post('/checkOnboardingStatus', dbConnection.checkOnboardingStatus);
app.post('/approveOnboardingProfile', dbConnection.approveOnboardingProfile);
app.post('/rejectOnboardingProfile', dbConnection.rejectOnboardingProfile);

app.get('/getCompanyDetails', dbConnection.getCompanyDetails);
app.get('/getDeliveryLocations', dbConnection.getDeliveryLocations);
app.get('/getPaymentInfo', dbConnection.getPaymentInfo);
app.get('/getComplianceDoc', dbConnection.getComplianceDoc);

app.get('/getSapSuppliers', async (req, res) => {
    try {
        const response = await axios.get('https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zsb_supplier_dts_cds/srvd_a2x/sap/zsd_supplier_dts_cds/0001/ZSUPPLIER_DTS_CDS', {
            headers: {
                'Authorization': 'Basic ' + Buffer.from('CTPLABAP:Password@#0987654321').toString('base64')
            }
        });
        res.json({ success: true, data: response.data.value });
    } catch (error) {
        console.error('Error fetching SAP suppliers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch SAP suppliers' });
    }
});




//GET DATA FROM MYSQL DATABASE
app.post('/getRegisteredProducts', getDataConnection.getRegisteredProducts);
//app.post('/getUserDetails', getDataConnection.getUserDetails);


const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'ctpl@123',
    database: process.env.DB_NAME || 'supplierportalnest'
});



// Setup DB Connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});


// Define User model
// const User = sequelize.define('User', {
//     email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true
//     },
//     verified: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false
//     }
// });
// In-memory OTP store
const OTP_STORE = {};

// Email transporter
// const transporter = nodemailer.createTransport({
//     service: 'smtp.office365.com',
//     auth: {
//         // user: process.env.EMAIL_USER,
//         // pass: process.env.EMAIL_PASS
//         user: 'spadmin@castaliaz.co.in',
//         pass: 'V$307267025160aw'
//     }
// });


const transporter = nodemailer.createTransport({
    host: "email.prolifics.info",
    port: 25,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS


    },
    tls: {
        ciphers: 'SSLv3'
    },
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
    }
});



// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// // ➤ Send OTP
// // ➤ Send OTP
// app.post('/send-otp', async (req, res) => {
//     const { emailVerify } = req.body;
//     if (!emailVerify) return res.status(400).json({ error: 'Email is required' });

//     const otp = generateOTP();
//     const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

//     OTP_STORE[emailVerify] = { otp, expiresAt };

//     try {
//         await transporter.sendMail({
//             // from: 'spadmin@castaliaz.co.in',
//             // from: 'An16666Pa@prolifics.com',
//             from: 'qpncz27280@minitts.net',
//             to: emailVerify,
//             subject: 'Your OTP Code',
//             text: `Your OTP is ${otp}. It will expire in 3 minutes.`
//         });

//         res.json({ message: 'OTP sent successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to send OTP', details: error.message });
//     }
// });

// // ➤ Verify OTP
// app.post('/verify-otp', (req, res) => {
//     const { emailVerify, otp } = req.body;
//     if (!emailVerify || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

//     const record = OTP_STORE[emailVerify];
//     if (!record) return res.status(400).json({ error: 'No OTP sent to this email' });

//     if (Date.now() > record.expiresAt) {
//         delete OTP_STORE[emailVerify];
//         return res.status(400).json({ error: 'OTP expired' });
//     }

//     if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

//     // ✅ Save verified email in session
//     // req.session.emailVerified = emailVerify;
//     //req.session.userId = emailVerify.split('@')[0]; // or however you want to derive userId

//     res.json({ message: 'OTP verified successfully. You can now save email.' });
// });



// const OTP_STORE = {};

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP (Development Version - No Email)
// app.post('/send-otp', (req, res) => {
//     const { emailVerify } = req.body;

//     if (!emailVerify) {
//         return res.status(400).json({
//             error: 'Email is required'
//         });
//     }

//     const otp = generateOTP();
//     const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

//     OTP_STORE[emailVerify] = {
//         otp,
//         expiresAt
//     };

//     console.log(`OTP for ${emailVerify}: ${otp}`);

//     res.status(200).json({
//         success: true,
//         message: 'OTP generated successfully',
//         otp, // Remove this in production
//         expiresIn: '3 minutes'
//     });
// });

// // Verify OTP
// app.post('/verify-otp', (req, res) => {
//     const { emailVerify, otp } = req.body;

//     if (!emailVerify || !otp) {
//         return res.status(400).json({
//             error: 'Email and OTP are required'
//         });
//     }

//     const storedData = OTP_STORE[emailVerify];

//     if (!storedData) {
//         return res.status(400).json({
//             success: false,
//             message: 'OTP not found'
//         });
//     }

//     if (Date.now() > storedData.expiresAt) {
//         delete OTP_STORE[emailVerify];

//         return res.status(400).json({
//             success: false,
//             message: 'OTP expired'
//         });
//     }

//     if (storedData.otp !== otp) {
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid OTP'
//         });
//     }

//     delete OTP_STORE[emailVerify];

//     return res.status(200).json({
//         success: true,
//         message: 'OTP verified successfully'
//     });
// });



// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: true,
//     auth: {
//         user: "developerreact000@gmail.com",
//         pass: "fvinqgifefjadgte"
//     }
// });




// Send OTP
app.post("/send-otp", async (req, res) => {
    try {
        const { emailVerify } = req.body;

        if (!emailVerify) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 3 * 60 * 1000;

        OTP_STORE[emailVerify] = {
            otp,
            expiresAt
        };

        console.log("Generated OTP for " + emailVerify + " is: " + otp);

        await transporter.sendMail({
            // from: '"CTPL" <developerreact000@gmail.com>',
            from: '"CTPL" <spadmin@castaliaz.in>"',
            to: emailVerify,
            subject: "Email Verification OTP",
            html: `
        <h2>Your OTP Code</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 3 minutes.</p>
      `
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: error.message
        });
    }
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
    const { emailVerify, otp } = req.body;

    if (!emailVerify || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
    }

    const storedData = OTP_STORE[emailVerify];

    if (!storedData) {
        return res.status(400).json({
            success: false,
            message: "OTP not found"
        });
    }

    if (Date.now() > storedData.expiresAt) {
        delete OTP_STORE[emailVerify];

        return res.status(400).json({
            success: false,
            message: "OTP expired"
        });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }

    delete OTP_STORE[emailVerify];

    return res.status(200).json({
        success: true,
        message: "OTP verified successfully"
    });
});




// Define the route
app.get('/download-template', function (req, res) {
    const filePath = path.join(__dirname, 'app/server/TemplateDownload/Temp.xlsx');
    console.log('Downloading from:', filePath);

    res.download(filePath, 'Product_Template.xlsx', function (err) {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('File download failed.');
        }
    });
});


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const fileUploadDir = path.join(__dirname, 'fileUploads');
if (!fs.existsSync(fileUploadDir)) {
    fs.mkdirSync(fileUploadDir);
}



// const uploadDirCD = path.join(__dirname, 'uploadsCD');
// if (!fs.existsSync(uploadDirCD)){
//     fs.mkdirSync(uploadDirCD);
// }

const crypto = require('crypto');

app.get('/getUserDetails', (req, res) => {
    // If active session exists, return session user info
    if (req.session && req.session.UserName) {
        return res.status(200).json({
            success: true,
            username: req.session.role === 'Supplier' ? (req.session.ActualSupplierName || req.session.UserName) : req.session.UserName,
            role: req.session.role || 'Supplier',
            supplierCode: req.session.role === 'Supplier' ? (req.session.ActualSupplierCode || req.session.Suppliercode) : req.session.Suppliercode
        });
    }

    const { email } = req.query;

    if (!email) {
        return res.status(401).json({ error: 'No active session or email parameter provided.' });
    }

    const sql = 'SELECT * FROM onboarding_users WHERE EmailId = ? ORDER BY UserId DESC LIMIT 1';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Store userId in session
        const user = results[0];
        req.session.userId = user.UserId;
        req.session.UserName = user.PanNo;
        req.session.username = user.PanNo;
        req.session.panNo = user.PanNo;
        req.session.Suppliercode = 'CTPL';
        req.session.role = 'Supplier';

        res.status(200).json({
            success: true,
            username: user.PanNo,
            role: 'Supplier',
            supplierCode: 'CTPL',
            user: user
        });
    });
});

app.post('/updateUserDetails', (req, res) => {
    var userId = req.session.userId;

    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }
    const { email, panNo, gstnNo } = req.body;

    const sql = 'UPDATE onboarding_users SET EmailId=?, PanNo=?, GstnNo=? WHERE UserId=?';

    db.query(sql, [email, panNo, gstnNo, userId], (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'Database update error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            userId: userId
        });
    });
});

app.post('/send-verification-link', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const token = crypto.randomBytes(24).toString('hex');

        // Save token to email_verification_tokens
        const insertTokenSql = 'INSERT INTO email_verification_tokens (Email, Token, IsVerified) VALUES (?, ?, 0)';
        db.query(insertTokenSql, [email, token], async (err) => {
            if (err) {
                console.error('Error saving verification token:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            const host = req.get('host');
            const verificationLink = `${req.protocol}://${host}/verify-email-link?token=${token}&email=${encodeURIComponent(email)}`;

            try {
                await transporter.sendMail({
                    // from: '"CTPL" <developerreact000@gmail.com>',
                    from: '"CTPL" <spadmin@castaliaz.in>',
                    to: email,
                    subject: 'Verify Your Email Address - Supplier Portal',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <h2 style="color: #1F5485; text-align: center;">Verify Your Email Address</h2>
                            <p>Thank you for starting your supplier onboarding. Please click the button below to verify your email address:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationLink}" style="background-color: #1F5485; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #64748b;">${verificationLink}</p>
                            <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; Supplier Portal. All rights reserved.</p>
                        </div>
                    `
                });

                res.json({ success: true, message: 'Verification link sent successfully' });
            } catch (mailErr) {
                console.error('Mail sending error:', mailErr);
                res.status(500).json({ success: false, error: 'Failed to send verification email' });
            }
        });
    } catch (e) {
        console.error('Send verification link exception:', e);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/verify-email-link', (req, res) => {
    const { token, email } = req.query;
    if (!token || !email) {
        return res.status(400).send('<h2>Invalid Verification Link</h2><p>Missing email or token parameters.</p>');
    }

    const checkTokenSql = 'SELECT * FROM email_verification_tokens WHERE Email = ? AND Token = ? AND IsVerified = 0';
    db.query(checkTokenSql, [email, token], (err, results) => {
        if (err) {
            console.error('Error querying token:', err);
            return res.status(500).send('<h2>Server Error</h2><p>Failed to verify token.</p>');
        }

        if (results.length === 0) {
            return res.status(400).send('<h2>Invalid or Expired Link</h2><p>The verification link is invalid or has already been used.</p>');
        }

        const updateTokenSql = 'UPDATE email_verification_tokens SET IsVerified = 1 WHERE Email = ? AND Token = ?';
        db.query(updateTokenSql, [email, token], (err) => {
            if (err) {
                console.error('Error updating token:', err);
            }

            const findUserSql = 'SELECT UserId FROM onboarding_users WHERE EmailId = ?';
            db.query(findUserSql, [email], (err, users) => {
                if (!err && users.length > 0) {
                    const userId = users[0].UserId;
                    db.query('UPDATE onboarding_users SET IsEmailVerified = 1 WHERE UserId = ?', [userId]);
                    db.query('UPDATE registrationprocess SET isEmailVerified = true WHERE newuserid = ?', [userId]);
                    db.query('INSERT INTO verifyemail (UserId, EmailAddress) VALUES (?, ?)', [userId, email]);
                }
            });

            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Verified Successfully</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Inter', sans-serif;
                            background-color: #f1f5f9;
                            color: #1e293b;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 12px;
                            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                            text-align: center;
                            max-width: 480px;
                            width: 90%;
                        }
                        .icon {
                            font-size: 64px;
                            color: #10b981;
                            margin-bottom: 20px;
                        }
                        h1 {
                            font-size: 24px;
                            font-weight: 700;
                            margin-bottom: 10px;
                            color: #0f172a;
                        }
                        p {
                            color: #64748b;
                            font-size: 15px;
                            line-height: 1.6;
                            margin-bottom: 30px;
                        }
                        .btn {
                            background-color: #1F5485;
                            color: white;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: 600;
                            font-size: 14px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">✓</div>
                        <h1>Email Verified Successfully!</h1>
                        <p>Your email address has been verified. You can now close this tab and return to the onboarding wizard to complete your registration.</p>
                        <button class="btn" onclick="window.close()">Close Window</button>
                    </div>
                </body>
                </html>
            `);
        });
    });
});

app.get('/check-email-verification', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const checkSql = 'SELECT COUNT(*) AS count FROM email_verification_tokens WHERE Email = ? AND IsVerified = 1';
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.error('Error checking verification:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }

        const verified = results[0].count > 0;
        res.json({ success: true, verified: verified });
    });
});

// app.post('/upload-excel', (req, res) => {
//     const { excelData } = req.body;
//     const userId = req.session.userId; // get from session

//     if (!excelData || excelData.length === 0) {
//         return res.status(400).json({ message: 'No data received' });
//     }

//     if (!userId) {
//         return res.status(401).json({ message: 'User not logged in' });
//     }

//     excelData.forEach(row => {
//         const {
//             ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty,
//             AvailableQty, PackOpt, Kg, UnitPrice, Currency
//         } = row;

//         db.query(
//             `INSERT INTO registerproducts 
//             (ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency, UserId) 
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency, userId],
//             (err) => {
//                 if (err) console.error(err);
//             }
//         );
//     });

//     res.json({ message: 'Data uploaded successfully' });
// });


app.post('/upload-excel', async (req, res) => {
    const excelData = req.body.excelData;
    const userId = req.session.userId;

    if (!excelData || excelData.length === 0) {
        return res.status(400).json({ message: 'No data received' });
    }

    try {
        await Promise.all(
            excelData.map(row => {
                const { ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency } = row;

                return new Promise((resolve, reject) => {
                    db.query(
                        `INSERT INTO registerproducts 
                         (UserId, ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [userId, ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency],
                        (err) => err ? reject(err) : resolve()
                    );
                });
            })
        );

        res.json({ message: 'Data uploaded successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error uploading data' });
    }
});


/*
app.post('/login', async (req, res) => {
    //  const axios = require('axios');
    const { Username, Password } = req.body;
    console.log(Username, Password);

    console.log("Received Login Attempt:", Username);


    //   Optional: Validate input
    if (!Username || !Password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }


    try {
        const config = {
            method: 'get',
            // url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS?$filter=Username eq \'' + Username + '\' and Password eq \'' + Password + '\'',
            url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS?$filter=Username eq \'' + Username + '\' and Password eq \'' + Password + '\'',
            headers: {
                'Authorization': AuthorizationPrd,
                'x-csrf-token': 'Fetch',
                'Cookie': 'sap-usercontext=sap-client=100'
            }
        };


        const response = await axios.request(config);
        const users = response.data.value;
        console.log("received user is ", users)

        // 🧠 Now that response exists, you can use it
        var jsonObject = {
            Status: res.statusCode,
            Data: users
        };
        if (users.length > 0) {
            req.session.UserName = users[0].Username;
            req.session.Suppliercode = users[0].Suppliercode;
            console.log("Session Suppliercode set to:", req.session.Suppliercode);
            console.log("Session UserName set to:", req.session.UserName);
            res.json({ success: true, message: "Login successful", username: req.session.UserName });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }


    //     if (users.length>0) {
    //     //    req.session.userId = "CTPL";

    //         jsonObject.UserName = users[0].Username;
    //         req.session.UserName=users[0].Username;
    //         console.log( req.session.UserName," req.session.UserName")
    //         res.json({ success: true, ...jsonObject });
    //     } else {
    //         res.json({ success: false, message: "Invalid credentials" });
    //     }

    // } catch (error) {
    //     console.error("Login error:", error.message);
    //     res.status(500).json({ success: false, message: "Server error" });
    // }
});
*/

app.post('/login', async (req, res) => {
    const { Username, Password } = req.body;
    console.log("Received Login Attempt (PAN):", Username);

    if (!Username || !Password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const sql = 'SELECT * FROM onboarding_users WHERE PanNo = ?';
    db.query(sql, [Username], async (err, results) => {
        if (err) {
            console.error("Login database error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length > 0) {
            const matchingUsers = [];
            for (const user of results) {
                const storedPassword = user.UserPassword;
                let isMatch = false;
                if (storedPassword) {
                    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
                        try {
                            isMatch = await bcrypt.compare(Password, storedPassword);
                        } catch (bcryptErr) {
                            console.error("Bcrypt compare error:", bcryptErr);
                            isMatch = false;
                        }
                    } else {
                        isMatch = (Password === storedPassword);
                    }
                }
                if (isMatch) {
                    matchingUsers.push(user);
                }
            }

            if (matchingUsers.length > 0) {
                // If any matching user is pending user ID approval (status 0), block login
                const pendingUser = matchingUsers.find(u => u.ApprovalStatus === 0);
                if (pendingUser) {
                    return res.json({ success: false, message: "Your registration is pending administrator approval." });
                }

                // If any matching user is rejected user ID (status 2), block login
                const rejectedUser = matchingUsers.find(u => u.ApprovalStatus === 2);
                if (rejectedUser) {
                    return res.json({ success: false, message: "Your registration has been rejected by the administrator." });
                }

                // If any matching user is pending profile verification (status 3), block login
                const pendingProfile = matchingUsers.find(u => u.ApprovalStatus === 3);
                if (pendingProfile) {
                    return res.json({ success: false, message: "Your onboarding details are pending final administrator verification." });
                }

                // If any matching user is rejected profile (status 5), block login
                const rejectedProfile = matchingUsers.find(u => u.ApprovalStatus === 5);
                if (rejectedProfile) {
                    return res.json({ success: false, message: "Your onboarding profile has been rejected by the administrator." });
                }

                // If we have a fully approved user (status 4), log them in!
                const fullyApprovedUser = matchingUsers.find(u => u.ApprovalStatus === 4);
                if (fullyApprovedUser) {
                    req.session.userId = fullyApprovedUser.UserId;
                    req.session.UserName = fullyApprovedUser.PanNo;
                    req.session.username = fullyApprovedUser.PanNo;
                    req.session.panNo = fullyApprovedUser.PanNo;
                    req.session.Suppliercode = fullyApprovedUser.SupplierCode ? String(fullyApprovedUser.SupplierCode).padStart(10, '0') : null;
                    req.session.ActualSupplierName = fullyApprovedUser.SupplierName;
                    req.session.ActualSupplierCode = fullyApprovedUser.SupplierCode;
                    req.session.role = 'Supplier';

                    console.log("Session Suppliercode set to:", req.session.Suppliercode);
                    console.log("Session UserName set to:", req.session.UserName);
                    return res.json({ success: true, message: "Login successful", username: req.session.UserName });
                }

                // Revert to original check for status 1 users who haven't completed onboarding yet
                const approvedUser = matchingUsers.find(u => u.ApprovalStatus === 1);
                if (approvedUser) {
                    const statusSql = 'SELECT isComplienceDocumentDone FROM allRegistrationStatus WHERE UserId = ? LIMIT 1';
                    db.query(statusSql, [approvedUser.UserId], (statusErr, statusResults) => {
                        if (statusErr) {
                            console.error("Login status check error:", statusErr);
                            return res.status(500).json({ success: false, message: "Server error" });
                        }

                        if (statusResults.length === 0 || !statusResults[0].isComplienceDocumentDone) {
                            return res.json({
                                success: false,
                                message: "Please complete your onboarding process before logging in. Check your email for the profile completion link."
                            });
                        }

                        // If they completed onboarding but status wasn't updated, allow log in or fallback
                        req.session.userId = approvedUser.UserId;
                        req.session.UserName = approvedUser.PanNo;
                        req.session.username = approvedUser.PanNo;
                        req.session.panNo = approvedUser.PanNo;
                        req.session.Suppliercode = 'CTPL';
                        req.session.role = 'Supplier';

                        console.log("Session Suppliercode set to:", req.session.Suppliercode);
                        console.log("Session UserName set to:", req.session.UserName);
                        return res.json({ success: true, message: "Login successful", username: req.session.UserName });
                    });
                    return;
                }
            }
        }
        res.json({ success: false, message: "Incorrect credentials...!" });
    });
});

app.post('/adminLogin', async (req, res) => {
    const { Username, Password } = req.body;
    console.log("Received Admin Login Attempt:", Username);

    if (!Username || !Password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const sql = 'SELECT * FROM adminusers WHERE UserName = ? LIMIT 1';
    db.query(sql, [Username], async (err, results) => {
        if (err) {
            console.error("Admin Login database error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        if (results.length > 0) {
            const user = results[0];
            const storedPassword = user.Password;

            let isMatch = false;
            if (storedPassword) {
                if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
                    try {
                        isMatch = await bcrypt.compare(Password, storedPassword);
                    } catch (bcryptErr) {
                        console.error("Admin Bcrypt compare error:", bcryptErr);
                        isMatch = false;
                    }
                } else {
                    isMatch = (Password === storedPassword);
                }
            }

            if (isMatch) {
                req.session.userId = user.Id;
                req.session.UserName = user.UserName;
                req.session.username = user.UserName;
                req.session.Suppliercode = user.AdminCode || 'CTPL'; // default admin code
                req.session.role = user.Role || 'Admin';

                console.log("Admin Session AdminCode set to (as Suppliercode):", req.session.Suppliercode);
                console.log("Admin Session UserName set to:", req.session.UserName);
                return res.json({ success: true, message: "Login successful", username: req.session.UserName });
            }
        }
        res.json({ success: false, message: "Incorrect credentials...!" });
    });
});

app.post('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).json({ success: false, error: "Failed to logout" });
            }
            res.clearCookie('connect.sid');
            return res.json({ success: true, message: "Logout successful" });
        });
    } else {
        return res.json({ success: true, message: "No active session" });
    }
});





//const bcrypt = require('bcryptjs');
//const axios = require('axios');

// app.post('/login', async (req, res) => {
//     const { Username, Password } = req.body;
//     console.log("Received Login Attempt:", Username);

//     if (!Username || !Password) {
//         return res.status(400).json({ success: false, message: "Missing credentials" });
//     }

//     try {
//         // Fetch user by Username only (do not filter by password)
//         const config = {
//             method: 'get',
//             url: hostname + "/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS?$filter=Username eq '" + Username + "'",
//             headers: {
//                 'Authorization': AuthorizationPrd,
//                 'x-csrf-token': 'Fetch',
//                 'Cookie': 'sap-usercontext=sap-client=100'
//             }
//         };

//         const response = await axios.request(config);
//         const users = response.data.value;

//         if (users.length === 0) {
//             // No user found with this username
//             return res.json({ success: false, message: "Invalid username or password" });
//         }

//         const user = users[0];
//         const hashedPassword = user.Password;  // get stored hashed password

//         // Compare entered password with stored hash
//         const passwordMatch = await bcrypt.compare(Password, hashedPassword);

//         if (passwordMatch) {
//             // Passwords match, login success
//             req.session.UserName = user.Username;
//             console.log("Session UserName set to:", req.session.UserName);
//             res.json({ success: true, message: "Login successful", username: req.session.UserName });
//         } else {
//             // Passwords don't match
//             res.json({ success: false, message: "Invalid username or password" });
//         }
//     } catch (error) {
//         console.error("Login error:", error.message);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });



// EDITED USER CREATION

app.get('/editedCompanyUserList', async (req, res) => {
    console.log("editedCompanyUserList==========");
    const Suppliercode = req.query.Suppliercode;
    const Designation = req.query.Designation;
    const Firstname = req.query.Firstname;
    const Lastname = req.query.Lastname;
    const Username = req.query.Username;
    const Password = req.query.Password;
    const Emailid = req.query.Emailid;
    const Mobile = req.query.Mobile;
    const Status = req.query.Status;
    const Role = req.query.Role;
    const Company = req.query.Company;
    const Associatedwith = req.query.Associatedwith;

    // below code is working for hash password
    const hashedPassword = await bcrypt.hash(Password, 8);
    console.log("Original Password:", Password);
    console.log("Hashed Password:", hashedPassword);


    console.log("Suppliercode", Suppliercode, "Designation", Designation, "Firstname", Firstname, "Lastname", Lastname, "Username", Username, "Password", Password);
    console.log("hashedPassword===", hashedPassword)
    const axios = require('axios');

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
        headers: {
            'x-csrf-token': 'Fetch',
            'Authorization': AuthorizationPrd,
            //  'Cookie': 'sap-XSRF_YP5_100=HcnEjF7pBcYGbLcBZDHeNQ%3d%3d20250605104928QIaOK1A-h9JQi78qRf7CNwmIdXaFnfejCeXfI0fZldg%3d; sap-usercontext=sap-client=100'
        }
    };

    axios.request(config)
        .then((response) => {
            const csrfToken01 = response.headers['x-csrf-token'];
            const cookie = response.headers['set-cookie'];

            console.log('CSRF Token:', csrfToken01);

            postcall(csrfToken01, cookie);



            //console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });

    function postcall(csrfToken01, cookie) {
        const axios02 = require('axios');
        let data = JSON.stringify({
            "Suppliercode": Suppliercode,
            "Username": Username,
            "Designation": Designation,
            "Role": Role,
            // "Password": Password,
            "Password": hashedPassword,
            "Firstname": Firstname,
            "Lastname": Lastname,
            "Emailid": Emailid,
            "Mobile": Mobile,
            "Status": Status,
            "Company": Company,
            "Associatedwith": Associatedwith,
            "Deleteflg": ""

        });

        console.log("put payload==", data);
        // let data = JSON.stringify({
        //     "to_DeliveryDocumentItem": {
        //         "results": [
        //             {
        //                 "ReferenceSDDocument": PurchaseOrder,
        //                 "ReferenceSDDocumentItem": lineItem,
        //                 "ActualDeliveryQuantity": committedOty
        //             }
        //         ]
        //     }
        // });

        let config = {
            method: 'put',
            maxBodyLength: Infinity,
            url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS(Username=\'' + Username + '\')',
            headers: {
                'x-csrf-token': csrfToken01,
                'Content-Type': 'application/json',
                'Authorization': AuthorizationPrd,
                'Cookie': cookie
            },
            data: data
        };

        console.log("put config==", config);

        axios02.request(config)
            .then((response) => {
                var jsonObject = {};
                jsonObject.Status = response.status;
                jsonObject.ResponseData = response.data;
                console.log("Response Status Code: ", response.status);
                res.json(jsonObject);
                // res.status(201).send({ message: "Posted successfully" });  // ✅ Send success response
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error Status Code: ", error.response.status);
                    res.status(error.response.status).send({ error: "Error posting data" });  // ✅ Send error response
                } else {
                    console.log("Error: ", error.message);
                    res.status(500).send({ error: error.message });  // ✅ Send general error response
                }

            });


    }

});

// DELETED USER CREATION

app.get('/delateCompanyUserList', async (req, res) => {
    console.log("delateCompanyUserList==========");
    const Suppliercode = req.query.Suppliercode;
    const Designation = req.query.Designation;
    const Firstname = req.query.Firstname;
    const Lastname = req.query.Lastname;
    const Username = req.query.Username;
    const Password = req.query.Password;
    const Emailid = req.query.Emailid;
    const Mobile = req.query.Mobile;
    const Status = req.query.Status;
    const Role = req.query.Role;
    const Company = req.query.Company;
    const Associatedwith = req.query.Associatedwith;
    const Deleteflg = req.query.Deleteflg;

    console.log("Suppliercode", Suppliercode, "Designation", Designation, "Firstname", Firstname, "Lastname", Lastname, "Username", Username, "Password", Password, "Deleteflg", Deleteflg);

    const axios = require('axios');

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
        headers: {
            'x-csrf-token': 'Fetch',
            'Authorization': AuthorizationPrd,

        }
    };

    axios.request(config)
        .then((response) => {
            const csrfToken01 = response.headers['x-csrf-token'];
            const cookie = response.headers['set-cookie'];

            console.log('CSRF Token:', csrfToken01);

            postcall(csrfToken01, cookie);



            //console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });

    function postcall(csrfToken01, cookie) {
        const axios02 = require('axios');
        let data = JSON.stringify({
            "Suppliercode": Suppliercode,
            "Username": Username,
            "Designation": Designation,
            "Role": Role,
            "Password": Password,
            "Firstname": Firstname,
            "Lastname": Lastname,
            "Emailid": Emailid,
            "Mobile": Mobile,
            "Status": Status,
            "Company": Company,
            "Associatedwith": Associatedwith,
            "Deleteflg": "X"

        });

        console.log("put payload==", data);
        // let data = JSON.stringify({
        //     "to_DeliveryDocumentItem": {
        //         "results": [
        //             {
        //                 "ReferenceSDDocument": PurchaseOrder,
        //                 "ReferenceSDDocumentItem": lineItem,
        //                 "ActualDeliveryQuantity": committedOty
        //             }
        //         ]
        //     }
        // });

        let config = {
            method: 'put',
            maxBodyLength: Infinity,
            url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS(Username=\'' + Username + '\')',
            headers: {
                'x-csrf-token': csrfToken01,
                'Content-Type': 'application/json',
                'Authorization': AuthorizationPrd,
                'Cookie': cookie
            },
            data: data
        };

        console.log("put config==", config);

        axios02.request(config)
            .then((response) => {
                var jsonObject = {};
                jsonObject.Status = response.status;
                jsonObject.ResponseData = response.data;
                console.log("Response Status Code: ", response.status);
                res.json(jsonObject);
                // res.status(201).send({ message: "Posted successfully" });  // ✅ Send success response
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error Status Code: ", error.response.status);
                    res.status(error.response.status).send({ error: "Error posting data" });  // ✅ Send error response
                } else {
                    console.log("Error: ", error.message);
                    res.status(500).send({ error: error.message });  // ✅ Send general error response
                }

            });


    }

});


// NEW USER CREATION
app.get('/postNewUserInfo', async (req, res) => {
    console.log("postNewUserInfo==========");
    const Suppliercode = req.query.Suppliercode;
    const Designation = req.query.Designation;
    const Firstname = req.query.Firstname;
    const Lastname = req.query.Lastname;
    const Username = req.query.Username;
    const Password = req.query.Password;
    const Emailid = req.query.Emailid;
    const Mobile = req.query.Mobile;
    const Status = req.query.Status;
    const Role = req.query.Role;
    const Company = req.query.Company;
    const Associatedwith = req.query.Associatedwith;

    console.log("Saving user to database company_users:");
    console.log("Suppliercode", Suppliercode);
    console.log("Designation", Designation);
    console.log("Firstname", Firstname);
    console.log("Lastname", Lastname);
    console.log("Username", Username);
    console.log("Password", Password);
    console.log("Emailid", Emailid);
    console.log("Mobile", Mobile);
    console.log("Status", Status);
    console.log("Role", Role);
    console.log("Company", Company);
    console.log("Associatedwith", Associatedwith);

    const insertQuery = `
        INSERT INTO company_users (
            Suppliercode, Designation, Firstname, Lastname, Username, UserPassword, Emailid, Mobile, Status, Role, Company, Associatedwith
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        Suppliercode || null,
        Designation || null,
        Firstname || null,
        Lastname || null,
        Username,
        Password, // plain text password as per requirement
        Emailid || null,
        Mobile || null,
        Status || null,
        Role || null,
        Company || null,
        Associatedwith || null
    ];

    db.query(insertQuery, values, (err, results) => {
        if (err) {
            console.error('Error inserting into company_users:', err);
            return res.status(500).json({ Status: 500, error: 'Database insert error', details: err.message });
        }
        console.log('User registered successfully in company_users table:', results);
        res.status(200).json({ Status: 200, message: 'User created successfully!' });
    });

    /* ORIGINAL SAP ODATA INTEGRATION CODE COMMENTED OUT BELOW
    // const { Buffer } = require('buffer');  // import Buffer
    // const encodedPassword = Buffer.from(Password, 'utf-8').toString('base64');
    // console.log("Encoded Password (Base64):", encodedPassword);

    // Hash the password with bcrypt (saltRounds = 8)

    // below code is working for hash password
    const hashedPassword = await bcrypt.hash(Password, 8);
    console.log("Original Password:", Password);
    console.log("Hashed Password:", hashedPassword);


    console.log("Suppliercode", Suppliercode);
    console.log("Designation", Designation);
    console.log("Firstname", Firstname);
    console.log("Lastname", Lastname);
    console.log("Username", Username);
    console.log("Password", hashedPassword);
    //    console.log("Password", Password);
    console.log("Emailid", Emailid);
    console.log("Mobile", Mobile);
    console.log("Status", Status);
    console.log("Role", Role);
    console.log("Company", Company);
    console.log("Associatedwith", Associatedwith);




    const axios = require('axios');


    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        //   url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV;v=0002/A_InbDeliveryHeader',  // working
        url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
        headers: {
            'x-csrf-token': 'Fetch',
            'Authorization': AuthorizationPrd,
            //  'Cookie': 'sap-XSRF_YP5_100=XgSO6d-FqUacGo_nnhSEkA%3d%3d20250507060829t3rISg-nzlM9OmCKbb-cpwpOIfIOeZO0fLNRMQkfsvM%3d; sap-usercontext=sap-client=100'
        }
    };

    axios.request(config)
        .then((response) => {
            const csrfToken01 = response.headers['x-csrf-token'];
            const cookie = response.headers['set-cookie'];

            console.log('CSRF Token:', csrfToken01);

            postcall(csrfToken01, cookie);



            //console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });


    function postcall(csrfToken01, cookie) {
        const axios02 = require('axios');
        let data = JSON.stringify({
            "Suppliercode": Suppliercode,
            "Username": Username,
            "Designation": Designation,
            "Role": Role,
            "Password": hashedPassword,
            //    "Password": Password,
            "Firstname": Firstname,
            "Lastname": Lastname,
            "Emailid": Emailid,
            "Mobile": Mobile,
            "Status": Status,
            "Company": Company,
            "Associatedwith": Associatedwith,
            "Deleteflg": ""

        });
        // let data = JSON.stringify({
        //     "to_DeliveryDocumentItem": {
        //         "results": [
        //             {
        //                 "ReferenceSDDocument": PurchaseOrder,
        //                 "ReferenceSDDocumentItem": lineItem,
        //                 "ActualDeliveryQuantity": committedOty
        //             }
        //         ]
        //     }
        // });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: hostname + '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
            headers: {
                'x-csrf-token': csrfToken01,
                'Content-Type': 'application/json',
                'Authorization': AuthorizationPrd,
                'Cookie': cookie
            },
            data: data
        };

        axios02.request(config)
            .then((response) => {
                var jsonObject = {};
                jsonObject.Status = response.status;
                jsonObject.ResponseData = response.data;
                console.log("Response Status Code: ", response.status);
                res.json(jsonObject);
                // res.status(201).send({ message: "Posted successfully" });  // ✅ Send success response
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error Status Code: ", error.response.status);
                    res.status(error.response.status).send({ error: "Error posting data" });  // ✅ Send error response
                } else {
                    console.log("Error: ", error.message);
                    res.status(500).send({ error: error.message });  // ✅ Send general error response
                }

            });


    }
    */
});

// MY ORDER
app.get('/orderFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Username from session My Order:", username);
    console.log("Username from Suppliercode My Order:", Suppliercode);

    // const FiscalYear = req.query.FiscalYearyyGlob1;
    const PODateFrom = req.query.PODateFrom;
    const PODateTo = req.query.PODateTo;
    const PO = req.query.PO;
    const Material = req.query.Material;
    const Status = req.query.Status;

    console.log("From:", PODateFrom, "To:", PODateTo, "PO", PO, "Material", Material, "Status", Status);

    // Dynamically build OData filter
    let filterConditions = [];

    // if (PO) {
    //     filterConditions.push(`PO eq '${PO}'`);
    // }
    // if (PODateFrom) {
    //     filterConditions.push(`PODate ge ${PODateFrom}`);
    // }
    // if (PODateTo) {
    //     filterConditions.push(`PODate le ${PODateTo}`);
    // }

    // if (Status) {
    //     filterConditions.push(`Status eq '${Status}'`);
    // }
    // if (Material) {
    //     filterConditions.push(`Material eq '${Material}'`);
    // }


    // let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    if (PO) {
        filterConditions.push('PO eq ' + "'" + PO + "'");
    }

    if (PODateFrom) {
        filterConditions.push('PODate ge ' + "" + PODateFrom);
    }

    if (PODateTo) {
        filterConditions.push('PODate le ' + "" + PODateTo);
    }

    if (Status) {
        filterConditions.push('Status eq ' + "'" + Status + "'");
    }

    if (Material) {
        filterConditions.push('Material eq ' + "'" + Material + "'");
    }


    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';
    const baseUrl = hostname + "/sap/opu/odata4/sap/zmy_order_cds_sb/srvd_a2x/sap/zmy_order_cds_sd/0001/ZMY_ORDER_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    console.log("Request URL:", fullUrl);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        //   url: hostname + '/sap/opu/odata4/sap/zmy_order_cds_sb/srvd_a2x/sap/zmy_order_cds_sd/0001/ZMY_ORDER_CDS?$filter=PO eq \'' + PO + '\' and PODate ge ' + PODateFrom + ' and PODate le ' + PODateTo + '',
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});

// PO ORDER DETAILS
app.get('/poDetailsFilter', async (req, res) => {
    //    console.log("invoiceDetails/:doc/:yea")
    // console.log(req.query)
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Username from Suppliercode My Order Details:", Suppliercode);
    const { podoc } = req.query;
    console.log("podoc", podoc);
    // const doc = req.query.AccountingDocument;
    // const year = req.query.FiscalYear;
    //y  console.log("app",doc,year);
    console.log("Username from session:", username);
    if (!podoc) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }


    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        //    url: url,
        //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$filter=AccountingDocument eq \''+doc+'\' and FiscalYear eq \''+year+'\' &$expand=_item($filter=contains(Material,\'box\'))',
        // url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zpurch_ord_dtls_cds_sb/srvd_a2x/sap/zpurch_ord_dtls_cds_sd/0001/ZPURCH_ORD_DTLS_CDS?$filter=PurchaseOrder eq \'' + podoc + '\'',    // working
        url: hostname + '/sap/opu/odata4/sap/zpurch_ord_dtls_cds_sb/srvd_a2x/sap/zpurch_ord_dtls_cds_sd/0001/ZPURCH_ORD_DTLS_CDS?$filter=PurchaseOrder eq \'' + podoc + '\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("poDetails", config);

    try {
        const response = await axios.request(config);
        const poData = response.data.value[0];

        if (!poData) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: poData });  // in this i will get the page in response
        res.json(poData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});

// MY INVOICE
app.get('/myInvoiceFilter', async (req, res) => {
    console.log("myInvoice api calling");

    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Session from Suppliercode My Invoice:", Suppliercode);

    const FiscalYear = req.query.FiscalYearyyGlob1 || req.query.year || req.query.FiscalYear;
    const InvoiceDateFrom = req.query.InvoiceDateFrom;
    const InvoiceDateTo = req.query.InvoiceDateTo;
    const PurchasingDocument = req.query.PurchasingDocument || req.query.poNumber || req.query.po;
    const Materialtype = req.query.Material;
    const invoiceStatus = req.query.InvStatus || req.query.Status || req.query.status;
    const AccountingDocument = req.query.AccountingDocument || req.query.doc || req.query.docNum;

    console.log("Username from session:", username);
    console.log("FiscalYear:", FiscalYear, "From:", InvoiceDateFrom, "To:", InvoiceDateTo, "PurchasingDocument:", PurchasingDocument, "Material:", Materialtype, "invoiceStatus:", invoiceStatus, "AccountingDocument:", AccountingDocument);

    // Dynamically build OData filter
    let filterConditions = [];

    if (PurchasingDocument) {
        filterConditions.push(`PurchasingDocument eq '${PurchasingDocument}'`);
    }
    if (AccountingDocument) {
        filterConditions.push(`AccountingDocument eq '${AccountingDocument}'`);
    }
    if (InvoiceDateFrom) {
        filterConditions.push(`InvoiceDate ge ${InvoiceDateFrom}`);
    }
    if (InvoiceDateTo) {
        filterConditions.push(`InvoiceDate le ${InvoiceDateTo}`);
    }
    if (FiscalYear) {
        filterConditions.push(`FiscalYear eq '${FiscalYear}'`);
    }
    if (invoiceStatus) {
        filterConditions.push(`InvStatus eq '${invoiceStatus.toUpperCase()}'`);
    }

    let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';
    // const expand = "&$expand=_item($filter=contains(Material,'box'))";
    let expand = '';
    // if (Materialtype) {
    //     expand = `&$expand=_item($filter=contains(Material,'${Materialtype}'))`;
    // }
    if (Materialtype) {
        expand = `&$expand=_item($filter=contains(Material,'${Materialtype}'))`;
    }
    const baseUrl = hostname + "/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS";



    // if (!req.session.UserName) {
    //     return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    // }
    // console.log(req.session)
    // const axiosTest = require('axios');

    // const UserName = req.session.UserName; // optional: use in filter
    // console.log("UserName", UserName);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: `https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinv_sb/srvd_a2x/sap/zmyinv_sd/0001/ZMYINVOICECDS?$filter=PurchasingDocument eq '${PurchasingDocument}' and InvoiceDate  eq '${InvoiceDate}' and FiscalYear eq '${FiscalYear}' and PurchasingDocument eq '${PurchasingDocument}'`,
        //  url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinv_sb/srvd_a2x/sap/zmyinv_sd/0001/ZMYINVOICECDS',
        //  url : 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$expand=_item&$filter=FiscalYear eq \'' + FiscalYear + '\' and InvoiceDate ge \''+ InvoiceDateFrom +'\' and InvoiceDate le \''+ InvoiceDateTo +'\' ',

        //   url: `https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$filter=PurchasingDocument eq '${PurchasingDocument}' and InvoiceDate ge ${InvoiceDateFrom} and InvoiceDate le ${InvoiceDateTo} and FiscalYear eq '${FiscalYear}'&$expand=_item($filter=contains(Material,'box'))`,

        //  url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$filter=PurchasingDocument eq \''+PurchasingDocument+'\' and InvoiceDate ge \''+InvoiceDateFrom+'\' and InvoiceDate le \''+InvoiceDateTo+'\' and FiscalYear eq \''+FiscalYear+'\' &$expand=_item($filter=contains(Material,\'box\'))', 
        //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$filter=PurchasingDocument eq \'' + PurchasingDocument + '\' and InvoiceDate ge ' + InvoiceDateFrom + ' and InvoiceDate le ' + InvoiceDateTo + ' and FiscalYear eq \'' + FiscalYear + '\' &$expand=_item($filter=contains(Material,\''+ Material +'\'))',
        url: `${baseUrl}?${filterQuery}${expand}`,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
            //  'Cookie': 'sap-XSRF_YP5_100=wC1CLxRqoqy3mHfPfVwhmA%3d%3d20250410103705tB_4tzk409Lp26FbmP7_jgDFkDXJvAZ2xsesONKVhLY%3d; sap-usercontext=sap-client=100'
        }


    };
    console.log("url", config);

    try {
        const response = await axios.request(config);
        //    console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});

// INVOICE DETAILS

//app.get('/invoiceDetailsFilter/:doc/:year', async (req, res) => {
app.get('/invoiceDetailsFilter', async (req, res) => {
    //    console.log("invoiceDetails/:doc/:yea")
    // console.log(req.query)
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("SupplierCode from Suppliercode My Invoice Details:", Suppliercode);
    const accountingdoc = req.query.AccountingDocument;
    const fiscalYear = req.query.FiscalYear;
    console.log("doc", accountingdoc, "fiscalYear", fiscalYear);
    // const doc = req.query.AccountingDocument;
    // const year = req.query.FiscalYear;
    //y  console.log("app",doc,year);
    console.log("Username from session:", username);
    // if (!doc || !year) {
    //     return res.status(400).json({ error: 'Missing required parameters' });
    // }

    let filterConditions = [];
    if (accountingdoc) {
        filterConditions.push(`AccountingDocument eq '${accountingdoc}'`);
    }
    if (fiscalYear && fiscalYear !== 'undefined' && fiscalYear !== 'null' && fiscalYear !== '') {
        filterConditions.push(`FiscalYear eq '${fiscalYear}'`);
    }
    let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: hostname + '/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$expand=_item' + (filterQuery ? '&' + filterQuery : ''),
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("invoiceDetails", config);

    try {
        const response = await axios.request(config);
        const invoiceData = response.data.value[0];

        if (!invoiceData) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: invoiceData });  // in this i will get the page in response
        res.json(invoiceData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});

// MY INVOICE PO DETAILS

app.get('/myInvoicepoDetailsPage', async (req, res) => {
    //    console.log("invoiceDetails/:doc/:yea")
    // console.log(req.query)
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("SupplierCode from Suppliercode My Invoice PO Details:", Suppliercode);
    const { podoc } = req.query;
    console.log("podoc", podoc);
    // const doc = req.query.AccountingDocument;
    // const year = req.query.FiscalYear;
    //y  console.log("app",doc,year);
    console.log("Username from session:", username);
    if (!podoc) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }


    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        //    url: url,
        //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmyinvoice_head_cds_sb/srvd_a2x/sap/zmyinvoice_head_cds_sd/0001/ZMYINVOICE_HEAD_CDS?$filter=AccountingDocument eq \''+doc+'\' and FiscalYear eq \''+year+'\' &$expand=_item($filter=contains(Material,\'box\'))',
        //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zpurch_ord_dtls_cds_sb/srvd_a2x/sap/zpurch_ord_dtls_cds_sd/0001/ZPURCH_ORD_DTLS_CDS?$filter=PurchaseOrder eq \'' + podoc + '\'',   // working
        url: hostname + '/sap/opu/odata4/sap/zpurch_ord_dtls_cds_sb/srvd_a2x/sap/zpurch_ord_dtls_cds_sd/0001/ZPURCH_ORD_DTLS_CDS?$filter=PurchaseOrder eq \'' + podoc + '\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("poDetails", config);

    try {
        const response = await axios.request(config);
        const poData = response.data.value[0];

        if (!poData) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: poData });  // in this i will get the page in response
        res.json(poData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});







// MY DELIVERIES
app.get('/deliveriesFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session My Deliveries:", Suppliercode);
    console.log("Username from session My deliveries:", username);


    const goodsDelFrom = req.query.goodsDelFrom;
    const goodDelTo = req.query.goodDelTo;
    const PODateFrom = req.query.PODateFrom;
    const PODateTo = req.query.PODateTo;
    const PO = req.query.PO;
    const Material = req.query.Material;

    console.log("deliveriesFilter====:", PODateFrom, "To:", PODateTo, "PO", PO, "Material", Material, "goodsDelFrom", goodsDelFrom, "goodDelTo", goodDelTo);

    // Build dynamic filter
    let filterConditions = [];

    if (goodsDelFrom) {
        filterConditions.push('GrDate ge ' + "" + goodsDelFrom);
    }

    if (goodDelTo) {
        filterConditions.push('GrDate le ' + "" + goodDelTo);
    }

    if (PODateFrom) {
        filterConditions.push('PODate ge ' + "" + PODateFrom);
    }

    if (PODateTo) {
        filterConditions.push('PODate le ' + "" + PODateTo);
    }

    if (PO) {
        filterConditions.push('PO eq ' + "'" + PO + "'");
    }

    if (Material) {
        filterConditions.push('Material eq ' + "'" + Material + "'");
    }



    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zmy_delivery_cds_sb/srvd_a2x/sap/zmy_delivery_cds_sd/0001/ZMY_DELIVERY_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: hostname + '/sap/opu/odata4/sap/zmy_delivery_cds_sb/srvd_a2x/sap/zmy_delivery_cds_sd/0001/ZMY_DELIVERY_CDS?$filter=PO eq \'' + PO + '\' and GrDate ge ' + goodsDelFrom + ' and GrDate le ' + goodDelTo + ' and PODate ge ' + PODateFrom + ' and PODate le ' + PODateTo + '',
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});

// MY QUOTATIONS


// INCOMING RFQS FILTER
app.get('/incomingRFQSFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session Incoming RFQs:", Suppliercode);

    const RFQNumber = req.query.RFQNumber;
    const rfqQDateFrom = req.query.QDateFrom;
    const rfqQDateTo = req.query.QDateTo;
    const Status = req.query.Status;
    const MaterialTypes = req.query.Material;

    console.log("Incoming RFQ Query Params:", { RFQNumber, rfqQDateFrom, rfqQDateTo, Status, MaterialTypes });

    // Build dynamic filter
    let filterConditions = [];

    if (RFQNumber) {
        filterConditions.push("RFQNumber eq '" + RFQNumber + "'");
    }

    if (rfqQDateFrom) {
        filterConditions.push("QDate ge " + rfqQDateFrom);
    }

    if (rfqQDateTo) {
        filterConditions.push("QDate le " + rfqQDateTo);
    }

    if (Status) {
        filterConditions.push("Status eq '" + Status + "'");
    }

    if (MaterialTypes) {
        filterConditions.push("Material eq '" + MaterialTypes + "'");
    }

    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zmy_quotation_cds_sb/srvd_a2x/sap/zmy_quotation_cds_sd/0001/ZMY_QUOTATION_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    console.log("Requesting Incoming RFQs:", config);

    try {
        const response = await axios.request(config);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching incoming RFQ data:", error.message);
        res.status(500).json({ error: 'Failed to fetch incoming RFQ data' });
    }
});


// MY INCOMING RFQS

app.get('/incomingRfqs', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    const role = req.session.role;
    console.log("Suppliercode from session My Incoming:", Suppliercode);
    console.log("Username from session:", username);

    const RFQNumber = req.query.RFQNumber;

    const rfqQDateFrom = req.query.QDateFrom;
    const rfqQDateTo = req.query.QDateTo;
    const Status = req.query.Status;
    const MaterialTypes = req.query.Material;

    console.log("Query Params:======", { RFQNumber, rfqQDateFrom, rfqQDateTo, Status, MaterialTypes });

    // Build dynamic filter
    let filterConditions = [];
    
    if (role === 'Supplier' && Suppliercode) {
        filterConditions.push("Supplier eq '" + Suppliercode + "'");
    }

    //  if (RFQNumber) {
    //     filterConditions.push(`RFQNumber eq '${RFQNumber}'`);
    // }

    // if (rfqQDateFrom) {
    //     filterConditions.push(`QDate ge ${rfqQDateFrom}`);
    // }

    // if (rfqQDateTo) {
    //     filterConditions.push(`QDate le ${rfqQDateTo}`);

    // }

    // if (Status) {
    //     filterConditions.push(`Status eq '${Status}'`);
    // }

    // if (MaterialTypes) {
    //     filterConditions.push(`Material eq '${MaterialTypes}'`);
    // }



    if (RFQNumber) {
        filterConditions.push('RFQNumber eq ' + "'" + RFQNumber + "'");
    }



    if (rfqQDateFrom) {
        filterConditions.push('QDate ge ' + "" + rfqQDateFrom);
    }

    if (rfqQDateTo) {
        filterConditions.push('QDate le ' + "" + rfqQDateTo);
    }

    if (Status) {
        filterConditions.push('Status eq ' + "'" + Status + "'");
    }

    if (MaterialTypes) {
        filterConditions.push('Material eq ' + "'" + MaterialTypes + "'");
    }

    //   let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zsb_inc_rfq_cds/srvd_a2x/sap/zsd_inc_rfq_cds/0001/ZINC_RFQ_CDS";
    const fullUrl = filterQueryOrder ? `${baseUrl}?${filterQueryOrder}` : baseUrl;


    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: fullUrl,

        //  url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmy_quotation_cds_sb/srvd_a2x/sap/zmy_quotation_cds_sd/0001/ZMY_QUOTATION_CDS?$filter=RFQNumber eq \'7000000002\' and QDate ge 2023-04-08 and QDate le 2023-04-08 and Material eq \'CABLE\' and Status eq \'02\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    console.log("Requesting:", config);

    try {
        const response = await axios.request(config);
        // console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});


// MY QUOTATIONS

// Replace this with your actual hostname


app.get('/myQuotationsFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session My Quotations:", Suppliercode);
    console.log("Username from session:", username);

    const RFQNumber = req.query.RFQNumber;

    const rfqQDateFrom = req.query.QDateFrom;
    const rfqQDateTo = req.query.QDateTo;
    const Status = req.query.Status;
    const MaterialTypes = req.query.Material;

    console.log("Query Params:======", { RFQNumber, rfqQDateFrom, rfqQDateTo, Status, MaterialTypes });

    // Build dynamic filter
    let filterConditions = [];

    //  if (RFQNumber) {
    //     filterConditions.push(`RFQNumber eq '${RFQNumber}'`);
    // }

    // if (rfqQDateFrom) {
    //     filterConditions.push(`QDate ge ${rfqQDateFrom}`);
    // }

    // if (rfqQDateTo) {
    //     filterConditions.push(`QDate le ${rfqQDateTo}`);

    // }

    // if (Status) {
    //     filterConditions.push(`Status eq '${Status}'`);
    // }

    // if (MaterialTypes) {
    //     filterConditions.push(`Material eq '${MaterialTypes}'`);
    // }



    if (RFQNumber) {
        filterConditions.push('RFQNumber eq ' + "'" + RFQNumber + "'");
    }



    if (rfqQDateFrom) {
        filterConditions.push('QDate ge ' + "" + rfqQDateFrom);
    }

    if (rfqQDateTo) {
        filterConditions.push('QDate le ' + "" + rfqQDateTo);
    }

    if (Status) {
        filterConditions.push('Status eq ' + "'" + Status + "'");
    }

    if (MaterialTypes) {
        filterConditions.push('Material eq ' + "'" + MaterialTypes + "'");
    }

    //   let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zmy_quotation_cds_sb/srvd_a2x/sap/zmy_quotation_cds_sd/0001/ZMY_QUOTATION_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;


    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: fullUrl,

        //  url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zmy_quotation_cds_sb/srvd_a2x/sap/zmy_quotation_cds_sd/0001/ZMY_QUOTATION_CDS?$filter=RFQNumber eq \'7000000002\' and QDate ge 2023-04-08 and QDate le 2023-04-08 and Material eq \'CABLE\' and Status eq \'02\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    console.log("Requesting:", config);

    try {
        const response = await axios.request(config);
        // console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});



// PURCHASE ORDER STATUS OF MY REPORT
app.get('/PurchaseOrderStatusFilter', async (req, res) => {


    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session PO STATUS OF MY REPORT:", Suppliercode);

    const Material = req.query.Material;
    const PurchaseOrder = req.query.PurchaseOrder;

    console.log("Username from session:", username);
    console.log("Material", Material, "PurchaseOrder", PurchaseOrder);

    // Build dynamic filter
    let filterConditions = [];
    if (Material) {
        filterConditions.push('Material eq ' + "'" + Material + "'");
    }

    if (PurchaseOrder) {
        filterConditions.push('PurchaseOrder eq ' + "'" + PurchaseOrder + "'");
    }

    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zpo_details_cds_sb/srvd_a2x/sap/zpo_details_cds_sd/0001/ZPO_DETAILS_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,



        // url: hostname + '/sap/opu/odata4/sap/zpo_details_cds_sb/srvd_a2x/sap/zpo_details_cds_sd/0001/ZPO_DETAILS_CDS',
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
            //  'Cookie': 'sap-XSRF_YP5_100=wC1CLxRqoqy3mHfPfVwhmA%3d%3d20250410103705tB_4tzk409Lp26FbmP7_jgDFkDXJvAZ2xsesONKVhLY%3d; sap-usercontext=sap-client=100'
        }


    };
    console.log("url", config);

    try {
        const response = await axios.request(config);
        console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});

// MY CONTRACTS

app.get('/myContractsFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session My Contracts:", Suppliercode);
    console.log("Username from session My deliveries:", username);

    // const FiscalYear = req.query.FiscalYearyyGlob1;
    const Catagory = req.query.Catagory;
    const Type = req.query.Type;
    const Status = req.query.Status;
    const startDate = req.query.StartDate;
    const endDate = req.query.EndDate;

    console.log("Catagory", Catagory, "Type", Type, "Status", Status, "startDate:", startDate, "endDate:", endDate);

    // Build dynamic filter
    let filterConditions = [];
    if (Catagory) {
        filterConditions.push('Catagory eq ' + "'" + Catagory + "'");
    }
    if (Type) {
        filterConditions.push('Type eq ' + "'" + Type + "'");
    }
    if (Status) {
        filterConditions.push('Status eq ' + "'" + Status + "'");
    }
    if (startDate) {
        filterConditions.push('StartDate ge ' + "" + startDate);
    }
    if (endDate) {
        filterConditions.push('EndDate le ' + "" + endDate);
    }




    //   let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zmy_contract_cds_sb/srvd_a2x/sap/zmy_contract_cds_sd/0001/ZMY_CONTRACT_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        //  url: hostname + '/sap/opu/odata4/sap/zmy_delivery_cds_sb/srvd_a2x/sap/zmy_delivery_cds_sd/0001/ZMY_DELIVERY_CDS?$filter=PO eq \'' + PO + '\' and GrDate ge ' + goodsDelFrom + ' and GrDate le ' + goodDelTo + ' and PODate ge ' + PODateFrom + ' and PODate le ' + PODateTo + '',
        //   url: hostname + '/sap/opu/odata4/sap/zmy_contract_cds_sb/srvd_a2x/sap/zmy_contract_cds_sd/0001/ZMY_CONTRACT_CDS?$filter=StartDate eq ' + startDate + ' and EndDate eq ' + endDate + '',
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});

// PURCHASE ORDER HISTORY OF MY REPORT

app.get('/purchaseOrderHis', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session Deliveries OF MY REPort:", Suppliercode);
    console.log("Username from session:", username);

    const poNumber = req.query.poNumber;

    console.log("purchaseOrderHis====", poNumber);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: hostname + '/sap/bc/http/sap/ZPUCH_ORD_HISTORY?sap-client=100$filter=poNumber eq \'' + poNumber + '\'',

        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }


    };
    console.log("url", config);

    try {
        const response = await axios.request(config);
        //    console.log("my order data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching my order data:", error.message);
        res.status(500).json({ error: 'Failed to fetch my Purchase Order History data' });
    }

});


// DELIVERIES OF MY REPORT

app.get('/deliveryReportFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session Deliveries OF MY REPort:", Suppliercode);
    console.log("Username from session:", username);

    const DeliveryDateFrom = req.query.DeliveryDateFrom;
    const DeliveryDateTo = req.query.DeliveryDateTo;
    //  const poDateFrom = req.query.poDateFrom;   //missing in api
    // const poDateTo = req.query.poDateTo;           // missing in api
    const PurchaseOrder = req.query.PurchaseOrder;
    const DeliveryNote = req.query.DeliveryNote;
    const Status = req.query.OrdStatus;

    console.log("deliveryReport====", DeliveryDateFrom, DeliveryDateTo, PurchaseOrder, DeliveryNote, Status);


    let filterConditions = [];


    if (DeliveryDateFrom) {
        filterConditions.push('DeliveryDate ge ' + DeliveryDateFrom);
    }

    if (DeliveryDateTo) {
        filterConditions.push('DeliveryDate le ' + DeliveryDateTo);
    }

    if (PurchaseOrder) {
        filterConditions.push('PurchaseOrder eq ' + "'" + PurchaseOrder + "'");
    }

    if (DeliveryNote) {
        filterConditions.push('DeliveryNote eq ' + "'" + DeliveryNote + "'");
    }

    if (Status) {
        filterConditions.push('OrdStatus eq ' + "'" + Status + "'");
    }


    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zreport_deliveries_cds_sb/srvd_a2x/sap/zreport_deliveries_cds_sd/0001/ZREPORT_DELIVERIES_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: fullUrl,
        //   url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zreport_deliveries_cds_sb/srvd_a2x/sap/zreport_deliveries_cds_sd/0001/ZREPORT_DELIVERIES_CDS?$filter=DeliveryDate ge 2022-05-15 and DeliveryDate le 2023-02-27 and OrdStatus eq \'Delivered\' and Material eq \'EGLX_RO_012\' and PurchaseOrder eq \'4500000005\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }


    };
    console.log("url", config);

    try {
        const response = await axios.request(config);
        //    console.log("my order data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching my order data:", error.message);
        res.status(500).json({ error: 'Failed to fetch my order data' });
    }

});

// DELIVERY DETAILS OF MY REPORT

app.get('/deliveryDetailsFilter', async (req, res) => {

    // const axios = require('axios');
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session Deliveries Details of MY report:", Suppliercode);
    console.log("username", username);
    const deliNotedoc = req.query;
    const deliPoNumberdoc = req.query;
    console.log("deliNotedoc", deliNotedoc, deliPoNumberdoc);


    console.log("Query Parameters:", req.query);

    // if (!deliNotedoc) {
    //     return res.status(400).json({ error: 'Missing required parameters' });
    // }

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: hostname + '/sap/opu/odata4/sap/zdelivery_details_cds_sb/srvd_a2x/sap/zdelivery_details_cds_sd/0001/ZDELIVERY_DETAILS_CDS',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };
    console.log("poDetails", config);

    try {
        const response = await axios.request(config);
        const poData = response.data.value;

        if (!poData) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: poData });  // in this i will get the page in response
        res.json(poData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});



// INVOICE AND PAYMENT OF MY REPORT

app.get('/invoicePaymentsReportFilter', async (req, res) => {
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session My Deliveries:", Suppliercode);
    console.log("Username from session Invoice And Payment:", username);

    // const FiscalYear = req.query.FiscalYearyyGlob1;
    const docType = req.query.DocumentType;
    const vardocDateFrom = req.query.DocumentDateFrom;
    const vardocDateTo = req.query.DocumentDateTo;
    const AccountingDocument = req.query.AccountingDocument;
    // const paymentDateFrom = req.query.paymentDateFrom;
    // const paymentDateTo = req.query.paymentDateTo;

    console.log("invoicePaymentsReportFilter====", docType, vardocDateFrom, vardocDateTo, AccountingDocument);


    // Build dynamic filter conditions
    let filterConditions = [];

    // if (docType) {
    //     filterConditions.push(`DocumentType eq '${docType}'`);
    // }

    // if (vardocDateFrom) {
    //     filterConditions.push(`DocumentDate ge ${vardocDateFrom}`);
    // }

    // if (vardocDateTo) {
    //     filterConditions.push(`DocumentDate le ${vardocDateTo}`);
    // }

    // if (AccountingDocument) {
    //     filterConditions.push(`AccountingDocument eq '${AccountingDocument}'`);
    // }

    // let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    if (docType) {
        filterConditions.push('DocumentType eq ' + "'" + docType + "'");
    }

    if (vardocDateFrom) {
        filterConditions.push('DocumentDate ge ' + "" + vardocDateFrom);
    }

    if (vardocDateTo) {
        filterConditions.push('DocumentDate le ' + "" + vardocDateTo);
    }

    if (AccountingDocument) {
        filterConditions.push('AccountingDocument eq ' + "'" + AccountingDocument + "'");
    }

    // if (MaterialTypes) {
    //     filterConditions.push('Material eq ' + "'" + MaterialTypes + "'");
    // }

    //   let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zinv_and_pay_sb/srvd_a2x/sap/zinv_and_pay_sd/0001/ZINV_AND_PAY_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    //  const fullUrl = `https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zinv_and_pay_sb/srvd_a2x/sap/zinv_and_pay_sd/0001/ZINV_AND_PAY_CDS?${filterQuery}`;
    //const fullUrl = `${hostname}/sap/opu/odata4/sap/zinv_and_pay_sb/srvd_a2x/sap/zinv_and_pay_sd/0001/ZINV_AND_PAY_CDS?${filterQuery}`;



    let config = {
        method: 'get',
        maxBodyLength: Infinity,

        //   url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zinv_and_pay_sb/srvd_a2x/sap/zinv_and_pay_sd/0001/ZINV_AND_PAY_CDS?$filter=AccountingDocument eq \''+AccountingDocument+'\' DocumentDate ge '+vardocDateFrom+' and DocumentDate le '+vardocDateTo+' and DocumentType eq \''+docType+'\'',
        //url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zinv_and_pay_sb/srvd_a2x/sap/zinv_and_pay_sd/0001/ZINV_AND_PAY_CDS?$filter=AccountingDocument eq \'' + AccountingDocument + '\' and DocumentDate ge ' + vardocDateFrom + ' and DocumentDate le ' + vardocDateTo + ' and DocumentType eq \'' + docType + '\'',
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        // console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }


});

// QUALITY PERFORMANCE OF MY REPORT

app.get('/qualityPerformanceFilter', async (req, res) => {

    const username = req.session.UserName;
    console.log("Username from session My deliveries:", username);
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session Quality performance:", Suppliercode);


    const varpoDateFrom = req.query.poDateFrom;
    const varpoDateTo = req.query.poDateTo;
    const PurchaseOrder = req.query.PurchaseOrder;
    const Material = req.query.Material;
    //const Status = req.query.Status;

    console.log("Quality performance Filter====:", varpoDateFrom, "To:", varpoDateTo, "PurchaseOrder", PurchaseOrder, "Material", Material);

    // Build dynamic filter
    let filterConditions = [];

    if (varpoDateFrom) {
        filterConditions.push('InspectionLotEndDate ge ' + "" + varpoDateFrom);
    }

    if (varpoDateTo) {
        filterConditions.push('InspectionLotEndDate le ' + "" + varpoDateTo);
    }

    if (PurchaseOrder) {
        filterConditions.push('PurchaseOrder eq ' + "'" + PurchaseOrder + "'");
    }

    if (Material) {
        filterConditions.push('Material eq ' + "'" + Material + "'");
    }


    let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    const baseUrl = hostname + "/sap/opu/odata4/sap/zquality_performace_cds_sb/srvd_a2x/sap/zquality_performace_cds_sd/0001/ZQUALITY_PERFORMACE_CDS";
    const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: hostname + '/sap/opu/odata4/sap/zmy_delivery_cds_sb/srvd_a2x/sap/zmy_delivery_cds_sd/0001/ZMY_DELIVERY_CDS?$filter=PO eq \'' + PO + '\' and GrDate ge ' + goodsDelFrom + ' and GrDate le ' + goodDelTo + ' and PODate ge ' + PODateFrom + ' and PODate le ' + PODateTo + '',
        url: fullUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});


// MY COMPANY USERS

app.get('/companyUserList', async (req, res) => {

    const username = req.session.UserName;
    console.log("Username from session My deliveries:", username);
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session My Company USer:", Suppliercode);

    if (req.session.role === 'Admin') {
        const sql = 'SELECT * FROM adminusers WHERE IsDeleted IS NULL OR IsDeleted = 0';
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Error fetching admin users:", err);
                return res.status(500).json({ error: 'Failed to fetch admin users' });
            }
            const mappedUsers = results.map(u => ({
                Username: u.UserName,
                Firstname: u.FirstName,
                Lastname: u.LastName,
                Emailid: u.EmailId,
                Mobile: u.Mobile,
                Designation: u.Designation,
                Role: u.Role,
                Status: u.Status,
                AdminCode: u.AdminCode,
                Company: u.Company,
                AssociatedWith: u.AssociatedWith
            }));
            return res.json({ value: mappedUsers });
        });
        return;
    }

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: hostname + '/sap/opu/odata4/sap/zmy_delivery_cds_sb/srvd_a2x/sap/zmy_delivery_cds_sd/0001/ZMY_DELIVERY_CDS?$filter=PO eq \'' + PO + '\' and GrDate ge ' + goodsDelFrom + ' and GrDate le ' + goodDelTo + ' and PODate ge ' + PODateFrom + ' and PODate le ' + PODateTo + '',
        //     url: hostname + "/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS",
        url: hostname + "/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS?$filter=Deleteflg ne 'X' and Username ne ''&$orderby=Suppliercode",
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});

// MY COMPANY INFO 

app.get('/myCompanyInfoList', async (req, res) => {

    const username = req.session.UserName;
    console.log("Username from session :", username);
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session My company Info:", Suppliercode);


    // const varpoDateFrom = req.query.poDateFrom;
    // const varpoDateTo = req.query.poDateTo;
    // const PurchaseOrder = req.query.PurchaseOrder;
    // const Material = req.query.Material;
    //const Status = req.query.Status;

    //  console.log("Quality performance Filter====:", varpoDateFrom, "To:", varpoDateTo, "PurchaseOrder", PurchaseOrder, "Material", Material);

    // Build dynamic filter
    // let filterConditions = [];

    // if (varpoDateFrom) {
    //     filterConditions.push('InspectionLotEndDate ge ' + "" + varpoDateFrom);
    // }

    // if (varpoDateTo) {
    //     filterConditions.push('InspectionLotEndDate le ' + "" + varpoDateTo);
    // }

    // if (PurchaseOrder) {
    //     filterConditions.push('PurchaseOrder eq ' + "'" + PurchaseOrder + "'");
    // }

    // if (Material) {
    //     filterConditions.push('Material eq ' + "'" + Material + "'");
    // }


    // let filterQueryOrder = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';

    // const baseUrl = hostname + "/sap/opu/odata4/sap/zquality_performace_cds_sb/srvd_a2x/sap/zquality_performace_cds_sd/0001/ZQUALITY_PERFORMACE_CDS";
    // const fullUrl = `${baseUrl}?${filterQueryOrder}`;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: hostname + '/sap/opu/odata4/sap/zmy_delivery_cds_sb/srvd_a2x/sap/zmy_delivery_cds_sd/0001/ZMY_DELIVERY_CDS?$filter=PO eq \'' + PO + '\' and GrDate ge ' + goodsDelFrom + ' and GrDate le ' + goodDelTo + ' and PODate ge ' + PODateFrom + ' and PODate le ' + PODateTo + '',
        url: hostname + "/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS",
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("url", config);

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});

//ASN

app.get('/poNumberASN', async (req, res) => {
    // console.log("myInvoice api calling");

    const username = req.session.UserName;
    console.log("Username from session My deliveries:", username);
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session post ASN:", Suppliercode);

    const poOrderNumber = req.query.PurchaseOrder;


    console.log("poOrderNumber:", poOrderNumber);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/api_purchaseorder_2/srvd_a2x/sap/purchaseorder/0001/PurchaseOrderItem?$filter=PurchaseOrder eq \'' + poOrderNumber + '\'',   // working
        url: hostname + '/sap/opu/odata4/sap/api_purchaseorder_2/srvd_a2x/sap/purchaseorder/0001/PurchaseOrderItem?$filter=PurchaseOrder eq \'' + poOrderNumber + '\'',
        headers: {
            'Authorization': AuthorizationPrd,
            //'Cookie': 'sap-XSRF_YP5_100=XgSO6d-FqUacGo_nnhSEkA%3d%3d20250507060829t3rISg-nzlM9OmCKbb-cpwpOIfIOeZO0fLNRMQkfsvM%3d; sap-usercontext=sap-client=100'
        }
    };

    //   axios.request(config)
    //   .then((response) => {
    //     console.log(JSON.stringify(response.data.value));
    //     res.json(JSON.stringify(response.data.value));
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });

    console.log("url", config);

    try {
        const response = await axios.request(config);
        // console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }


});

// VIEW ASN FROM MY ORDER PAGE

app.get('/viewAsnDetails', async (req, res) => {
    //    console.log("invoiceDetails/:doc/:yea")
    // console.log(req.query)
    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session View asn my Order:", Suppliercode);
    const viewAsnpodoc = req.query.PurchaseOrder;
    console.log("viewAsnpodoc", viewAsnpodoc);
    // const doc = req.query.AccountingDocument;
    // const year = req.query.FiscalYear;
    //y  console.log("app",doc,year);
    console.log("Username from session:", username);
    if (!viewAsnpodoc) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }


    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        // url: hostname+ '/sap/opu/odata4/sap/zasn_details_cds_sb/srvd_a2x/sap/zasn_details_cds_sd/0001/ZASN_DETAILS_CDS?$filter=PurchaseOrder eq \''+ viewAsnpodoc +'\'',
        //   url: "https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zasn_details_cds_sb/srvd_a2x/sap/zasn_details_cds_sd/0001/ZASN_DETAILS_CDS?$filter=PurchaseOrder eq '5500000046' ",  // working
        url: hostname + '/sap/opu/odata4/sap/zasn_details_cds_sb/srvd_a2x/sap/zasn_details_cds_sd/0001/ZASN_DETAILS_CDS?$filter=PurchaseOrder eq \'' + viewAsnpodoc + '\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };



    console.log("viewAsnpodoc", config);

    try {
        const response = await axios.request(config);
        const poData = response.data.value;
        console.log("response", poData);

        if (!poData) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: poData });  // in this i will get the page in response
        res.json(poData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }
});

app.get('/postInbondDelivery', async (req, res) => {
    console.log("postInbondDelivery==========");
    const PurchaseOrder = req.query.PurchaseOrder;
    const lineItem = req.query.lineItem;
    const committedOty = req.query.committedOty;


    console.log("PurchaseOrder" + PurchaseOrder);
    console.log("lineItem" + lineItem);
    console.log("committedOty" + committedOty);



    const axios = require('axios');


    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        //   url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV;v=0002/A_InbDeliveryHeader',  // working
        url: hostname + '/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV;v=0002/A_InbDeliveryHeader',
        headers: {
            'x-csrf-token': 'Fetch',
            'Authorization': AuthorizationPrd,
            //  'Cookie': 'sap-XSRF_YP5_100=XgSO6d-FqUacGo_nnhSEkA%3d%3d20250507060829t3rISg-nzlM9OmCKbb-cpwpOIfIOeZO0fLNRMQkfsvM%3d; sap-usercontext=sap-client=100'
        }
    };

    axios.request(config)
        .then((response) => {
            const csrfToken01 = response.headers['x-csrf-token'];
            const cookie = response.headers['set-cookie'];

            console.log('CSRF Token:', csrfToken01);

            postcall(csrfToken01, cookie);



            //console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });


    function postcall(csrfToken01, cookie) {
        const axios02 = require('axios');
        let data = JSON.stringify({
            "to_DeliveryDocumentItem": {
                "results": [
                    {
                        "ReferenceSDDocument": PurchaseOrder,
                        "ReferenceSDDocumentItem": lineItem,
                        "ActualDeliveryQuantity": committedOty
                    }
                ]
            }
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV;v=0002/A_InbDeliveryHeader', // working
            url: hostname + '/sap/opu/odata/sap/API_INBOUND_DELIVERY_SRV;v=0002/A_InbDeliveryHeader',
            headers: {
                'x-csrf-token': csrfToken01,
                'Content-Type': 'application/json',
                'Authorization': AuthorizationPrd,
                'Cookie': cookie
            },
            data: data
        };

        axios02.request(config)
            .then((response) => {
                var jsonObject = {};
                jsonObject.Status = response.status;
                jsonObject.ResponseData = response.data;
                console.log("Response Status Code: ", response.status);
                res.json(jsonObject);
                // res.status(201).send({ message: "Posted successfully" });  // ✅ Send success response
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error Status Code: ", error.response.status);
                    res.status(error.response.status).send({ error: "Error posting data" });  // ✅ Send error response
                } else {
                    console.log("Error: ", error.message);
                    res.status(500).send({ error: error.message });  // ✅ Send general error response
                }

                // axios02.request(config)
                // .then((response) => {
                //     // Logging the status code
                //     console.log("Response Status Code: ", response.status);

                //     // Logging the response data
                //     //console.log("Post Response: ", JSON.stringify(response.data));

                //     // Optionally, you can log the entire response object if needed
                //     // console.log("Full Response: ", response);
                //   })
                //   .catch((error) => {
                //     // Handle the error, log the status code from error if possible
                //     if (error.response) {
                //       // If error response is available, log the status code
                //       console.log("Error Status Code: ", error.response.status);
                //     } else {
                //       // If no response from server, log the error message
                //       console.log("Error: ", error.message);
                //     }
            });


    }

});

//ASN MODEL DETAILS
app.get('/asnDetails', async (req, res) => {

    const username = req.session.UserName;
    console.log("Username from session My deliveries:", username);
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session ASN Model Details:", Suppliercode);


    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        //    url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zasn_details_cds_sb/srvd_a2x/sap/zasn_details_cds_sd/0001/ZASN_DETAILS_CDS?$filter=PurchaseOrder eq \'5500000046\'',  //working
        url: hostname + '/sap/opu/odata4/sap/zasn_details_cds_sb/srvd_a2x/sap/zasn_details_cds_sd/0001/ZASN_DETAILS_CDS?$filter=k eq \'5500000046\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    try {
        const response = await axios.request(config);
        //   console.log("Invoice data received:", response.data); // safe to log
        res.json(response.data); // ✅ only send data part, avoids circular structure
    } catch (error) {
        console.error("Error fetching invoice data:", error.message);
        res.status(500).json({ error: 'Failed to fetch invoice data' });
    }

});

app.get('/homePage1', (req, res) => {

    console.log("req.session.username in homepage", req.session.UserName)


    if (req.session.UserName) {
        res.render('homePage', { username: req.session.username });
    } else {
        res.redirect('/');
    }
});


// MODEL POPUP 

app.get('/myDeliveryPODetailsFilter', async (req, res) => {

    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session :", Suppliercode);
    console.log("username", username);
    const poNum = req.query.PurchaseOrder;


    let config = {

        method: 'get',
        maxBodyLength: Infinity,
        url: hostname + '/sap/opu/odata4/sap/zpurch_ord_dtls_cds_sb/srvd_a2x/sap/zpurch_ord_dtls_cds_sd/0001/ZPURCH_ORD_DTLS_CDS?$top=1000000&$filter=PurchaseOrder eq \'' + poNum + '\'',
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }

    };

    console.log("poDetails", config);

    try {
        const response = await axios.request(config);
        const poData = response.data.value;

        if (!poData) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: poData });  // in this i will get the page in response
        res.json(poData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching po data:", error.message);
        res.status(500).json({ error: 'Failed to fetch po data' });
    }

});


// MODEL POPUP OF GR NUMBER IN MY DELIVERIES

app.get('/myDeliveryDetailsFilter', async (req, res) => {

    const username = req.session.UserName;
    const Suppliercode = req.session.Suppliercode;
    console.log("Suppliercode from session :", Suppliercode);
    console.log("username", username);
    const grNum = req.query.GR;
    const delNote = req.query.DeliveryDocument;
    console.log(delNote);

    let filterConditions = [];

    if (grNum) {
        filterConditions.push(`GR eq '${grNum}'`);
    }
    if (delNote) {
        filterConditions.push(`DeliveryDocument eq '${delNote}'`);
    }

    let filterQuery = filterConditions.length > 0 ? `$filter=${filterConditions.join(' and ')}` : '';
    console.log(filterQuery);
    const baseUrl = hostname + '/sap/opu/odata4/sap/zdelivery_details_cds_sb/srvd_a2x/sap/zdelivery_details_cds_sd/0001/ZDELIVERY_DETAILS_CDS';

    // console.log("Query Parameters:", req.query);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,

        url: `${baseUrl}?${filterQuery}`,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };
    console.log("url", config);

    try {
        const response = await axios.request(config);
        const deliData = response.data.value;

        if (!deliData) {
            return res.status(404).json({ error: 'Delivery data not found' });
        }

        //   res.render('myInvoice/myInvoiceDetails', { invoice: deliData });  // in this i will get the page in response
        res.json(deliData);  // in this i will get json data in response 

    } catch (error) {
        console.error("Error fetching Delivery data:", error.message);
        res.status(500).json({ error: 'Failed to fetch Delivery data' });
    }

});



// FETCH SAP MATERIALS DIRECTLY (NO DATABASE)
app.get('/getSapMaterials', async (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { Product, ProductType, ProductGroup } = req.query;

    let filters = [];
    if (Product) filters.push(`Product eq '${Product}'`);
    if (ProductType) filters.push(`ProductType eq '${ProductType}'`);
    if (ProductGroup) filters.push(`ProductGroup eq '${ProductGroup}'`);

    let filterUrl = '';
    if (filters.length > 0) {
        filterUrl = '&$filter=' + filters.join(' and ');
    }

    const sapUrl = hostname + '/sap/opu/odata4/sap/zsb_material_master/srvd_a2x/sap/zsd_material_master/0001/ZMATERIAL_MASTER_CDS?sap-client=100' + filterUrl;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: sapUrl,
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    };

    console.log("Fetching SAP Materials URL:", sapUrl);

    try {
        const response = await axios.request(config);
        const materials = response.data.value;
        res.json(materials || []);
    } catch (error) {
        console.error("Error fetching SAP materials:", error.message);
        res.status(500).json({ error: 'Failed to fetch SAP materials', details: error.message });
    }
});



// app.get('/homepage', (req, res) => {
//     console.log("User name sesstion==", req.session.username);
//     res.render('index', { username: "CTPLABAP" });
//     return false;
//  // if (req.session.Username) {res.render('index', { Username: req.session.Username });} else {res.redirect('/login');}
// });

// Starting the server
app.post('/deleteAdminUser', (req, res) => {
    if (req.session.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
    const { Username } = req.body;
    db.query('UPDATE adminusers SET IsDeleted = 1 WHERE UserName = ?', [Username], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
});

app.post('/editAdminUser', (req, res) => {
    if (req.session.role !== 'Admin') return res.status(403).json({ error: 'Unauthorized' });
    const { OriginalUsername, Firstname, Lastname, Emailid, Designation, Role, Mobile, Status, Company, Associatedwith, Password } = req.body;

    let sql = `UPDATE adminusers SET 
        FirstName = ?, LastName = ?, EmailId = ?, 
        Designation = ?, Role = ?, Mobile = ?, Status = ?,
        Company = ?, AssociatedWith = ?`;

    let params = [Firstname, Lastname, Emailid, Designation, Role, Mobile, Status, Company, Associatedwith];

    if (Password && Password.trim() !== '') {
        sql += `, Password = ?`;
        params.push(Password);
    }

    sql += ` WHERE UserName = ?`;
    params.push(OriginalUsername);

    db.query(sql, params, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
});

app.post('/addAdminUser', (req, res) => {
    const { Username, Firstname, Lastname, Emailid, Designation, Role, Mobile, Status, Password, AdminCode, Company, Associatedwith } = req.body;

    // Check uniqueness
    const checkSql = 'SELECT UserName, AdminCode FROM adminusers WHERE UserName = ? OR AdminCode = ? LIMIT 1';
    db.query(checkSql, [Username, AdminCode], (checkErr, results) => {
        if (checkErr) {
            console.error("Check Unique Error:", checkErr);
            return res.status(500).json({ error: 'Database error while validating' });
        }
        if (results.length > 0) {
            const existing = results[0];
            if (existing.UserName === Username) return res.status(400).json({ error: 'Username already exists' });
            if (existing.AdminCode === AdminCode) return res.status(400).json({ error: 'Admin Code already exists' });
        }

        const sql = `INSERT INTO adminusers (UserName, FirstName, LastName, EmailId, Designation, Role, Mobile, Status, Password, AdminCode, Company, AssociatedWith) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [Username, Firstname, Lastname, Emailid, Designation, Role, Mobile, Status, Password, AdminCode, Company, Associatedwith], (err) => {
            if (err) {
                console.error("Add Admin User Error:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    if (err.sqlMessage && err.sqlMessage.includes('AdminCode')) {
                        return res.status(400).json({ error: 'Admin Code already exists' });
                    }
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error while saving user' });
            }
            res.json({ success: true });
        });
    });
});


// -----------------------------------------------------------------------------
// FORGOT PASSWORD ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/forgotPassword/sendOtp', (req, res) => {
    const { tab, username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ success: false, message: "Username and Email are required." });
    }

    const isSupplier = tab === "supplier";
    const tableName = isSupplier ? "onboarding_users" : "adminusers";
    const userCol = isSupplier ? "PanNo" : "UserName";
    const emailCol = "EmailId";

    const sql = `SELECT * FROM ${tableName} WHERE ${userCol} = ? AND ${emailCol} = ? LIMIT 1`;

    db.query(sql, [username, email], async (err, results) => {
        if (err) {
            console.error("Forgot password DB error:", err);
            return res.status(500).json({ success: false, message: "Database error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No matching account found for these details." });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 3 * 60 * 1000;
        OTP_STORE[email] = { otp, expiresAt };

        try {
            await transporter.sendMail({
                from: '"CTPL" <spadmin@castaliaz.in>',
                to: email,
                subject: "Password Reset OTP - Supplier Portal",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #1F5485; text-align: center;">Reset Your Password</h2>
                        <p>We received a request to reset the password for your account.</p>
                        <p>Your OTP is:</p>
                        <h1 style="text-align: center; color: #1F5485; letter-spacing: 5px;">${otp}</h1>
                        <p>This OTP is valid for 3 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                `
            });
            res.json({ success: true, message: "OTP sent successfully to your email." });
        } catch (error) {
            console.error("OTP email error:", error);
            res.status(500).json({ success: false, message: "Failed to send OTP email." });
        }
    });
});

app.post('/forgotPassword/reset', async (req, res) => {
    const { tab, username, email, otp, newPassword } = req.body;

    if (!username || !email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const storedData = OTP_STORE[email];
    if (!storedData || Date.now() > storedData.expiresAt || storedData.otp !== otp) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const isSupplier = tab === "supplier";
    const tableName = isSupplier ? "onboarding_users" : "adminusers";
    const userCol = isSupplier ? "PanNo" : "UserName";
    const passCol = isSupplier ? "UserPassword" : "Password";

    try {
        const sql = `UPDATE ${tableName} SET ${passCol} = ? WHERE ${userCol} = ? AND EmailId = ?`;

        db.query(sql, [newPassword, username, email], (err, results) => {
            if (err) {
                console.error("Password reset DB error:", err);
                return res.status(500).json({ success: false, message: "Database update failed." });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Account not found." });
            }

            delete OTP_STORE[email];
            res.json({ success: true, message: "Password reset successfully. You can now sign in." });
        });
    } catch (error) {
        console.error("Password hashing error:", error);
        res.status(500).json({ success: false, message: "Server error during password reset." });
    }
});
// -----------------------------------------------------------------------------

app.listen(PORT, (error) => {
    if (!error) {
        console.log("Server is successfully running, and app is listening on port " + PORT);
    } else {
        console.log("Error occurred, server can't start", error);
    }
});


/*
HTTP SERVER Hosting
*/
// app.listen(PORT, () => {
// 	console.log('Listening on port ${PORT}');
// });



// CREATE USER
// app.post('/create_user', async (req, res_header) => {
//     var https = require('follow-redirects').https;
//     var fs = require('fs');
//     var postData = JSON.stringify(req.body);
//     const jsonObject = JSON.parse(postData);
//     const Buffer = require('buffer').Buffer;
//     function encodePasswordToBase64(password) {
//         const buffer = Buffer.from(password, 'utf-8');
//         return buffer.toString('base64');
//     }
//     const originalPassword = jsonObject.Password;
//     const encodedPassword = encodePasswordToBase64(originalPassword);
//     console.log('Encoded Password:', encodedPassword);
//     var payload = {
//         "Username": jsonObject.Username,
//         "Password": encodedPassword,
//         "Firstname": jsonObject.Firstname,
//         "Lastname": jsonObject.Lastname,
//         "Emailid": jsonObject.Emailid,
//         "Contact": jsonObject.Contact,
//         "Validfrom": jsonObject.Validfrom,
//         "Validto": jsonObject.Validto,
//         "Createdby": jsonObject.CreatedBy,
//         "Createdon": jsonObject.CreatedOn,
//         "Changedby": jsonObject.Changedby,
//         "Changedon": jsonObject.Changedon
//     };
//     var options = {
//         'method': 'GET',
//         'hostname': hostname,
//         'path': '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
//         'headers': {
//             'x-csrf-token': 'Fetch',
//             'Authorization': AuthorizationPrd,
//         },
//         'maxRedirects': 20
//     };

//     var req = https.request(options, function (res) {
//         var chunks = [];
//         res.on("data", function (chunk) {
//             chunks.push(chunk);
//         });
//         res.on("end", function (chunk) {
//             var body = Buffer.concat(chunks);
//             const csrfToken = res.headers['x-csrf-token'];
//             const cookie = res.headers['set-cookie'];
//             console.log('Token -> ', csrfToken);
//             post_call_create_user(csrfToken, cookie);
//             // console.log(body.toString());
//         });

//         res.on("error", function (error) {
//             console.error(error);
//         });
//     });


//     function post_call_create_user(csrfToken, cookie) {
//         var apiParameters = {
//             'method': 'POST',
//             'hostname': hostname,
//             'path': '/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
//             'headers': {
//                 'X-CSRF-TOKEN': csrfToken,
//                 'Content-Type': 'application/json',
//                 'Authorization': AuthorizationPrd,
//                 'Cookie': cookie
//             },
//             'maxRedirects': 20
//         };

//         let secondReq = https.request(apiParameters, function (res) {
//             var status = res.statusCode;
//             var chunks = [];
//             res.on("data", function (chunk) {
//                 chunks.push(chunk);
//             });

//             res.on("end", function (chunk) {
//                 const jsonObject = {};
//                 jsonObject.Status = status;
//                 var body = Buffer.concat(chunks);
//                 const parsedObject = JSON.parse(body.toString());
//                 if (status == '201') {
//                     jsonObject.Message = parsedObject.Username;
//                     res_header.json(jsonObject);
//                 } else {
//                     jsonObject.ErrorCode = parsedObject.error.code;
//                     jsonObject.ErrorMessage = parsedObject.error.message;
//                     res_header.json(jsonObject);
//                 }
//             });

//             res.on("error", function (error) {
//                 console.error('Some error occured--------> ', error);
//             });
//         });
//         secondReq.write(JSON.stringify(payload));
//         secondReq.end();
//     }
//     req.end();
// });

// app.get('/login_Validate', (req, res) => {
//     const logConnect = SapCfAxios(hana_connection);
//     const Password = req.query.Password;
//     const Username = req.query.Username;

//     const Buffer = require('buffer').Buffer;
//     function encodePasswordToBase64(password) {
//         const buffer = Buffer.from(password, 'utf-8');
//         return buffer.toString('base64');
//     }
//     const originalPassword = Password;
//     const encodedPassword = encodePasswordToBase64(originalPassword);
//     var options = { 'headers': { 'Authorization': AuthorizationPrd, } };
//     logConnect.get('https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS?$filter=Password%20eq%20\'' + encodedPassword + '\'%20and%20Username%20eq%20\'' + Username + '\'', options).then(response => {
//  //   logConnect.get('/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS?$filter=Password eq '+ encodedPassword +' and Username eq '+ Username +'', options).then(response => {

//         var status = res.statusCode;
//         const jsonObject = {};
//         jsonObject.Status = status;
//         jsonObject.Data = response.data.value;
//         if (response.data.value.length == 1) {
//             req.session.userId = "CTPL";
//             req.session.username = Username;
//             jsonObject.UserName = req.session.username;
//         }
//         res.json(jsonObject);
//     })
//         .catch(error => {
//             console.error('Error:', error.message);
//         });
// });

// app.get('/login', async (req, rea) => {
//     const axios = require('axios');
//     let config = {
//         method: 'get',
//         maxBodyLength: Infinity,
//         url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
//         headers: {
//             'x-csrf-token': 'Fetch',
//             'Authorization': 'Basic Q1RQTEFCQVA6UGFzc3dvcmRAIzA5ODc2NTQzMjE=',
//             'Cookie': 'sap-XSRF_YP5_100=JLUISfoCHkljhyN6eNOdMA%3d%3d20250414090319kdRwQjN2w9ci0yoiqmhrkHih1HXgkkZhAUa1IpWcpdY%3d; sap-usercontext=sap-client=100'
//         }
//     };

//     axios.request(config)
//         .then((response) => {
//             const csrfToken = response.headers['x-csrf-token'];
//             console.log("CDRF Token", csrfToken);
//             postCall(csrfToken);
//             console.log(JSON.stringify(response.data));
//         })
//         .catch((error) => {
//             console.log(error);
//         });
// });

// function postCall(csrfToken) {
//     const axios = require('axios');
//     let data = JSON.stringify({
//         "Username": "CTPL1",
//         "Password": "Test",
//         "Firstname": "Avinash",
//         "Lastname": "Prachand",
//         "Emailid": "avinash@gmail.com",
//         "Contact": "9049888990",
//         "Validfrom": "",
//         "Validto": "",
//         "Createdby": "",
//         "Createdon": "",
//         "Changedby": "",
//         "Changedon": "",
//         "SAP__Messages": []
//     });

//     console.log("data", data);

//     let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: 'https://my401677-api.s4hana.cloud.sap/sap/opu/odata4/sap/zsp_user_cds_sb/srvd_a2x/sap/zsp_user_cds_sd/0001/ZSP_USER_CDS',
//         headers: {
//             'x-csrf-token': 'JLUISfoCHkljhyN6eNOdMA==',
//             'Content-Type': 'application/json',
//             'Authorization': 'Basic Q1RQTEFCQVA6UGFzc3dvcmRAIzA5ODc2NTQzMjE=',
//             'Cookie': 'sap-XSRF_YP5_100=JLUISfoCHkljhyN6eNOdMA%3d%3d20250414090319kdRwQjN2w9ci0yoiqmhrkHih1HXgkkZhAUa1IpWcpdY%3d; sap-usercontext=sap-client=100'
//         },
//         data: data
//     };

//     axios.request(config)
//         .then((response) => {
//             // Logging the status code
//             console.log("Response Status Code: ", response.status);

//             // Logging the response data
//             console.log("Post Response: ", JSON.stringify(response.data));

//             // Optionally, you can log the entire response object if needed
//             // console.log("Full Response: ", response);
//         })
//         .catch((error) => {
//             // Handle the error, log the status code from error if possible
//             if (error.response) {
//                 // If error response is available, log the status code
//                 console.log("Error Status Code: ", error.response.status);
//             } else {
//                 // If no response from server, log the error message
//                 console.log("Error: ", error.message);
//             }
//         });
// }
