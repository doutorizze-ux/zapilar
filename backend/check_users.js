const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./zapilar.db');

db.serialize(() => {
    db.all("SELECT id, email, role, storeName FROM user", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Users found:", rows);
    });
});

db.close();
