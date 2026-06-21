const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'dermipiel123',
  database: process.env.DB_NAME || 'dermipiel',
  port: process.env.DB_PORT || 3306,
  timezone: '-05:00'  
}).promise();

module.exports = { pool };