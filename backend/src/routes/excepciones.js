const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const auth    = require('../middleware/auth');

// GET / — obtener todas las excepciones
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM excepciones ORDER BY fecha'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — crear excepción
router.post('/', auth, async (req, res) => {
  const { fecha, motivo, hora_inicio = null, hora_fin = null } = req.body;

  if (!fecha || !motivo) {
    return res.status(400).json({ error: 'fecha y motivo son obligatorios' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO excepciones (fecha, motivo, aplica_a, hora_inicio, hora_fin)
      VALUES (?, ?, '["todos"]', ?, ?)
    `, [fecha, motivo, hora_inicio, hora_fin]);

    const [rows] = await pool.query(
      'SELECT * FROM excepciones WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — editar excepción
router.put('/:id', auth, async (req, res) => {
  const { fecha, motivo, hora_inicio = null, hora_fin = null } = req.body;
  try {
    await pool.query(`
      UPDATE excepciones
      SET fecha       = ?,
          motivo      = ?,
          hora_inicio = ?,
          hora_fin    = ?
      WHERE id = ?
    `, [fecha, motivo, hora_inicio, hora_fin, req.params.id]);

    const [rows] = await pool.query(
      'SELECT * FROM excepciones WHERE id = ?', [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — eliminar excepción
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM excepciones WHERE id = ?', [req.params.id]);
    res.json({ message: 'Excepción eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}); 

module.exports = router;