const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dermipiel',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'dermipiel123',
});

module.exports = { pool };
