const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('zapilar_v3.db');

db.all('SELECT id, title, isSold FROM properties', [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('--- PROPERTIES ---');
  rows.forEach(r => {
    console.log(`ID: ${r.id} | Title: ${r.title} | isSold: ${r.isSold} (Type: ${typeof r.isSold})`);
  });
});
