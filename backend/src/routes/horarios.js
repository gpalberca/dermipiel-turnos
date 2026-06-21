const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const auth    = require('../middleware/auth');

// GET / — obtener todos los horarios
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM horarios ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — editar horario existente
router.put('/:id', auth, async (req, res) => {
  const { hora_inicio, hora_fin, intervalo_min } = req.body;
  try {
    await pool.query(`
      UPDATE horarios
      SET hora_inicio   = ?,
          hora_fin      = ?,
          intervalo_min = ?
      WHERE id = ?
    `, [hora_inicio, hora_fin, intervalo_min, req.params.id]);

    const [rows] = await pool.query(
      'SELECT * FROM horarios WHERE id = ?', [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;