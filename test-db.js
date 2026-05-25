const Database = require('better-sqlite3');
const db = new Database(':memory:');
console.log('Database initialized successfully');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
console.log('Table created');
