// dbConnection.js

const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Email transporter using port 25
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

    const createTableSql = `
        CREATE TABLE IF NOT EXISTS supplier_info_record (
            Id INT AUTO_INCREMENT PRIMARY KEY,
            SupplierId VARCHAR(50) NOT NULL,
            SAPMaterialSKU VARCHAR(40) NOT NULL,
            SAPProductDescription VARCHAR(100) NOT NULL,
            MaterialType VARCHAR(100) NOT NULL,
            VendorProductName VARCHAR(100) NOT NULL,
            VendorProductDescription VARCHAR(500) NULL,
            Unit VARCHAR(50) NOT NULL,
            Price DOUBLE NOT NULL,
            ProductSpecification VARCHAR(500) NULL,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_supplier_sku (SupplierId, SAPMaterialSKU)
        )
    `;
    db.query(createTableSql, (tableErr) => {
        if (tableErr) {
            console.error('Error creating supplier_info_record table:', tableErr);
        } else {
            console.log('Table supplier_info_record ensured in database');
        }
    });

    const createIncomingRfqsSql = `
        CREATE TABLE IF NOT EXISTS incomingrfqs (
            ID INT NOT NULL AUTO_INCREMENT,
            RFQs VARCHAR(50) NOT NULL,
            RFQsDate DATE DEFAULT NULL,
            Status VARCHAR(50) DEFAULT NULL,
            ValidUntil DATE DEFAULT NULL,
            Material VARCHAR(100) DEFAULT NULL,
            MaterialDescription VARCHAR(255) DEFAULT NULL,
            Item INT DEFAULT NULL,
            Supplier VARCHAR(100) DEFAULT NULL,
            SubmissionDate DATE DEFAULT NULL,
            DocumentType VARCHAR(50) DEFAULT NULL,
            Amount DECIMAL(18,2) DEFAULT NULL,
            IsApproved TINYINT(1) NOT NULL DEFAULT '0',
            PRIMARY KEY (ID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;
    db.query(createIncomingRfqsSql, (err) => {
        if (err) {
            console.error('Error creating incomingrfqs table:', err);
        } else {
            console.log('Table incomingrfqs ensured in database');
        }
    });
});

// Helper to ensure user status rows exist in registrationprocess and allRegistrationStatus
const ensureStatusRecords = (userId, callback) => {
    const checkRegProc = 'SELECT 1 FROM registrationprocess WHERE newuserid = ? LIMIT 1';
    db.query(checkRegProc, [userId], (err, results) => {
        if (err) {
            console.error('Error checking registrationprocess:', err);
            return callback(err);
        }

        const proceedToCheckStatus = () => {
            const checkStatus = 'SELECT 1 FROM allRegistrationStatus WHERE UserId = ? LIMIT 1';
            db.query(checkStatus, [userId], (err2, results2) => {
                if (err2) {
                    console.error('Error checking allRegistrationStatus:', err2);
                    return callback(err2);
                }
                if (results2.length === 0) {
                    const insertStatus = 'INSERT INTO allRegistrationStatus (UserId, isUserCreated, isCompanyRegister, isEmailVerified, isProductRegisterd, isAreaOperationDone, isPaymenetReferenceDone, isComplienceDocumentDone) VALUES (?, 1, 0, 0, 0, 0, 0, 0)';
                    db.query(insertStatus, [userId], (err3) => {
                        if (err3) {
                            console.error('Error inserting default allRegistrationStatus:', err3);
                            return callback(err3);
                        }
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            });
        };

        if (results.length === 0) {
            const insertRegProc = 'INSERT INTO registrationprocess (newuserid, isUserCreated, isCompanyRegister, isEmailVerified, isProductRegisterd, isAreaOperationDone, isPaymenetReferenceDone, isComplienceDocumentDone) VALUES (?, 1, 0, 0, 0, 0, 0, 0)';
            db.query(insertRegProc, [userId], (err4) => {
                if (err4) {
                    console.error('Error inserting default registrationprocess:', err4);
                    return callback(err4);
                }
                proceedToCheckStatus();
            });
        } else {
            proceedToCheckStatus();
        }
    });
};

// Function to insert user data
const pracSave = (req, res) => {
    const { firstName, lastName } = req.body;

    const sql = 'INSERT INTO mastertable (first_name, last_name) VALUES (?, ?)';
    db.query(sql, [firstName, lastName], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database insert error' });
        }
        res.status(200).json({ message: 'Data saved successfully' });
    });
};

const pracCreateNewUser = (req, res) => {
    const { email, panNo, gstnNo, isEmailVerified, password } = req.body;
    console.log("createUserNow Request Headers:", req.headers);
    console.log("createUserNow Request Body:", req.body);

    if (!email) {
        console.error("400 Error: Email is missing in body", req.body);
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || password.length < 8) {
        console.error("400 Error: Password invalid", password ? password.length : 'missing');
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    console.log("Creating new user registration record for email:", email, "and PAN:", panNo);

    // ALWAYS INSERT a brand new user record to ensure every onboarding session is unique
    const sql = 'INSERT INTO onboarding_users (EmailId, PanNo, GstnNo, IsEmailVerified, UserPassword, ApprovalStatus) VALUES (?, ?, ?, ?, ?, 0)';
    db.query(sql, [email, panNo, gstnNo, isEmailVerified ? 1 : 0, password], (err, result) => {
        if (err) {
            console.error('Error inserting data into onboarding_users:', err);
            return res.status(500).json({ error: 'Database insert error' });
        }

        const newUserId = result.insertId;
        console.log("Successfully created user record. New UserId:", newUserId);

        // Update current session's userId to the new user
        req.session.userId = newUserId;

        const sqlReg = "INSERT INTO registrationProcess (newuserid, isUserCreated, isCompanyRegister, isEmailVerified, isProductRegisterd, isAreaOperationDone, isPaymenetReferenceDone, isComplienceDocumentDone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        db.query(sqlReg, [newUserId, true, false, isEmailVerified ? true : false, false, false, false, false], (errReg) => {
            if (errReg) {
                console.error('Error inserting data for Registration Process:', errReg);
            }
        });

        const sqlStatus = "INSERT INTO allRegistrationStatus (UserId, isUserCreated, isCompanyRegister, isEmailVerified, isProductRegisterd, isAreaOperationDone, isPaymenetReferenceDone, isComplienceDocumentDone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        db.query(sqlStatus, [newUserId, true, false, isEmailVerified ? true : false, false, false, false, false], (errStatus) => {
            if (errStatus) {
                console.error('Error inserting data for allRegistrationStatus:', errStatus);
            }
        });

        if (isEmailVerified) {
            const sqlVerify = "INSERT INTO verifyemail (UserId, EmailAddress) VALUES (?, ?)";
            db.query(sqlVerify, [newUserId, email], (errVerify) => {
                if (errVerify) {
                    console.error('Error inserting verify email:', errVerify);
                }
            });
        }

        res.status(200).json({
            message: 'User created successfully',
            userId: newUserId,
            approvalStatus: 0
        });
    });
};


const regiCompDb = (req, res) => {
    var userId = req.body.userId || req.session.userId;
    if (userId) {
        req.session.userId = userId;
    }

    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }

    const { companyName, streetAddress, city, district, state, postalCode, country, headOffice, companyPhone, companyEmail } = req.body;

    const checkSql = 'SELECT 1 FROM registercompany WHERE UserId = ? LIMIT 1';
    db.query(checkSql, [userId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking registercompany:', checkErr);
            return res.status(500).json({ error: 'Database query error' });
        }

        const proceedWithStatus = () => {
            ensureStatusRecords(userId, (statusErr) => {
                if (statusErr) {
                    return res.status(500).json({ error: 'Database update error' });
                }
                var updatequery = `update registrationprocess set isCompanyRegister=true where newuserid=?`;
                db.query(updatequery, [userId], (err, updateResult) => {
                    if (err) {
                        console.error('Error updating registrationprocess:', err);
                    }
                    var updateStatusQuery = `update allRegistrationStatus set isCompanyRegister=true where UserId=?`;
                    db.query(updateStatusQuery, [userId], (errStatus) => {
                        if (errStatus) {
                            console.error('Error updating allRegistrationStatus:', errStatus);
                        }
                        return res.status(200).json({ message: 'Data saved successfully' });
                    });
                });
            });
        };

        if (checkResults.length > 0) {
            const updateSql = 'UPDATE registercompany SET CompanyName=?, StreetAddress=?, City=?, District=?, State=?, PostalCode=?, Country=?, OfficeLocation=?, PhoneNumber=?, EmailId=? WHERE UserId=?';
            db.query(updateSql, [companyName, streetAddress, city, district, state, postalCode, country, headOffice, companyPhone, companyEmail, userId], (err) => {
                if (err) {
                    console.error('Error updating registercompany:', err);
                    return res.status(500).json({ error: 'Database update error' });
                }
                proceedWithStatus();
            });
        } else {
            const insertSql = 'INSERT INTO registercompany (UserId, CompanyName, StreetAddress, City, District, State, PostalCode, Country, OfficeLocation, PhoneNumber, EmailId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(insertSql, [userId, companyName, streetAddress, city, district, state, postalCode, country, headOffice, companyPhone, companyEmail], (err) => {
                if (err) {
                    console.error('Error inserting registercompany:', err);
                    return res.status(500).json({ error: 'Database insert error' });
                }
                proceedWithStatus();
            });
        }
    });
};


const EmailDb = (req, res) => {
    const { emailVerifyDb } = req.body;
    const userId = req.session?.userId;

    if (!userId || !emailVerifyDb) {
        return res.status(400).json({ error: 'Missing userId or email' });
    }

    const checkSql = 'SELECT 1 FROM verifyemail WHERE UserId = ? LIMIT 1';
    db.query(checkSql, [userId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking verifyemail:', checkErr);
            return res.status(500).json({ error: 'Database query error' });
        }

        const proceedWithStatus = () => {
            ensureStatusRecords(userId, (statusErr) => {
                if (statusErr) {
                    return res.status(500).json({ error: 'Database update error' });
                }
                var updatequery = `update registrationprocess set isEmailVerified=true where newuserid=?`;
                db.query(updatequery, [userId], (err, updateResult) => {
                    if (err) {
                        console.error('Error updating registrationprocess:', err);
                        return res.status(500).json({ error: 'Database update error' });
                    }
                    var updateStatusQuery = `update allRegistrationStatus set isEmailVerified=true where UserId=?`;
                    db.query(updateStatusQuery, [userId], (errStatus) => {
                        if (errStatus) {
                            console.error('Error updating allRegistrationStatus:', errStatus);
                            return res.status(500).json({ error: 'Database update error' });
                        }
                        return res.status(200).json({ message: 'Data saved successfully' });
                    });
                });
            });
        };

        if (checkResults.length > 0) {
            const updateSql = 'UPDATE verifyemail SET EmailAddress=? WHERE UserId=?';
            db.query(updateSql, [emailVerifyDb, userId], (err) => {
                if (err) {
                    console.error('Error updating verifyemail:', err);
                    return res.status(500).json({ error: 'Database update error' });
                }
                proceedWithStatus();
            });
        } else {
            const insertSql = 'INSERT INTO verifyemail (UserId, EmailAddress) VALUES (?, ?)';
            db.query(insertSql, [userId, emailVerifyDb], (err) => {
                if (err) {
                    console.error('Error inserting verifyemail:', err);
                    return res.status(500).json({ error: 'Database insert error' });
                }
                proceedWithStatus();
            });
        }
    });
};


// const EmailDb = (req, res) => {
//     const { emailVerify } = req.body;

//     const sql = 'INSERT INTO verifyemail (UserId, EmailAddress) VALUES (?, ?)';
//       let userId=req.session.userId;
//     db.query(sql, [userId, emailVerify ], (err, result) => {
//         if (err) {
//             console.error('Error inserting data:', err);
//             return res.status(500).json({ error: 'Database insert error' });
//         }
//         res.status(200).json({ message: 'Data saved successfully' });
//     });
// };


// const regiProDb = (req, res) => {
//     // Access userId from the session
//     const userId = req.session.userId;
//     if (!userId) {
//         return res.status(400).json({ error: 'UserId is missing, please create a user first' });
//     }

//     const { productId, productDescription, productCategory, minOrderQuantity, maxOrderQuantity, availableQuantity, packingOptions, measurementUnit, unitPrice, currency, uploadProductImg } = req.body;

//     const sql = 'INSERT INTO registerproducts (UserId, ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency, UploadProductImg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
//     db.query(sql, [userId, productId, productDescription, productCategory, minOrderQuantity, maxOrderQuantity, availableQuantity, packingOptions, measurementUnit, unitPrice, currency, uploadProductImg], (err2, result2) => {
//         if (err2) {
//             console.error('Error inserting data into registerproducts:', err2);
//             return res.status(500).json({ error: 'Database insert error into registerproducts' });
//         }
//         res.status(200).json({ message: 'Product data saved successfully' });
//     });
// };

const regiProDb = (req, res) => {
    // Access userId from the session
    var userId = req.session.userId;
    var ProductImg = null; // default if no file
    var imageFile = null

    var uploadPath = null
    // userId = 1;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }
    console.log('req=== is', req)
    console.log("res=== is", req.body)
    const { productId, productDescription, productCategory, minOrderQuantity, maxOrderQuantity, availableQuantity, packingOptions, measurementUnit, unitPrice, currency, uploadProductSpecs } = req.body;

    ///console.log("req file",req.files.uploadProductImg)
    if (req.files && req.files.uploadProductImg) {

        imageFile = req.files.uploadProductImg;



        const ext = path.extname(imageFile.name); // e.g. ".jpg"

        const nameWithoutExt = path.basename(imageFile.name, ext);

        // Generate timestamp

        const now = new Date();

        const dateTimeStr = now.getFullYear() +

            ("0" + (now.getMonth() + 1)).slice(-2) +

            ("0" + now.getDate()).slice(-2) + "-" +

            ("0" + now.getHours()).slice(-2) +

            ("0" + now.getMinutes()).slice(-2) +

            ("0" + now.getSeconds()).slice(-2);



        ProductImg = `${userId}-${dateTimeStr}${ext}`;



        uploadPath = path.join(__dirname, 'uploads', ProductImg);



    }

    console.log("ProductImg===", ProductImg);
    const sql = 'INSERT INTO registerproducts (UserId, ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency, UploadProductImg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, productId, productDescription, productCategory, minOrderQuantity, maxOrderQuantity, availableQuantity, packingOptions, measurementUnit, unitPrice, currency, ProductImg], (err2, result2) => {
        if (err2) {
            console.error('Error inserting data into registerproducts:', err2);
            return res.status(500).json({ error: 'Database insert error into registerproducts' });
        }

        const proceedWithUpdate = () => {
            ensureStatusRecords(userId, (statusErr) => {
                if (statusErr) {
                    return res.status(500).json({ error: 'Database update error' });
                }
                var updatequery = `update registrationprocess set isProductRegisterd=true where newuserid=?`;
                db.query(updatequery, [userId], (err, result) => {
                    if (err) {
                        console.error('Error updating registrationprocess:', err);
                        return res.status(500).json({ error: 'Database update error' });
                    }
                    var updateStatusQuery = `update allRegistrationStatus set isProductRegisterd=true where UserId=?`;
                    db.query(updateStatusQuery, [userId], (errStatus) => {
                        if (errStatus) {
                            console.error('Error updating allRegistrationStatus:', errStatus);
                            return res.status(500).json({ error: 'Database update error' });
                        }
                        return res.status(200).json({ message: 'Product data saved successfully' });
                    });
                });
            });
        };

        if (ProductImg != null) {
            imageFile.mv(uploadPath, function (err) {
                if (err) {
                    console.error("File move error:", err);
                    return res.status(500).json({ error: "File upload failed" });
                }
                proceedWithUpdate();
            });
        } else {
            proceedWithUpdate();
        }
    });
};

const deliLocDb = (req, res) => {
    // Access userId from the session or request body
    const userId = req.body.userId || req.session.userId;
    if (userId) {
        req.session.userId = userId;
    }
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }

    const { countries, states, districts, city, deliveryModes, maxCapacity, minLeadTime, preferredPartners } = req.body;

    const checkSql = 'SELECT 1 FROM deliverylocations WHERE UserId = ? LIMIT 1';
    db.query(checkSql, [userId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking deliverylocations:', checkErr);
            return res.status(500).json({ error: 'Database query error' });
        }

        const proceedWithStatus = () => {
            ensureStatusRecords(userId, (statusErr) => {
                if (statusErr) {
                    return res.status(500).json({ error: 'Database update error' });
                }
                var updatequery = `update registrationprocess set isAreaOperationDone=true where newuserid=?`;
                db.query(updatequery, [userId], (err, result) => {
                    if (err) {
                        console.error('Error updating registrationprocess:', err);
                        return res.status(500).json({ error: 'Database update error' });
                    }
                    var updateStatusQuery = `update allRegistrationStatus set isAreaOperationDone=true where UserId=?`;
                    db.query(updateStatusQuery, [userId], (errStatus) => {
                        if (errStatus) {
                            console.error('Error updating allRegistrationStatus:', errStatus);
                            return res.status(500).json({ error: 'Database update error' });
                        }
                        return res.status(200).json({ message: 'data saved successfully' });
                    });
                });
            });
        };

        if (checkResults.length > 0) {
            const updateSql = 'UPDATE deliverylocations SET CountryOrp=?, States=?, Districts=?, Cities=?, DeliveryMode=?, MaxDelCapacity=?, MinDelLeadTime=?, PreDelPartners=? WHERE UserId=?';
            db.query(updateSql, [countries, states, districts, city, deliveryModes, maxCapacity, minLeadTime, preferredPartners, userId], (err) => {
                if (err) {
                    console.error('Error updating delivery Location:', err);
                    return res.status(500).json({ error: 'Database update error into delivery Location' });
                }
                proceedWithStatus();
            });
        } else {
            const insertSql = 'INSERT INTO deliverylocations (UserId, CountryOrp, States, Districts, Cities, DeliveryMode, MaxDelCapacity, MinDelLeadTime, PreDelPartners) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(insertSql, [userId, countries, states, districts, city, deliveryModes, maxCapacity, minLeadTime, preferredPartners], (err) => {
                if (err) {
                    console.error('Error inserting delivery Location:', err);
                    return res.status(500).json({ error: 'Database insert error into delivery Location' });
                }
                proceedWithStatus();
            });
        }
    });
};

const payInfoDb = (req, res) => {
    // Access userId from the session or request body
    const userId = req.body.userId || req.session.userId;
    if (userId) {
        req.session.userId = userId;
    }
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }

    const { bankAccounts, bankName, accHolderName, accountNumber, ifscCode, swiftCode } = req.body;

    const proceedWithStatus = () => {
        ensureStatusRecords(userId, (statusErr) => {
            if (statusErr) {
                return res.status(500).json({ error: 'Database update error' });
            }
            var updatequery = `update registrationprocess set isPaymenetReferenceDone=true where newuserid=?`;
            db.query(updatequery, [userId], (err, result) => {
                if (err) {
                    console.error('Error updating registrationprocess:', err);
                    return res.status(500).json({ error: 'Database update error' });
                }
                var updateStatusQuery = `update allRegistrationStatus set isPaymenetReferenceDone=true where UserId=?`;
                db.query(updateStatusQuery, [userId], (errStatus) => {
                    if (errStatus) {
                        console.error('Error updating allRegistrationStatus:', errStatus);
                        return res.status(500).json({ error: 'Database update error' });
                    }
                    return res.status(200).json({ message: 'data saved successfully' });
                });
            });
        });
    };

    if (bankAccounts && Array.isArray(bankAccounts)) {
        // Delete all existing paymentinfo for this user first
        const deleteSql = 'DELETE FROM paymentinfo WHERE UserId = ?';
        db.query(deleteSql, [userId], (delErr) => {
            if (delErr) {
                console.error('Error deleting existing paymentinfo:', delErr);
                return res.status(500).json({ error: 'Database delete error into paymentinfo' });
            }

            if (bankAccounts.length === 0) {
                return proceedWithStatus();
            }

            let insertedCount = 0;
            let hasError = false;

            for (const acct of bankAccounts) {
                const insertSql = 'INSERT INTO paymentinfo (UserId, BankName, AccHoldName, AccNumber, IfscCode, SwiftCode) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertSql, [userId, acct.bankName, acct.accHolderName, acct.accountNumber, acct.ifscCode, acct.swiftCode], (err) => {
                    if (err) {
                        console.error('Error inserting bulk paymentinfo:', err);
                        if (!hasError) {
                            res.status(500).json({ error: 'Database insert error into paymentinfo' });
                            hasError = true;
                        }
                    } else {
                        insertedCount++;
                        if (insertedCount === bankAccounts.length && !hasError) {
                            proceedWithStatus();
                        }
                    }
                });
            }
        });
    } else {
        // Fallback: original single record submission logic
        const checkSql = 'SELECT 1 FROM paymentinfo WHERE UserId = ? AND AccNumber = ? LIMIT 1';
        db.query(checkSql, [userId, accountNumber], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking paymentinfo:', checkErr);
                return res.status(500).json({ error: 'Database query error' });
            }

            if (checkResults.length > 0) {
                const updateSql = 'UPDATE paymentinfo SET BankName=?, AccHoldName=?, IfscCode=?, SwiftCode=? WHERE UserId=? AND AccNumber=?';
                db.query(updateSql, [bankName, accHolderName, ifscCode, swiftCode, userId, accountNumber], (err) => {
                    if (err) {
                        console.error('Error updating paymentinfo:', err);
                        return res.status(500).json({ error: 'Database update error into paymentinfo' });
                    }
                    proceedWithStatus();
                });
            } else {
                const insertSql = 'INSERT INTO paymentinfo (UserId, BankName, AccHoldName, AccNumber, IfscCode, SwiftCode) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertSql, [userId, bankName, accHolderName, accountNumber, ifscCode, swiftCode], (err) => {
                    if (err) {
                        console.error('Error inserting data into paymentinfo:', err);
                        return res.status(500).json({ error: 'Database insert error into paymentinfo' });
                    }
                    proceedWithStatus();
                });
            }
        });
    }
};


const processFile = async (file, userId, type) => {
    if (file) {
        const ext = path.extname(file.name); // e.g. ".jpg"
        const now = new Date();
        const dateTimeStr = now.getFullYear() + ("0" + (now.getMonth() + 1)).slice(-2) +
            ("0" + now.getDate()).slice(-2) + "-" + ("0" + now.getHours()).slice(-2) +
            ("0" + now.getMinutes()).slice(-2) + ("0" + now.getSeconds()).slice(-2);

        const fileName = `${userId}-${dateTimeStr}${ext}`;
        const filePath = path.join(__dirname, 'fileUploads', fileName);

        try {
            await file.mv(filePath); // Move file to the desired path
            console.log(`${type} file uploaded successfully at ${filePath}`);
            return fileName;
        } catch (err) {
            console.error(`${type} file move error:`, err);
            return null;
        }
    }
    return null;
};


const compDocDb = async (req, res) => {
    // const userId = 1; // Assume for now, you can uncomment session logic
    const userId = req.body.userId || req.session.userId;
    if (userId) {
        req.session.userId = userId;
    }

    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }

    let BusinessRegPath = null;
    let GstinCertiPath = null;
    let PanCardPath = null;
    let TanCertiPath = null;
    let IsoCertiPath = null;
    let GmpCertiPath = null;
    let FdaApprovalPath = null;
    let BisApprovalPath = null;
    let DeclAuthenticityPath = null;
    let CancelledChequePath = null;
    let PfRegistrationPath = null;
    let EsicRegistrationPath = null;

    var {
        businessRegiDate, gstinCertDate, panCardDate, tanCertDate,
        isoCertDate, gmpCertDate, fdaApprovalDate, bisApprovalDate,
        declAuthenticityDate, cancelledChequeDate, pfRegistrationDate, esicRegistrationDate,
        businessRegNo, gstCertificateNo, panCardNo, cancelledChequeNo,
        pfRegistrationNo, esicRegistrationNo, declAuthenticityNo,
        tanCertificateNo, isoCertificateNo, gmpCertificateNo, fdaApprovalNo, bisApprovalNo
    } = req.body;

    businessRegiDate = businessRegiDate ? businessRegiDate : null;
    gstinCertDate = gstinCertDate ? gstinCertDate : null;  // Check if GSTIN Cert date exists
    panCardDate = panCardDate ? panCardDate : null;
    tanCertDate = tanCertDate ? tanCertDate : null;
    isoCertDate = isoCertDate ? isoCertDate : null;
    gmpCertDate = gmpCertDate ? gmpCertDate : null;
    fdaApprovalDate = fdaApprovalDate ? fdaApprovalDate : null;
    bisApprovalDate = bisApprovalDate ? bisApprovalDate : null;
    declAuthenticityDate = declAuthenticityDate ? declAuthenticityDate : null;
    cancelledChequeDate = cancelledChequeDate ? cancelledChequeDate : null;
    pfRegistrationDate = pfRegistrationDate ? pfRegistrationDate : null;
    esicRegistrationDate = esicRegistrationDate ? esicRegistrationDate : null;

    businessRegNo = businessRegNo ? businessRegNo : null;
    gstCertificateNo = gstCertificateNo ? gstCertificateNo : null;
    panCardNo = panCardNo ? panCardNo : null;
    cancelledChequeNo = cancelledChequeNo ? cancelledChequeNo : null;
    pfRegistrationNo = pfRegistrationNo ? pfRegistrationNo : null;
    esicRegistrationNo = esicRegistrationNo ? esicRegistrationNo : null;
    declAuthenticityNo = declAuthenticityNo ? declAuthenticityNo : null;
    tanCertificateNo = tanCertificateNo ? tanCertificateNo : null;
    isoCertificateNo = isoCertificateNo ? isoCertificateNo : null;
    gmpCertificateNo = gmpCertificateNo ? gmpCertificateNo : null;
    fdaApprovalNo = fdaApprovalNo ? fdaApprovalNo : null;
    bisApprovalNo = bisApprovalNo ? bisApprovalNo : null;

    // Process business registration file
    if (req.files && req.files.uploadbusinessRegistration) {
        BusinessRegPath = await processFile(req.files.uploadbusinessRegistration, userId, 'Business Registration');
    }

    // Process GSTIN certificate file
    if (req.files && req.files.uploadGSTINCertificate) {
        await delay(1000);
        GstinCertiPath = await processFile(req.files.uploadGSTINCertificate, userId, 'GSTIN Certificate');
    }

    // Process PAN card file
    if (req.files && req.files.uploadpanCard) {
        await delay(1000);
        PanCardPath = await processFile(req.files.uploadpanCard, userId, 'PAN card');
    }

    // Process TAN card file
    if (req.files && req.files.uploadtanCard) {
        await delay(1000);
        TanCertiPath = await processFile(req.files.uploadtanCard, userId, 'TAN card');
    }

    // Process ISO Certificate file
    if (req.files && req.files.uploadISOCertificate) {
        await delay(1000);
        IsoCertiPath = await processFile(req.files.uploadISOCertificate, userId, 'ISO Certificate');
    }

    // Process GMP Certificate file
    if (req.files && req.files.uploadGMPCertificate) {
        await delay(1000);
        GmpCertiPath = await processFile(req.files.uploadGMPCertificate, userId, 'GMP Certificate');
    }

    // Process FDA Approval file
    if (req.files && req.files.uploadfdaApproval) {
        await delay(1000);
        FdaApprovalPath = await processFile(req.files.uploadfdaApproval, userId, 'FDA Approval');
    }

    // Process BIS Approval file
    if (req.files && req.files.uploadbisApprovalPath) {
        await delay(1000);
        BisApprovalPath = await processFile(req.files.uploadbisApprovalPath, userId, 'BIS ApprovalPath');
    }

    // Process Declaration of Authenticity file
    if (req.files && req.files.uploaddeclAuthenticity) {
        await delay(1000);
        DeclAuthenticityPath = await processFile(req.files.uploaddeclAuthenticity, userId, 'Declaration of Authenticity');
    }

    // Process Cancelled Cheque file
    if (req.files && req.files.uploadcancelledCheque) {
        await delay(1000);
        CancelledChequePath = await processFile(req.files.uploadcancelledCheque, userId, 'Cancelled Cheque');
    }

    // Process PF Registration file
    if (req.files && req.files.uploadpfRegistration) {
        await delay(1000);
        PfRegistrationPath = await processFile(req.files.uploadpfRegistration, userId, 'PF Registration');
    }

    // Process ESIC Registration file
    if (req.files && req.files.uploadesicRegistration) {
        await delay(1000);
        EsicRegistrationPath = await processFile(req.files.uploadesicRegistration, userId, 'ESIC Registration');
    }

    const checkSql = 'SELECT 1 FROM compliancedoc WHERE UserId = ? LIMIT 1';
    db.query(checkSql, [userId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking compliancedoc:', checkErr);
            return res.status(500).json({ error: 'Database query error' });
        }

        const proceedWithStatus = () => {
            ensureStatusRecords(userId, (statusErr) => {
                if (statusErr) {
                    return res.status(500).json({ error: 'Database update error' });
                }
                var updatequery = `update registrationprocess set isComplienceDocumentDone=true where newuserid=?`;
                db.query(updatequery, [userId], (err, result) => {
                    if (err) {
                        console.error('Error updating registrationprocess:', err);
                        return res.status(500).json({ error: 'Database update error' });
                    }
                    var updateStatusQuery = `update allRegistrationStatus set isComplienceDocumentDone=true where UserId=?`;
                    db.query(updateStatusQuery, [userId], (errStatus) => {
                        if (errStatus) {
                            console.error('Error updating allRegistrationStatus:', errStatus);
                            return res.status(500).json({ error: 'Database update error' });
                        }
                        // Set ApprovalStatus to 3 (Onboarding details submitted, pending final profile review)
                        db.query('UPDATE onboarding_users SET ApprovalStatus = 3 WHERE UserId = ?', [userId], (errAppStatus) => {
                            if (errAppStatus) {
                                console.error('Error updating onboarding_users ApprovalStatus to 3:', errAppStatus);
                            }
                            return res.status(200).json({ message: 'data saved successfully' });
                        });
                    });
                });
            });
        };

        if (checkResults.length > 0) {
            const updateSql = `
                UPDATE compliancedoc SET 
                    BusinessRegPath = COALESCE(?, BusinessRegPath), BusinessReg = COALESCE(?, BusinessReg), 
                    GstinCertiPath = COALESCE(?, GstinCertiPath), GstinCerti = COALESCE(?, GstinCerti), 
                    PanCardPath = COALESCE(?, PanCardPath), PanCard = COALESCE(?, PanCard), 
                    TanCertiPath = COALESCE(?, TanCertiPath), TanCerti = COALESCE(?, TanCerti), 
                    IsoCertiPath = COALESCE(?, IsoCertiPath), IsoCerti = COALESCE(?, IsoCerti), 
                    GmpCertiPath = COALESCE(?, GmpCertiPath), GmpCerti = COALESCE(?, GmpCerti), 
                    FdaApprovalPath = COALESCE(?, FdaApprovalPath), FdaApproval = COALESCE(?, FdaApproval), 
                    BisApprovalPath = COALESCE(?, BisApprovalPath), BisApproval = COALESCE(?, BisApproval), 
                    DeclAuthenticityPath = COALESCE(?, DeclAuthenticityPath), DeclAuthenticity = COALESCE(?, DeclAuthenticity),
                    CancelledChequePath = COALESCE(?, CancelledChequePath), CancelledCheque = COALESCE(?, CancelledCheque),
                    PfRegistrationPath = COALESCE(?, PfRegistrationPath), PfRegistration = COALESCE(?, PfRegistration),
                    EsicRegistrationPath = COALESCE(?, EsicRegistrationPath), EsicRegistration = COALESCE(?, EsicRegistration),
                    BusinessRegNo = ?, GstinCertiNo = ?, PanCardNo = ?, CancelledChequeNo = ?,
                    PfRegistrationNo = ?, EsicRegistrationNo = ?, DeclAuthenticityNo = ?,
                    TanCertiNo = ?, IsoCertiNo = ?, GmpCertiNo = ?, FdaApprovalNo = ?, BisApprovalNo = ?
                WHERE UserId = ?
            `;
            const updateParams = [
                BusinessRegPath, businessRegiDate,
                GstinCertiPath, gstinCertDate,
                PanCardPath, panCardDate,
                TanCertiPath, tanCertDate,
                IsoCertiPath, isoCertDate,
                GmpCertiPath, gmpCertDate,
                FdaApprovalPath, fdaApprovalDate,
                BisApprovalPath, bisApprovalDate,
                DeclAuthenticityPath, declAuthenticityDate,
                CancelledChequePath, cancelledChequeDate,
                PfRegistrationPath, pfRegistrationDate,
                EsicRegistrationPath, esicRegistrationDate,
                businessRegNo, gstCertificateNo, panCardNo, cancelledChequeNo,
                pfRegistrationNo, esicRegistrationNo, declAuthenticityNo,
                tanCertificateNo, isoCertificateNo, gmpCertificateNo, fdaApprovalNo, bisApprovalNo,
                userId
            ];
            db.query(updateSql, updateParams, (err2) => {
                if (err2) {
                    console.error('Error updating compliancedoc:', err2);
                    return res.status(500).json({ error: 'Database update error into compliancedoc' });
                }
                proceedWithStatus();
            });
        } else {
            const insertSql = `
                INSERT INTO compliancedoc (
                    UserId, 
                    BusinessRegPath, BusinessReg, 
                    GstinCertiPath, GstinCerti, 
                    PanCardPath, PanCard, 
                    TanCertiPath, TanCerti, 
                    IsoCertiPath, IsoCerti, 
                    GmpCertiPath, GmpCerti, 
                    FdaApprovalPath, FdaApproval, 
                    BisApprovalPath, BisApproval, 
                    DeclAuthenticityPath, DeclAuthenticity,
                    CancelledChequePath, CancelledCheque,
                    PfRegistrationPath, PfRegistration,
                    EsicRegistrationPath, EsicRegistration,
                    BusinessRegNo, GstinCertiNo, PanCardNo, CancelledChequeNo,
                    PfRegistrationNo, EsicRegistrationNo, DeclAuthenticityNo,
                    TanCertiNo, IsoCertiNo, GmpCertiNo, FdaApprovalNo, BisApprovalNo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const insertParams = [
                userId,
                BusinessRegPath, businessRegiDate,
                GstinCertiPath, gstinCertDate,
                PanCardPath, panCardDate,
                TanCertiPath, tanCertDate,
                IsoCertiPath, isoCertDate,
                GmpCertiPath, gmpCertDate,
                FdaApprovalPath, fdaApprovalDate,
                BisApprovalPath, bisApprovalDate,
                DeclAuthenticityPath, declAuthenticityDate,
                CancelledChequePath, cancelledChequeDate,
                PfRegistrationPath, pfRegistrationDate,
                EsicRegistrationPath, esicRegistrationDate,
                businessRegNo, gstCertificateNo, panCardNo, cancelledChequeNo,
                pfRegistrationNo, esicRegistrationNo, declAuthenticityNo,
                tanCertificateNo, isoCertificateNo, gmpCertificateNo, fdaApprovalNo, bisApprovalNo
            ];
            db.query(insertSql, insertParams, (err2) => {
                if (err2) {
                    console.error('Error inserting compliancedoc:', err2);
                    return res.status(500).json({ error: 'Database insert error into compliancedoc' });
                }
                proceedWithStatus();
            });
        }
    });
};


//add product


const addProDb = (req, res) => {
    // Access userId from the session
    // const userId = req.session.userId;
    // if (!userId) {
    //     return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    // }

    // const { productId, productDes, productCategory, minQty, maxQty, availableQty, packingOpts, unit, unitPri, curr} = req.body;

    // const sql = 'INSERT INTO addproduct (UserId, ProductId, ProductDescri, ProductCategory, MinOrdQty, MaxOrdQty, AvailableQty, PackOption, Weight, UnitPrice, Curr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    // db.query(sql, [userId, productId, productDes, productCategory, minQty, maxQty, availableQty, packingOpts, unit, unitPri, curr], (err2, result2) => {
    //     if (err2) {
    //         console.error('Error inserting data into addproduct:', err2);
    //         return res.status(500).json({ error: 'Database insert error into addproduct' });
    //     }
    //     res.status(200).json({ message: 'Product data saved successfully' });
    // });

    // Access userId from the session
    const userId = req.session.userId;

    var ProductImg1 = null; // default if no file
    var imageFile = null

    var uploadPath = null

    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }

    console.log('req=== is', req)
    console.log("res=== is", req.body)

    const { productId, productDescription, productCategory, minOrderQuantity, maxOrderQuantity, availableQuantity, packingOptions, measurementUnit, unitPrice, currency } = req.body;


    if (req.files && req.files.addUploadProductImg) {

        imageFile = req.files.addUploadProductImg;



        const ext = path.extname(imageFile.name); // e.g. ".jpg"

        const nameWithoutExt = path.basename(imageFile.name, ext);

        // Generate timestamp

        const now = new Date();

        const dateTimeStr = now.getFullYear() +

            ("0" + (now.getMonth() + 1)).slice(-2) +

            ("0" + now.getDate()).slice(-2) + "-" +

            ("0" + now.getHours()).slice(-2) +

            ("0" + now.getMinutes()).slice(-2) +

            ("0" + now.getSeconds()).slice(-2);



        ProductImg1 = `${userId}-${dateTimeStr}${ext}`;



        uploadPath = path.join(__dirname, 'uploads', ProductImg1);



    }
    console.log("ProductImg===", ProductImg1);

    const sql = 'INSERT INTO registerproducts (UserId, ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency, UploadProductImg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, productId, productDescription, productCategory, minOrderQuantity, maxOrderQuantity, availableQuantity, packingOptions, measurementUnit, unitPrice, currency, ProductImg1], (err2, result2) => {
        if (err2) {
            console.error('Error inserting data into registerproducts:', err2);
            return res.status(500).json({ error: 'Database insert error into registerproducts' });
        }

        const sendResponse = () => {
            return res.status(200).json({ message: 'Product data saved successfully' });
        };

        if (ProductImg1 != null) {
            imageFile.mv(uploadPath, function (err) {
                if (err) {
                    console.error("File move error:", err);
                    return res.status(500).json({ error: "File upload failed" });
                }
                sendResponse();
            });
        } else {
            sendResponse();
        }
    });
};


// const addProDb = (req, res) => {
//     // Access userId from the session
//     // const userId = req.session.userId;
//     // if (!userId) {
//     //     return res.status(400).json({ error: 'UserId is missing, please create a user first' });
//     // }

//     // const { productId, productDes, productCategory, minQty, maxQty, availableQty, packingOpts, unit, unitPri, curr} = req.body;

//     // const sql = 'INSERT INTO addproduct (UserId, ProductId, ProductDescri, ProductCategory, MinOrdQty, MaxOrdQty, AvailableQty, PackOption, Weight, UnitPrice, Curr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
//     // db.query(sql, [userId, productId, productDes, productCategory, minQty, maxQty, availableQty, packingOpts, unit, unitPri, curr], (err2, result2) => {
//     //     if (err2) {
//     //         console.error('Error inserting data into addproduct:', err2);
//     //         return res.status(500).json({ error: 'Database insert error into addproduct' });
//     //     }
//     //     res.status(200).json({ message: 'Product data saved successfully' });
//     // });

//     // Access userId from the session
//     const userId = req.session.userId;
//     if (!userId) {
//         return res.status(400).json({ error: 'UserId is missing, please create a user first' });
//     }

//     const { productId, productDes, productCategory, minQty, maxQty, availableQty, packingOpts, unit, unitPri, curr, addUploadProductImg } = req.body;

//     const sql = 'INSERT INTO registerproducts (UserId, ProductId, ProductDesc, ProductCate, MinOrdQty, MaxOrdQty, AvailableQty, PackOpt, Kg, UnitPrice, Currency, UploadProductImg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
//     db.query(sql, [userId, productId, productDes, productCategory, minQty, maxQty, availableQty, packingOpts, unit, unitPri, curr, addUploadProductImg], (err2, result2) => {
//         if (err2) {
//             console.error('Error inserting data into registerproducts:', err2);
//             return res.status(500).json({ error: 'Database insert error into registerproducts' });
//         }
//         res.status(200).json({ message: 'Product data saved successfully' });
//     });
// };


const getProductCategory = (req, res) => {
    const sql = 'select * from productcategorymaster';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting data: productcategorymaster', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const getProductPacking = (req, res) => {
    const sql = 'select * from productPackingMaster';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting  data: productPackingMaster', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const getMeasurementUnit = (req, res) => {
    const sql = 'select * from measurementunitmaster';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting  data: measurementUnit', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const getCurrency = (req, res) => {
    const sql = 'select * from currencymaster';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting  data: Currency', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const getCountryOfOperation = (req, res) => {
    // const sql = 'select * from countriesofoperationmaster';
    const sql = 'SELECT CountryCode as srno, CountryName as description FROM countries ORDER BY CountryName ASC';

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting  data: Countries', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const getStates = (req, res) => {
    const countryId = req.body.countryId; // Get countryId from the request body
    console.log(countryId);

    // const sql = 'SELECT * FROM statesmaster WHERE CountryId = ? ORDER BY description ASC';
    const sql = 'SELECT StateCode as srno, StateName as description FROM states WHERE CountryCode = ? ORDER BY StateName ASC';
    db.query(sql, [countryId], (err, result) => {
        if (err) {
            console.error('Error selecting data: States', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        res.status(200).json(result);
    });
};

const getcities = (req, res) => {
    const districtId = req.body.districtId;
    console.log(districtId);

    // Filter cities from districts table using DistrictCode since cities table lacks a district mapping
    const sql = 'SELECT DISTINCT CityCode as srno, CityName as description FROM cities WHERE DistrictCode = ? ORDER BY CityName ASC';
    db.query(sql, [districtId], (err, result) => {
        if (err) {
            console.error('Error selecting data: States', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        res.status(200).json(result);
    });
};


const getdistricts = (req, res) => {
    const stateId = req.body.stateId;
    console.log(stateId);

    const sql = 'SELECT DISTINCT DistrictCode as srno, DistrictName as description FROM districts WHERE StateCode = ? ORDER BY DistrictName ASC';
    db.query(sql, [stateId], (err, result) => {
        if (err) {
            console.error('Error selecting data: States', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        res.status(200).json(result);
    });
};




const getDeliveryMode = (req, res) => {
    const sql = 'select * from deliverymodemaster';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting  data: Delivery Modes', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const getDeliveryPartners = (req, res) => {
    const sql = 'select * from deliverypartnersmaster';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error selecting  data: Delivery Partners', err);
            return res.status(500).json({ error: 'Issue at Database' });
        }
        //  const newUserId = result.insertId; // Yeh ID return karo
        //  req.session.userId = result.insertId;
        res.status(200).json(result);
    });
};

const RegistrationStatus = (req, res) => {
    const userId = req.session.userId; // Make sure this is set when the user logs in

    const sql = `
        SELECT 
            cu.UserId,
            CASE WHEN cu.UserId IS NOT NULL THEN 1 ELSE 0 END AS create_user_id,
            CASE WHEN rc.UserId IS NOT NULL THEN 1 ELSE 0 END AS register_company,
            CASE WHEN ve.UserId IS NOT NULL THEN 1 ELSE 0 END AS verify_email,
            CASE WHEN rp.UserId IS NOT NULL THEN 1 ELSE 0 END AS register_products,
            CASE WHEN dl.UserId IS NOT NULL THEN 1 ELSE 0 END AS areas_of_operation,
            CASE WHEN pi.UserId IS NOT NULL THEN 1 ELSE 0 END AS payment_preferences,
            CASE WHEN cd.UserId IS NOT NULL THEN 1 ELSE 0 END AS compliance
        FROM onboarding_users cu
        LEFT JOIN registercompany rc ON cu.UserId = rc.UserId
        LEFT JOIN verifyemail ve ON cu.UserId = ve.UserId
        LEFT JOIN registerproducts rp ON cu.UserId = rp.UserId
        LEFT JOIN deliverylocations dl ON cu.UserId = dl.UserId
        LEFT JOIN paymentinfo pi ON cu.UserId = pi.UserId
        LEFT JOIN compliancedoc cd ON cu.UserId = cd.UserId
        WHERE cu.UserId = ?`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({ error: 'DB error' });
        }

        if (!results.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send only the status object
        res.json({
            create_user_id: results[0].create_user_id,
            register_company: results[0].register_company,
            verify_email: results[0].verify_email,
            register_products: results[0].register_products,
            areas_of_operation: results[0].areas_of_operation,
            payment_preferences: results[0].payment_preferences,
            compliance: results[0].compliance
        });
    });
};



const allRegistrationStatus = (req, res) => {

    const userId = req.body.userId || req.session.userId;
    if (userId) {
        req.session.userId = userId;
    }

    console.log("allRegistrationStatus userId:", userId);

    if (!userId) {
        return res.json({
            isUserCreated: 0,
            isCompanyRegister: 0,
            isEmailVerified: 0,
            isProductRegisterd: 0,
            isAreaOperationDone: 0,
            isPaymenetReferenceDone: 0,
            isComplienceDocumentDone: 0,
        });
    }

    const selectSql = 'SELECT * FROM allRegistrationStatus WHERE UserId = ?';
    db.query(selectSql, [userId], (err, results) => {
        if (err) {
            console.error("Error querying allRegistrationStatus table:", err);
            return res.status(500).json({ error: 'DB error' });
        }

        if (results.length > 0) {
            const row = results[0];
            const status = {
                isUserCreated: row.isUserCreated ? 1 : 0,
                isCompanyRegister: row.isCompanyRegister ? 1 : 0,
                isEmailVerified: row.isEmailVerified ? 1 : 0,
                isProductRegisterd: row.isProductRegisterd ? 1 : 0,
                isAreaOperationDone: row.isAreaOperationDone ? 1 : 0,
                isPaymenetReferenceDone: row.isPaymenetReferenceDone ? 1 : 0,
                isComplienceDocumentDone: row.isComplienceDocumentDone ? 1 : 0
            };
            console.log("allRegistrationStatus result:", status);
            return res.json(status);
        } else {
            // If the row doesn't exist, let's insert it and return defaults
            const insertSql = 'INSERT INTO allRegistrationStatus (UserId, isUserCreated, isCompanyRegister, isEmailVerified, isProductRegisterd, isAreaOperationDone, isPaymenetReferenceDone, isComplienceDocumentDone) VALUES (?, 1, 0, 0, 0, 0, 0, 0)';
            db.query(insertSql, [userId], (insertErr) => {
                if (insertErr) {
                    console.error("Error inserting default allRegistrationStatus:", insertErr);
                }
                const status = {
                    isUserCreated: 1,
                    isCompanyRegister: 0,
                    isEmailVerified: 0,
                    isProductRegisterd: 0,
                    isAreaOperationDone: 0,
                    isPaymenetReferenceDone: 0,
                    isComplienceDocumentDone: 0
                };
                console.log("allRegistrationStatus result (new insert):", status);
                return res.json(status);
            });
        }
    });
};









const getOnboardingUsersList = (req, res) => {
    const sql = 'SELECT * FROM onboarding_users WHERE ApprovalStatus IN (0, 3) ORDER BY UserId DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error selecting from onboarding_users:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json({ value: results });
    });
};

const getCompletedSuppliers = (req, res) => {
    const sql = `
        SELECT 
            ou.UserId, ou.EmailId, ou.PanNo, ou.GstnNo as GstNo, ou.SupplierCode, ou.SupplierName,
            rc.CompanyName as companyName,
            ou.OnboardingCompleted
        FROM onboarding_users ou
        LEFT JOIN registercompany rc ON ou.UserId = rc.UserId
        WHERE ou.OnboardingCompleted = '1'
        ORDER BY ou.UserId DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching completed suppliers:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json({ value: results });
    });
};

const rejectOnboardingUser = (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    const sqlUpdateUser = 'UPDATE onboarding_users SET IsEmailVerified = 0, ApprovalStatus = 2 WHERE UserId = ?';
    db.query(sqlUpdateUser, [userId], (err, result) => {
        if (err) {
            console.error('Error rejecting onboarding user:', err);
            return res.status(500).json({ error: 'Database update error' });
        }

        const sqlUpdateReg = 'UPDATE registrationprocess SET isEmailVerified = false WHERE newuserid = ?';
        db.query(sqlUpdateReg, [userId], (err) => {
            if (err) {
                console.error('Error updating registrationprocess on reject:', err);
            }
        });

        res.status(200).json({ success: true, message: 'User rejected successfully' });
    });
};

const approveOnboardingUser = (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    // Dynamically resolve frontend URL/IP based on request headers (supporting both localhost and network IP)
    let frontendUrl = 'http://localhost:3000';
    if (req.headers.referer) {
        try {
            const refUrl = new URL(req.headers.referer);
            frontendUrl = refUrl.origin;
        } catch (e) {
            console.error('Error parsing referer URL:', e);
        }
    } else if (req.headers['x-forwarded-host']) {
        const proto = req.headers['x-forwarded-proto'] || 'http';
        frontendUrl = `${proto}://${req.headers['x-forwarded-host']}`;
    }

    // First fetch onboarding user details (Email and PAN) to include in approval link
    const sqlFetch = 'SELECT EmailId, PanNo FROM onboarding_users WHERE UserId = ? LIMIT 1';
    db.query(sqlFetch, [userId], (fetchErr, results) => {
        if (fetchErr) {
            console.error('Error fetching onboarding user details:', fetchErr);
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Onboarding user not found' });
        }

        const email = results[0].EmailId;
        const pan = results[0].PanNo;

        const sqlUpdateUser = 'UPDATE onboarding_users SET ApprovalStatus = 1 WHERE UserId = ?';
        db.query(sqlUpdateUser, [userId], (err, result) => {
            if (err) {
                console.error('Error approving onboarding user:', err);
                return res.status(500).json({ error: 'Database update error' });
            }

            // Construct and send email notification
            const mailOptions = {
                from: '"CTPL" <spadmin@castaliaz.in>',
                to: email,
                subject: "Supplier Portal Registration Approved",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #4f46e5; margin-bottom: 20px;">Supplier Registration Approved</h2>
                        <p>Dear Supplier,</p>
                        <p>Your user registration request for Nexus Supplier Portal has been approved by the administrator.</p>
                        <p>You can now proceed to fill in the other pending details form (Company profile, Areas of operation, Bank details, and Compliance documents) to complete your onboarding process.</p>
                        <div style="margin: 25px 0;">
                            <a href="${frontendUrl}/onboarding?email=${encodeURIComponent(email)}&pan=${encodeURIComponent(pan)}&userId=${userId}" 
                               style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                               Complete Onboarding Details
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste the following link into your browser:</p>
                        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">
                            ${frontendUrl}/onboarding?email=${encodeURIComponent(email)}&pan=${encodeURIComponent(pan)}&userId=${userId}
                        </p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8;">This is an automated system email. Please do not reply directly to this mail.</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error('Error sending approval email:', mailErr);
                    // Still return success: true since update was successful in DB
                    return res.status(200).json({
                        success: true,
                        message: 'User approved successfully, but email notification failed to send.',
                        emailError: mailErr.message
                    });
                }
                console.log('Approval email sent to ' + email + ':', info.response);
                res.status(200).json({ success: true, message: 'User approved successfully and notification email sent.' });
            });
        });
    });
};

const checkOnboardingStatus = (req, res) => {
    const { email, panNo } = req.body;
    if (!email || !panNo) {
        return res.status(400).json({ error: 'Email and PAN Number are required' });
    }

    const sql = 'SELECT UserId, ApprovalStatus FROM onboarding_users WHERE EmailId = ? AND PanNo = ? ORDER BY UserId DESC LIMIT 1';
    db.query(sql, [email, panNo], (err, results) => {
        if (err) {
            console.error('Error checking onboarding status:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No registration found' });
        }

        req.session.userId = results[0].UserId; // Set session userId to handle onboarding state
        console.log("Setting req.session.userId during checkOnboardingStatus:", req.session.userId);

        res.status(200).json({
            success: true,
            userId: results[0].UserId,
            approvalStatus: results[0].ApprovalStatus
        });
    });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const getCompanyDetails = (req, res) => {
    const userId = req.query.userId || req.body.userId || req.session.userId;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }
    const sql = 'SELECT * FROM registercompany WHERE UserId = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching registercompany:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json(results[0] || null);
    });
};

const getDeliveryLocations = (req, res) => {
    const userId = req.query.userId || req.body.userId || req.session.userId;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }
    const sql = 'SELECT * FROM deliverylocations WHERE UserId = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching deliverylocations:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json(results[0] || null);
    });
};

const getPaymentInfo = (req, res) => {
    const userId = req.query.userId || req.body.userId || req.session.userId;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }
    const sql = 'SELECT * FROM paymentinfo WHERE UserId = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching paymentinfo:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json(results || []);
    });
};

const getComplianceDoc = (req, res) => {
    const userId = req.query.userId || req.body.userId || req.session.userId;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is missing, please create a user first' });
    }
    const sql = 'SELECT * FROM compliancedoc WHERE UserId = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching compliancedoc:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        res.status(200).json(results[0] || null);
    });
};

const getProductCatalogue = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { Product, ProductType, ProductGroup } = req.query;
    let sql = 'SELECT * FROM ProductMaster';
    const params = [];
    const conditions = [];

    if (Product) {
        conditions.push('SAPMaterialSKU LIKE ?');
        params.push(`%${Product}%`);
    }
    if (ProductType) {
        conditions.push('MaterialType LIKE ?');
        params.push(`%${ProductType}%`);
    }
    if (ProductGroup) {
        conditions.push('(VendorProductDescription LIKE ? OR SAPProductDescription LIKE ?)');
        params.push(`%Group: ${ProductGroup}%`, `%${ProductGroup}%`);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY CreatedAt DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching ProductMaster:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.status(200).json(results);
    });
};

const addProductCatalogue = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const {
        sapMaterialSku,
        sapProductDescription,
        materialType,
        vendorProductName,
        vendorProductDescription,
        unit,
        price,
        productSpecification
    } = req.body;

    let imageFileName = null;
    let uploadPath = null;
    let imageFile = null;

    if (req.files && req.files.image) {
        imageFile = req.files.image;
        const ext = path.extname(imageFile.name);
        const timestamp = Date.now();
        imageFileName = `prod-${sapMaterialSku || 'sku'}-${timestamp}${ext}`;
        uploadPath = path.join(__dirname, 'uploads', imageFileName);
    }

    const sql = `
        INSERT INTO ProductMaster (
            SAPMaterialSKU, SAPProductDescription, MaterialType,
            VendorProductName, VendorProductDescription, Unit, Price,
            Image, ProductSpecification
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        sapMaterialSku,
        sapProductDescription,
        materialType,
        vendorProductName,
        vendorProductDescription,
        unit,
        parseFloat(price) || 0,
        imageFileName ? `/uploads/${imageFileName}` : null,
        productSpecification
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error inserting into ProductMaster:', err);
            return res.status(500).json({ error: 'Database insert failed' });
        }

        if (imageFileName && imageFile) {
            imageFile.mv(uploadPath, (mvErr) => {
                if (mvErr) {
                    console.error('Error saving uploaded product image:', mvErr);
                }
                res.status(200).json({ success: true, message: 'Product added successfully' });
            });
        } else {
            res.status(200).json({ success: true, message: 'Product added successfully' });
        }
    });
};

const updateProductCatalogue = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const {
        sapMaterialSku,
        sapProductDescription,
        materialType,
        vendorProductName,
        vendorProductDescription,
        unit,
        price,
        productSpecification
    } = req.body;

    let imageFileName = null;
    let uploadPath = null;
    let imageFile = null;

    if (req.files && req.files.image) {
        imageFile = req.files.image;
        const ext = path.extname(imageFile.name);
        const timestamp = Date.now();
        imageFileName = `prod-${sapMaterialSku || 'sku'}-${timestamp}${ext}`;
        uploadPath = path.join(__dirname, 'uploads', imageFileName);
    }

    let sql = `
        UPDATE ProductMaster SET 
            SAPProductDescription = ?, MaterialType = ?, VendorProductName = ?,
            VendorProductDescription = ?, Unit = ?, Price = ?, ProductSpecification = ?
    `;
    const params = [
        sapProductDescription,
        materialType,
        vendorProductName,
        vendorProductDescription,
        unit,
        parseFloat(price) || 0,
        productSpecification
    ];

    if (imageFileName) {
        sql += `, Image = ?`;
        params.push(`/uploads/${imageFileName}`);
    }

    sql += ` WHERE SAPMaterialSKU = ?`;
    params.push(sapMaterialSku);

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error updating ProductMaster:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }

        if (imageFileName && imageFile) {
            imageFile.mv(uploadPath, (mvErr) => {
                if (mvErr) {
                    console.error('Error saving updated product image:', mvErr);
                }
                res.status(200).json({ success: true, message: 'Product updated successfully' });
            });
        } else {
            res.status(200).json({ success: true, message: 'Product updated successfully' });
        }
    });
};

const deleteProductCatalogue = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { sapMaterialSku } = req.body;
    if (!sapMaterialSku) {
        return res.status(400).json({ error: 'SAPMaterialSKU is required' });
    }

    const sql = 'DELETE FROM ProductMaster WHERE SAPMaterialSKU = ?';
    db.query(sql, [sapMaterialSku], (err, result) => {
        if (err) {
            console.error('Error deleting from ProductMaster:', err);
            return res.status(500).json({ error: 'Database delete failed' });
        }
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    });
};

const registerSupplierProduct = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;
    const {
        productId,
        supplierProductCode,
        unitPrice,
        currency,
        moq,
        leadTime,
        packagingDetails,
        shape
    } = req.body;

    let datasheetFileName = null;
    let uploadPath = null;
    let datasheetFile = null;

    if (req.files && req.files.datasheet) {
        datasheetFile = req.files.datasheet;
        const ext = path.extname(datasheetFile.name);
        const timestamp = Date.now();
        datasheetFileName = `sheet-${supplierId}-${productId || 'prod'}-${timestamp}${ext}`;
        uploadPath = path.join(__dirname, 'uploads', datasheetFileName);
    }

    const mappingSql = `
        INSERT INTO supplier_product_mapping (
            Supplier_ID, Product_ID, Supplier_Product_Code,
            Product_Approval_Status, Packaging_Details, Technical_Datasheet, Shape
        ) VALUES (?, ?, ?, 'Submitted', ?, ?, ?)
    `;

    const mappingParams = [
        supplierId,
        productId,
        supplierProductCode,
        packagingDetails,
        datasheetFileName ? `/uploads/${datasheetFileName}` : null,
        shape
    ];

    db.query(mappingSql, mappingParams, (err, mappingResult) => {
        if (err) {
            console.error('Error inserting supplier product mapping:', err);
            return res.status(500).json({ error: 'Database mapping insert failed' });
        }

        const mappingId = mappingResult.insertId;

        const priceSql = `
            INSERT INTO supplier_product_price (
                Mapping_ID, Unit_Price, Currency, MOQ, Lead_Time, Price_Approval_Status
            ) VALUES (?, ?, ?, ?, ?, 'Pending Price Approval')
        `;

        const priceParams = [
            mappingId,
            parseFloat(unitPrice) || 0,
            currency || 'INR',
            parseFloat(moq) || 0,
            parseInt(leadTime) || 0
        ];

        db.query(priceSql, priceParams, (priceErr) => {
            if (priceErr) {
                console.error('Error inserting supplier product price:', priceErr);
                return res.status(500).json({ error: 'Database pricing insert failed' });
            }

            if (datasheetFileName && datasheetFile) {
                datasheetFile.mv(uploadPath, (mvErr) => {
                    if (mvErr) {
                        console.error('Error saving uploaded datasheet file:', mvErr);
                    }
                    res.status(200).json({ success: true, message: 'Supplier product registered successfully' });
                });
            } else {
                res.status(200).json({ success: true, message: 'Supplier product registered successfully' });
            }
        });
    });
};

const getSupplierMappings = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;
    const isSupplier = req.session.role !== 'Admin';

    let sql = `
        SELECT m.*, p.Price_ID, p.Unit_Price, p.Currency, p.MOQ, p.Lead_Time, p.Price_Approval_Status,
               pm.SAPProductDescription, pm.MaterialType, pm.Unit, pm.Image, pm.ProductSpecification
        FROM supplier_product_mapping m
        JOIN supplier_product_price p ON m.Mapping_ID = p.Mapping_ID
        JOIN ProductMaster pm ON m.Product_ID = pm.SAPMaterialSKU
    `;
    const params = [];

    if (isSupplier) {
        sql += ` WHERE m.Supplier_ID = ?`;
        params.push(supplierId);
    }
    sql += ` ORDER BY m.CreatedAt DESC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching supplier product mappings:', err);
            return res.status(500).json({ error: 'Database select failed' });
        }
        res.status(200).json(results);
    });
};

const proposeNewProduct = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;
    const {
        productName,
        description,
        category,
        specifications,
        initialPrice
    } = req.body;

    let imageFileName = null;
    let datasheetFileName = null;
    let imageFile = null;
    let datasheetFile = null;
    const timestamp = Date.now();

    if (req.files) {
        if (req.files.image) {
            imageFile = req.files.image;
            const ext = path.extname(imageFile.name);
            imageFileName = `prop-img-${supplierId}-${timestamp}${ext}`;
            imageFile.mv(path.join(__dirname, 'uploads', imageFileName), (err) => {
                if (err) console.error('Error saving proposal image:', err);
            });
        }
        if (req.files.datasheet) {
            datasheetFile = req.files.datasheet;
            const ext = path.extname(datasheetFile.name);
            datasheetFileName = `prop-sheet-${supplierId}-${timestamp}${ext}`;
            datasheetFile.mv(path.join(__dirname, 'uploads', datasheetFileName), (err) => {
                if (err) console.error('Error saving proposal datasheet:', err);
            });
        }
    }

    const sql = `
        INSERT INTO product_proposals (
            Supplier_ID, Product_Name, Description, Category,
            Specifications, Image_URL, Datasheet_URL, Initial_Price, Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `;

    const params = [
        supplierId,
        productName,
        description,
        category,
        specifications,
        imageFileName ? `/uploads/${imageFileName}` : null,
        datasheetFileName ? `/uploads/${datasheetFileName}` : null,
        parseFloat(initialPrice) || 0
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error creating product proposal:', err);
            return res.status(500).json({ error: 'Database insert failed' });
        }
        res.status(200).json({ success: true, message: 'Proposal submitted successfully' });
    });
};

const getSupplierProposals = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;
    const isSupplier = req.session.role !== 'Admin';

    let sql = `SELECT * FROM product_proposals`;
    const params = [];

    if (isSupplier) {
        sql += ` WHERE Supplier_ID = ?`;
        params.push(supplierId);
    }
    sql += ` ORDER BY CreatedAt DESC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching proposals:', err);
            return res.status(500).json({ error: 'Database select failed' });
        }
        res.status(200).json(results);
    });
};

const getAdminPendingApprovals = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const sql = `
        SELECT m.*, p.Price_ID, p.Unit_Price, p.Currency, p.MOQ, p.Lead_Time, p.Price_Approval_Status,
               pm.SAPProductDescription, pm.MaterialType, pm.Unit, pm.Image, pm.ProductSpecification
        FROM supplier_product_mapping m
        JOIN supplier_product_price p ON m.Mapping_ID = p.Mapping_ID
        JOIN ProductMaster pm ON m.Product_ID = pm.SAPMaterialSKU
        ORDER BY m.CreatedAt DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching admin pending approvals:', err);
            return res.status(500).json({ error: 'Database select failed' });
        }
        res.status(200).json(results);
    });
};

const approveProductMapping = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { mappingId, status } = req.body;
    if (!mappingId || !status) {
        return res.status(400).json({ error: 'mappingId and status are required' });
    }

    const sql = `UPDATE supplier_product_mapping SET Product_Approval_Status = ? WHERE Mapping_ID = ?`;
    db.query(sql, [status, mappingId], (err, result) => {
        if (err) {
            console.error('Error approving product mapping:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }
        res.status(200).json({ success: true, message: `Product approval status updated to ${status}` });
    });
};

const approveProductPrice = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { priceId, status } = req.body;
    if (!priceId || !status) {
        return res.status(400).json({ error: 'priceId and status are required' });
    }

    const sql = `UPDATE supplier_product_price SET Price_Approval_Status = ? WHERE Price_ID = ?`;
    db.query(sql, [status, priceId], (err, result) => {
        if (err) {
            console.error('Error approving product price:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }
        res.status(200).json({ success: true, message: `Price approval status updated to ${status}` });
    });
};

const getAdminProposals = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const sql = `SELECT * FROM product_proposals ORDER BY CreatedAt DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching admin proposals:', err);
            return res.status(500).json({ error: 'Database select failed' });
        }
        res.status(200).json(results);
    });
};

const reviewProposal = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { proposalId, status } = req.body;
    if (!proposalId || !status) {
        return res.status(400).json({ error: 'proposalId and status are required' });
    }

    const updateProposalSql = `UPDATE product_proposals SET Status = ? WHERE Proposal_ID = ?`;
    db.query(updateProposalSql, [status, proposalId], (err, result) => {
        if (err) {
            console.error('Error reviewing proposal:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }

        if (status === 'Approved') {
            // Find proposal details to insert into ProductMaster and create supplier mapping
            const getProposalSql = `SELECT * FROM product_proposals WHERE Proposal_ID = ?`;
            db.query(getProposalSql, [proposalId], (err2, proposals) => {
                if (err2 || proposals.length === 0) {
                    console.error('Error getting approved proposal details:', err2);
                    return res.status(200).json({ success: true, message: 'Proposal status updated but product mapping could not be completed.' });
                }

                const prop = proposals[0];
                const newSku = `PROP-${prop.Proposal_ID}`;

                // Insert into ProductMaster
                const productSql = `
                    INSERT INTO ProductMaster (
                        SAPMaterialSKU, SAPProductDescription, MaterialType,
                        VendorProductName, VendorProductDescription, Unit, Price,
                        Image, ProductSpecification
                    ) VALUES (?, ?, ?, ?, ?, 'EA', ?, ?, ?)
                `;
                const productParams = [
                    newSku,
                    prop.Product_Name,
                    prop.Category || 'ROH',
                    prop.Product_Name,
                    prop.Description,
                    prop.Initial_Price || 0,
                    prop.Image_URL,
                    prop.Specifications
                ];

                db.query(productSql, productParams, (productErr) => {
                    if (productErr) {
                        console.error('Error inserting proposed product to ProductMaster:', productErr);
                    }

                    // Create Supplier mapping and price
                    const mapSql = `
                        INSERT INTO supplier_product_mapping (
                            Supplier_ID, Product_ID, Supplier_Product_Code,
                            Product_Approval_Status, Packaging_Details, Technical_Datasheet, Shape
                        ) VALUES (?, ?, ?, 'Approved', 'Standard', ?, 'Default')
                    `;
                    const mapParams = [prop.Supplier_ID, newSku, newSku, prop.Datasheet_URL];

                    db.query(mapSql, mapParams, (mapErr, mapResult) => {
                        if (mapErr) {
                            console.error('Error inserting supplier mapping for proposal:', mapErr);
                            return res.status(200).json({ success: true, message: 'Proposal approved but mapping failed.' });
                        }

                        const mappingId = mapResult.insertId;
                        const priceSql = `
                            INSERT INTO supplier_product_price (
                                Mapping_ID, Unit_Price, Currency, MOQ, Lead_Time, Price_Approval_Status
                            ) VALUES (?, ?, 'INR', 1, 7, 'Price Approved')
                        `;
                        db.query(priceSql, [mappingId, prop.Initial_Price], (priceErr) => {
                            if (priceErr) console.error('Error inserting price for proposal mapping:', priceErr);
                        });
                    });
                });
            });
        }

        res.status(200).json({ success: true, message: `Proposal status updated to ${status}` });
    });
};

const createContract = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const {
        contractNumber,
        contractType,
        supplierId,
        productId,
        validityFrom,
        validityTo,
        agreedPrice,
        targetQuantity,
        targetValue
    } = req.body;

    if (!contractNumber || !contractType || !supplierId || !productId || !validityFrom || !validityTo || !agreedPrice) {
        return res.status(400).json({ error: 'Missing required contract parameters.' });
    }

    const sql = `
        INSERT INTO product_contracts (
            Contract_Number, Contract_Type, Supplier_ID, Product_ID,
            Validity_From, Validity_To, Agreed_Price, Target_Quantity, Target_Value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        contractNumber,
        contractType,
        supplierId,
        productId,
        validityFrom,
        validityTo,
        parseFloat(agreedPrice) || 0,
        targetQuantity ? parseFloat(targetQuantity) : null,
        targetValue ? parseFloat(targetValue) : null
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error inserting contract:', err);
            return res.status(500).json({ error: 'Database insert failed' });
        }
        res.status(200).json({ success: true, message: 'Contract created successfully', contractId: result.insertId });
    });
};

const getContracts = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;
    const isSupplier = req.session.role !== 'Admin';

    let sql = `
        SELECT c.*, pm.SAPProductDescription, pm.Unit
        FROM product_contracts c
        JOIN ProductMaster pm ON c.Product_ID = pm.SAPMaterialSKU
    `;
    const params = [];

    if (isSupplier) {
        sql += ` WHERE c.Supplier_ID = ?`;
        params.push(supplierId);
    }
    sql += ` ORDER BY c.CreatedAt DESC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching contracts:', err);
            return res.status(500).json({ error: 'Database select failed' });
        }
        res.status(200).json(results);
    });
};

const bulkUploadProductMaster = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty products list.' });
    }

    const sql = `
        INSERT INTO ProductMaster (
            SAPMaterialSKU, SAPProductDescription, MaterialType,
            VendorProductName, VendorProductDescription, Unit, Price, ProductSpecification
        ) VALUES ?
        ON DUPLICATE KEY UPDATE
            SAPProductDescription = VALUES(SAPProductDescription),
            MaterialType = VALUES(MaterialType),
            VendorProductName = VALUES(VendorProductName),
            VendorProductDescription = VALUES(VendorProductDescription),
            Unit = VALUES(Unit),
            Price = VALUES(Price),
            ProductSpecification = VALUES(ProductSpecification)
    `;

    const values = products.map(p => [
        p.SAPMaterialSKU,
        p.SAPProductDescription,
        p.MaterialType || 'ROH',
        p.VendorProductName,
        p.VendorProductDescription || null,
        p.Unit || 'EA',
        parseFloat(p.Price) || 0,
        p.ProductSpecification || null
    ]);

    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error('Error in bulkUploadProductMaster:', err);
            return res.status(500).json({ error: 'Database bulk insert failed' });
        }
        res.status(200).json({ success: true, message: `Successfully loaded/updated ${result.affectedRows} product master items.` });
    });
};

const bulkUploadSupplierMappings = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;
    const { mappings } = req.body;
    if (!Array.isArray(mappings) || mappings.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty mappings list.' });
    }

    let insertedCount = 0;
    let errors = [];

    const processMapping = (index) => {
        if (index >= mappings.length) {
            if (errors.length > 0 && insertedCount === 0) {
                return res.status(500).json({ error: 'All bulk mapping inserts failed.', details: errors });
            }
            return res.status(200).json({
                success: true,
                message: `Successfully loaded ${insertedCount} mappings.`,
                errors: errors.length > 0 ? errors : null
            });
        }

        const m = mappings[index];
        if (!m.SAPMaterialSKU) {
            errors.push(`Row ${index + 1}: Missing SAP Material SKU.`);
            return processMapping(index + 1);
        }

        // Check if SKU exists
        const checkSkuSql = 'SELECT 1 FROM ProductMaster WHERE SAPMaterialSKU = ?';
        db.query(checkSkuSql, [m.SAPMaterialSKU], (checkErr, checkResult) => {
            if (checkErr || checkResult.length === 0) {
                errors.push(`Row ${index + 1}: SKU ${m.SAPMaterialSKU} does not exist in Product Catalogue.`);
                return processMapping(index + 1);
            }

            // Insert mapping
            const mappingSql = `
                INSERT INTO supplier_product_mapping (
                    Supplier_ID, Product_ID, Supplier_Product_Code,
                    Product_Approval_Status, Packaging_Details, Shape
                ) VALUES (?, ?, ?, 'Submitted', ?, ?)
            `;
            const mappingParams = [
                supplierId,
                m.SAPMaterialSKU,
                m.SupplierProductCode || m.SAPMaterialSKU,
                m.PackagingDetails || 'Standard',
                m.Shape || 'Default'
            ];

            db.query(mappingSql, mappingParams, (mapErr, mapResult) => {
                if (mapErr) {
                    console.error(`Row ${index + 1} mapping insert err:`, mapErr);
                    errors.push(`Row ${index + 1}: Failed to insert mapping.`);
                    return processMapping(index + 1);
                }

                const mappingId = mapResult.insertId;
                const priceSql = `
                    INSERT INTO supplier_product_price (
                        Mapping_ID, Unit_Price, Currency, MOQ, Lead_Time, Price_Approval_Status
                    ) VALUES (?, ?, ?, ?, ?, 'Pending Price Approval')
                `;
                const priceParams = [
                    mappingId,
                    parseFloat(m.UnitPrice) || 0,
                    m.Currency || 'INR',
                    parseFloat(m.MOQ) || 1,
                    parseInt(m.LeadTime) || 7
                ];

                db.query(priceSql, priceParams, (priceErr) => {
                    if (priceErr) {
                        console.error(`Row ${index + 1} pricing insert err:`, priceErr);
                        errors.push(`Row ${index + 1}: Mapping created but pricing insertion failed.`);
                    } else {
                        insertedCount++;
                    }
                    processMapping(index + 1);
                });
            });
        });
    };

    processMapping(0);
};

const getProductCatalogueReport = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const sql = `
        SELECT pm.SAPMaterialSKU, pm.SAPProductDescription, pm.MaterialType, pm.Unit, pm.Price AS StdPrice,
               (SELECT COUNT(*) FROM supplier_product_mapping spm WHERE spm.Product_ID = pm.SAPMaterialSKU) AS SupplierCount,
               (SELECT MIN(spp.Unit_Price) FROM supplier_product_price spp 
                JOIN supplier_product_mapping spm ON spp.Mapping_ID = spm.Mapping_ID 
                WHERE spm.Product_ID = pm.SAPMaterialSKU AND spp.Price_Approval_Status = 'Price Approved') AS MinApprovedPrice,
               (SELECT MAX(spp.Unit_Price) FROM supplier_product_price spp 
                JOIN supplier_product_mapping spm ON spp.Mapping_ID = spm.Mapping_ID 
                WHERE spm.Product_ID = pm.SAPMaterialSKU AND spp.Price_Approval_Status = 'Price Approved') AS MaxApprovedPrice
        FROM ProductMaster pm
        ORDER BY pm.SAPMaterialSKU
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching Product Catalogue Report:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.status(200).json(results);
    });
};

const syncSapMaterials = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { Product, ProductType, ProductGroup } = req.body || req.query || {};

    let filters = [];
    if (Product) filters.push(`Product eq '${Product}'`);
    if (ProductType) filters.push(`ProductType eq '${ProductType}'`);
    if (ProductGroup) filters.push(`ProductGroup eq '${ProductGroup}'`);

    let filterUrl = '';
    if (filters.length > 0) {
        filterUrl = '&$filter=' + encodeURIComponent(filters.join(' and '));
    }

    const sapUrl = 'https://my401677.s4hana.cloud.sap/sap/opu/odata4/sap/zsb_material_master/srvd_a2x/sap/zsd_material_master/0001/ZMATERIAL_MASTER_CDS?sap-client=100' + filterUrl;
    const AuthorizationPrd = 'Basic Y3RwbGFiYXA6UGFzc3dvcmRAIzA5ODc2NTQzMjE=';
    const axios = require('axios');

    axios.get(sapUrl, {
        headers: {
            'Authorization': AuthorizationPrd,
            'Cookie': 'sap-usercontext=sap-client=100'
        }
    })
        .then(response => {
            const list = response.data.value;
            if (!Array.isArray(list) || list.length === 0) {
                return res.status(200).json({ success: true, message: 'No materials found matching search filters in SAP.', syncedCount: 0 });
            }

            const sql = `
            INSERT INTO ProductMaster (
                SAPMaterialSKU, SAPProductDescription, MaterialType,
                VendorProductName, VendorProductDescription, Unit, Price, ProductSpecification
            ) VALUES ?
            ON DUPLICATE KEY UPDATE
                SAPProductDescription = VALUES(SAPProductDescription),
                MaterialType = VALUES(MaterialType),
                VendorProductName = VALUES(VendorProductName),
                VendorProductDescription = VALUES(VendorProductDescription),
                Unit = VALUES(Unit),
                Price = VALUES(Price),
                ProductSpecification = VALUES(ProductSpecification)
        `;

            const values = list.map(item => [
                String(item.Product).trim(),
                `SAP Material ${item.Product}`,
                String(item.ProductType || 'SERV').trim(),
                `SAP Material ${item.Product}`,
                `Imported from SAP S/4HANA (Group: ${item.ProductGroup || ''})`,
                String(item.BaseUnit || 'EA').trim(),
                0.00,
                `Gross Weight: ${item.GrossWeight || 0} ${item.WeightUnit || 'KG'}, Net Weight: ${item.NetWeight || 0} ${item.WeightUnit || 'KG'}${item.IsMarkedForDeletion ? ' [Marked for Deletion]' : ''}`
            ]);

            db.query(sql, [values], (err, result) => {
                if (err) {
                    console.error('Error inserting SAP materials into ProductMaster:', err);
                    return res.status(500).json({ error: 'Database catalog sync failed' });
                }
                res.status(200).json({
                    success: true,
                    message: `Successfully synchronized ${list.length} materials from SAP.`,
                    syncedCount: list.length,
                    syncedItems: list
                });
            });
        })
        .catch(err => {
            console.error('Error fetching from SAP S/4HANA Material Master:', err.message);
            res.status(500).json({ error: 'SAP S/4HANA OData service error', details: err.message });
        });
};

const saveOdataProduct = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { Product, ProductType, ProductGroup, BaseUnit, GrossWeight, NetWeight, WeightUnit, IsMarkedForDeletion } = req.body;

    if (!Product) {
        return res.status(400).json({ error: 'Product SKU (SAPMaterialSKU) is required' });
    }

    const sql = `
        INSERT INTO ProductMaster (
            SAPMaterialSKU, SAPProductDescription, MaterialType,
            VendorProductName, VendorProductDescription, Unit, Price, ProductSpecification
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            SAPProductDescription = VALUES(SAPProductDescription),
            MaterialType = VALUES(MaterialType),
            VendorProductName = VALUES(VendorProductName),
            VendorProductDescription = VALUES(VendorProductDescription),
            Unit = VALUES(Unit),
            ProductSpecification = VALUES(ProductSpecification)
    `;

    const params = [
        String(Product).trim(),
        `SAP Material ${Product}`,
        String(ProductType || 'SERV').trim(),
        `SAP Material ${Product}`,
        `Imported from SAP S/4HANA (Group: ${ProductGroup || ''})`,
        String(BaseUnit || 'EA').trim(),
        0.00,
        `Gross Weight: ${GrossWeight || 0} ${WeightUnit || 'KG'}, Net Weight: ${NetWeight || 0} ${WeightUnit || 'KG'}${IsMarkedForDeletion ? ' [Marked for Deletion]' : ''}`
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error saving OData product to ProductMaster:', err);
            return res.status(500).json({ error: 'Database save failed' });
        }
        res.status(200).json({ success: true, message: 'Product saved successfully to database.' });
    });
};

const uploadProductEdits = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const supplierId = req.session.UserName;

    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const xlsx = require('xlsx');

    try {
        const workbook = xlsx.read(file.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = [];
        const errors = [];

        jsonData.forEach((row, index) => {
            const getVal = (keys) => {
                for (const key of keys) {
                    for (const rowKey of Object.keys(row)) {
                        if (rowKey.toLowerCase().trim().replace(/[\s_-]/g, '') === key.toLowerCase().replace(/[\s_-]/g, '')) {
                            return row[rowKey];
                        }
                    }
                }
                return null;
            };

            const sku = getVal(['SAPMaterialSKU', 'SAP Material SKU', 'SKU', 'Product', 'MaterialSKU']);
            const desc = getVal(['SAPProductDescription', 'SAP Product Description', 'Description', 'ProductDescription']);
            const type = getVal(['MaterialType', 'Material Type', 'Type', 'ProductType']);
            const vendorName = getVal(['VendorProductName', 'Vendor Product Name', 'Vendor Name', 'Name']);
            const vendorDesc = getVal(['VendorProductDescription', 'Vendor Product Description', 'Vendor Description']);
            const unit = getVal(['Unit', 'BaseUnit', 'Base Unit']);
            const price = getVal(['Price', 'UnitPrice', 'Unit Price']);
            const spec = getVal(['ProductSpecification', 'Product Specification', 'Specification', 'Specs']);

            if (!sku) {
                errors.push(`Row ${index + 2}: SKU (SAPMaterialSKU) is missing.`);
                return;
            }

            results.push([
                supplierId,
                String(sku).trim(),
                desc ? String(desc).trim() : `SAP Material ${sku}`,
                type ? String(type).trim() : 'SERV',
                vendorName ? String(vendorName).trim() : `SAP Material ${sku}`,
                vendorDesc ? String(vendorDesc).trim() : null,
                unit ? String(unit).trim() : 'EA',
                price !== null && price !== undefined ? parseFloat(price) : 0.00,
                spec ? String(spec).trim() : null,
                'Pending'
            ]);
        });

        if (errors.length > 0 && results.length === 0) {
            return res.status(400).json({ error: 'Failed to parse file rows', details: errors });
        }

        const sql = `
            INSERT INTO product_master_approvals (
                SupplierId, SAPMaterialSKU, SAPProductDescription, MaterialType,
                VendorProductName, VendorProductDescription, Unit, Price, ProductSpecification, Status
            ) VALUES ?
        `;

        db.query(sql, [results], (dbErr) => {
            if (dbErr) {
                console.error('Database insert into product_master_approvals failed:', dbErr);
                return res.status(500).json({ error: 'Database insertion failed' });
            }
            res.status(200).json({
                success: true,
                message: `Successfully uploaded ${results.length} edits for approval.`,
                errors: errors.length > 0 ? errors : null
            });
        });

    } catch (err) {
        console.error('Error parsing uploaded file:', err);
        res.status(500).json({ error: 'Failed to process file' });
    }
};

const getProductEditsApprovals = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const isSupplier = req.session.role !== 'Admin';
    const supplierId = req.session.UserName;

    let sql = 'SELECT * FROM product_master_approvals';
    const params = [];

    if (isSupplier) {
        sql += ' WHERE SupplierId = ?';
        params.push(supplierId);
    }
    sql += ' ORDER BY CreatedAt DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching product_master_approvals:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.status(200).json(results);
    });
};

const approveProductEdit = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'Approval ID is required' });
    }

    const fetchSql = 'SELECT * FROM product_master_approvals WHERE Id = ?';
    db.query(fetchSql, [id], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching approval item:', err);
            return res.status(404).json({ error: 'Approval request not found' });
        }

        const edit = results[0];
        if (edit.Status !== 'Pending') {
            return res.status(400).json({ error: 'Approval request is not pending' });
        }

        const updateMasterSql = `
            INSERT INTO supplier_info_record (
                SupplierId, SAPMaterialSKU, SAPProductDescription, MaterialType,
                VendorProductName, VendorProductDescription, Unit, Price, ProductSpecification
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                SAPProductDescription = VALUES(SAPProductDescription),
                MaterialType = VALUES(MaterialType),
                VendorProductName = VALUES(VendorProductName),
                VendorProductDescription = VALUES(VendorProductDescription),
                Unit = VALUES(Unit),
                Price = VALUES(Price),
                ProductSpecification = VALUES(ProductSpecification)
        `;

        const masterParams = [
            edit.SupplierId,
            edit.SAPMaterialSKU,
            edit.SAPProductDescription,
            edit.MaterialType,
            edit.VendorProductName,
            edit.VendorProductDescription,
            edit.Unit,
            edit.Price,
            edit.ProductSpecification
        ];

        db.query(updateMasterSql, masterParams, (masterErr) => {
            if (masterErr) {
                console.error('Error updating supplier_info_record on approval:', masterErr);
                return res.status(500).json({ error: 'Failed to update Supplier Info Record' });
            }

            const updateStatusSql = 'UPDATE product_master_approvals SET Status = ? WHERE Id = ?';
            db.query(updateStatusSql, ['Approved', id], (statusErr) => {
                if (statusErr) {
                    console.error('Error updating approval status:', statusErr);
                    return res.status(500).json({ error: 'Failed to update approval status' });
                }

                res.status(200).json({ success: true, message: 'Product edit approved and applied successfully.' });
            });
        });
    });
};

const rejectProductEdit = (req, res) => {
    if (!req.session.UserName || req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Access Denied. Admins only.' });
    }

    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'Approval ID is required' });
    }

    const updateStatusSql = "UPDATE product_master_approvals SET Status = 'Rejected' WHERE Id = ? AND Status = 'Pending'";
    db.query(updateStatusSql, [id], (err, result) => {
        if (err) {
            console.error('Error rejecting product edit:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Approval request not found or not in pending state' });
        }
        res.status(200).json({ success: true, message: 'Product edit rejected successfully.' });
    });
};

const parseProductEdits = (req, res) => {
    if (!req.session.UserName) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const xlsx = require('xlsx');

    try {
        const workbook = xlsx.read(file.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = [];
        const errors = [];

        jsonData.forEach((row, index) => {
            const getVal = (keys) => {
                for (const key of keys) {
                    for (const rowKey of Object.keys(row)) {
                        if (rowKey.toLowerCase().trim().replace(/[\s_-]/g, '') === key.toLowerCase().replace(/[\s_-]/g, '')) {
                            return row[rowKey];
                        }
                    }
                }
                return null;
            };

            const sku = getVal(['SAPMaterialSKU', 'SAP Material SKU', 'SKU', 'Product', 'MaterialSKU']);
            const desc = getVal(['SAPProductDescription', 'SAP Product Description', 'Description', 'ProductDescription']);
            const type = getVal(['MaterialType', 'Material Type', 'Type', 'ProductType']);
            const vendorName = getVal(['VendorProductName', 'Vendor Product Name', 'Vendor Name', 'Name']);
            const vendorDesc = getVal(['VendorProductDescription', 'Vendor Product Description', 'Vendor Description']);
            const unit = getVal(['Unit', 'BaseUnit', 'Base Unit']);
            const price = getVal(['Price', 'UnitPrice', 'Unit Price']);
            const spec = getVal(['ProductSpecification', 'Product Specification', 'Specification', 'Specs']);

            if (!sku) {
                errors.push(`Row ${index + 2}: SKU (SAPMaterialSKU) is missing.`);
                return;
            }

            results.push({
                SAPMaterialSKU: String(sku).trim(),
                SAPProductDescription: desc ? String(desc).trim() : `SAP Material ${sku}`,
                MaterialType: type ? String(type).trim() : 'SERV',
                VendorProductName: vendorName ? String(vendorName).trim() : `SAP Material ${sku}`,
                VendorProductDescription: vendorDesc ? String(vendorDesc).trim() : null,
                Unit: unit ? String(unit).trim() : 'EA',
                Price: price !== null && price !== undefined ? parseFloat(price) : 0.00,
                ProductSpecification: spec ? String(spec).trim() : null
            });
        });

        res.status(200).json({ success: true, rows: results, errors: errors.length > 0 ? errors : null });
    } catch (err) {
        console.error('Error parsing uploaded file:', err);
        res.status(500).json({ error: 'Failed to process file' });
    }
};

const approveOnboardingProfile = (req, res) => {
    const { userId, supplierCode, supplierName } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    const sqlFetch = 'SELECT EmailId, PanNo FROM onboarding_users WHERE UserId = ? LIMIT 1';
    db.query(sqlFetch, [userId], (fetchErr, results) => {
        if (fetchErr) {
            console.error('Error fetching onboarding user details:', fetchErr);
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Onboarding user not found' });
        }

        const email = results[0].EmailId;
        const panNo = results[0].PanNo || "";
        const supplierPanCode = supplierCode ? `${panNo}${supplierCode}` : null;

        let sqlUpdate = 'UPDATE onboarding_users SET ApprovalStatus = 4 WHERE UserId = ?';
        let queryParams = [userId];

        if (supplierPanCode) {
            sqlUpdate = 'UPDATE onboarding_users SET ApprovalStatus = 4, SupplierPanCode = ?, SupplierCode = ?, SupplierName = ? WHERE UserId = ?';
            queryParams = [supplierPanCode, supplierCode, supplierName || null, userId];
        }

        db.query(sqlUpdate, queryParams, (err, result) => {
            if (err) {
                console.error('Error approving onboarding profile:', err);
                return res.status(500).json({ error: 'Database update error' });
            }

            // Construct and send email notification
            const mailOptions = {
                from: '"CTPL" <spadmin@castaliaz.in>',
                to: email,
                subject: "Supplier Portal Onboarding Profile Approved",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #10b981; margin-bottom: 20px;">Onboarding Profile Approved</h2>
                        <p>Dear Supplier,</p>
                        <p>We are pleased to inform you that your supplier onboarding profile verification is complete and has been approved by the administrator.</p>
                        <p>You can now log in to the Supplier Portal to view your dashboard, manage purchase orders, shipping notices, invoices, and quotations.</p>
                        <div style="margin: 25px 0;">
                            <a href="http://localhost:3000/login" 
                               style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                               Go to Login Page
                            </a>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8;">This is an automated system email. Please do not reply directly to this mail.</p>
                    </div>
                `
            };

            // Dynamically resolve frontend login URL
            if (req.headers.referer) {
                try {
                    const refUrl = new URL(req.headers.referer);
                    mailOptions.html = mailOptions.html.replace('http://localhost:3000/login', `${refUrl.origin}/login`);
                } catch (e) { }
            }

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error('Error sending profile approval email:', mailErr);
                }
                res.status(200).json({ success: true, message: 'Supplier profile approved successfully.' });
            });
        });
    });
};

const rejectOnboardingProfile = (req, res) => {
    const { userId, reason } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    const sqlFetch = 'SELECT EmailId FROM onboarding_users WHERE UserId = ? LIMIT 1';
    db.query(sqlFetch, [userId], (fetchErr, results) => {
        if (fetchErr) {
            console.error('Error fetching onboarding user details:', fetchErr);
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Onboarding user not found' });
        }

        const email = results[0].EmailId;
        const rejectReason = reason || 'Your uploaded compliance documents or company profile information did not meet our verification criteria.';

        const sqlUpdate = 'UPDATE onboarding_users SET ApprovalStatus = 5 WHERE UserId = ?';
        db.query(sqlUpdate, [userId], (err, result) => {
            if (err) {
                console.error('Error rejecting onboarding profile:', err);
                return res.status(500).json({ error: 'Database update error' });
            }

            // Construct and send email notification
            const mailOptions = {
                from: '"CTPL" <spadmin@castaliaz.in>',
                to: email,
                subject: "Supplier Portal Onboarding Profile Rejected",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #ef4444; margin-bottom: 20px;">Onboarding Profile Rejected</h2>
                        <p>Dear Supplier,</p>
                        <p>We regret to inform you that your supplier onboarding profile verification was rejected by the administrator.</p>
                        <p><strong>Reason for rejection:</strong> ${rejectReason}</p>
                        <p>If you need to correct your uploaded information or have any queries, please reach out to our Supplier Support Desk at <strong>spadmin@castaliaz.in</strong>.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8;">This is an automated system email. Please do not reply directly to this mail.</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error('Error sending profile rejection email:', mailErr);
                }
                res.status(200).json({ success: true, message: 'Supplier profile rejected successfully.' });
            });
        });
    });
};

module.exports = {


    pracSave,
    pracCreateNewUser,
    regiCompDb,
    EmailDb,
    regiProDb,
    deliLocDb,
    payInfoDb,
    addProDb,
    getProductCategory,
    getProductPacking,
    getMeasurementUnit,
    getCurrency,
    getCountryOfOperation,
    getStates,
    getdistricts,
    getcities,
    getDeliveryMode,
    getDeliveryPartners,
    RegistrationStatus,
    compDocDb,
    allRegistrationStatus,
    getOnboardingUsersList,
    getCompletedSuppliers,
    rejectOnboardingUser,
    getCompanyDetails,
    getDeliveryLocations,
    getPaymentInfo,
    getComplianceDoc,
    getProductCatalogue,
    addProductCatalogue,
    updateProductCatalogue,
    deleteProductCatalogue,
    registerSupplierProduct,
    getSupplierMappings,
    proposeNewProduct,
    getSupplierProposals,
    getAdminPendingApprovals,
    approveProductMapping,
    approveProductPrice,
    getAdminProposals,
    reviewProposal,
    createContract,
    getContracts,
    bulkUploadProductMaster,
    bulkUploadSupplierMappings,
    getProductCatalogueReport,
    syncSapMaterials,
    saveOdataProduct,
    uploadProductEdits,
    getProductEditsApprovals,
    approveProductEdit,
    rejectProductEdit,
    approveOnboardingUser,
    checkOnboardingStatus,
    parseProductEdits,
    approveOnboardingProfile,
    rejectOnboardingProfile
};
















// module.exports = {

//     const db = mysql.createConnection({
//     host: 'localhost',     // Your MySQL host (usually 'localhost')
//     user: 'root',          // Your MySQL username
//     password: 'ctpl@123',          // Your MySQL password
//     database: 'masterdetails' // Your MySQL database name
// });

// // Connect to MySQL
// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//         return;
//     }
//     console.log('Connected to MySQL database');
// });



// app.post('/save', (req, res) => {
//     const { firstName, lastName } = req.body;

//     const sql = 'INSERT INTO mastertable (first_name, last_name) VALUES (?, ?)';
//     db.query(sql, [firstName, lastName], (err, result) => {
//         if (err) {
//             console.error('Error inserting data:', err);
//             return res.status(500).json({ error: 'Database insert error' });
//         }
//         res.status(200).json({ message: 'Data saved successfully' });
//     });
//     // return "success";
// }),

// };
