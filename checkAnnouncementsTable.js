require('dotenv').config();
const db = require('./edvade-backend/db');

(async () => {
  try {
    const [rows] = await db.query("SHOW TABLES LIKE 'announcements'");
    console.log('rows:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('error:', err.message);
    process.exit(1);
  }
})();