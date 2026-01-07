const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt'); // We need bcrypt to hash the password manually if we insert via raw SQL

const db = new sqlite3.Database('./zapilar_v3.db');

async function createAdmin() {
    const password = 'admin'; // Let's set a simple password 'admin' for now
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const adminEmail = 'admin@zapilar.online';
    const id = 'admin-user-id-' + Date.now(); // fake uuid for simplicity in raw sql or use crypto

    db.serialize(() => {
        // Check if exists
        db.get("SELECT * FROM user WHERE email = ?", [adminEmail], (err, row) => {
            if (row) {
                console.log("Admin user already exists. Updating password to 'admin'");
                db.run("UPDATE user SET passwordHash = ? WHERE email = ?", [hash, adminEmail], (err) => {
                    if (err) console.error(err);
                    else console.log("Password updated successfully.");
                });
            } else {
                console.log("Creating new admin user...");
                db.run(`INSERT INTO user (id, email, passwordHash, role, storeName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    [id, adminEmail, hash, 'admin', 'Super Admin'], (err) => {
                        if (err) console.error(err);
                        else console.log("Admin user created successfully.");
                    });
            }
        });
    });
}

createAdmin();
