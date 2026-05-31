const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Obtener todos los tratamientos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tratamientos ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
