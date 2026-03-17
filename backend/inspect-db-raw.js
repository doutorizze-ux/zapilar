const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'user',
  password: 'password',
  database: 'zapilar',
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT id, title, "isSold" FROM properties');
  console.log('--- PROPERTIES ---');
  res.rows.forEach(r => {
    console.log(`ID: ${r.id} | Title: ${r.title} | isSold: ${r.isSold} (Type: ${typeof r.isSold})`);
  });
  await client.end();
}
main().catch(console.error);
