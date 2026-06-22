const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.id, e.nombres, e.apellidos, e.email, e.telefono, e.horario_id,
        h.hora_inicio, h.hora_fin, h.dias_atencion
      FROM especialistas e
      LEFT JOIN horarios h ON h.id = e.horario_id
      ORDER BY e.apellidos
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { nombres, apellidos, email, telefono, horario_id = null } = req.body;
  if (!nombres || !apellidos) {
    return res.status(400).json({ error: 'nombres y apellidos son obligatorios' });
  }
  try {
    const [result] = await pool.query(`
      INSERT INTO especialistas (nombres, apellidos, email, telefono, horario_id)
      VALUES (?, ?, ?, ?, ?)
    `, [nombres, apellidos, email, telefono, horario_id]);
    const [rows] = await pool.query(
      'SELECT * FROM especialistas WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { nombres, apellidos, email, telefono, horario_id = null } = req.body;
  try {
    await pool.query(`
      UPDATE especialistas
      SET nombres = ?, apellidos = ?, email = ?, telefono = ?, horario_id = ?
      WHERE id = ?
    `, [nombres, apellidos, email, telefono, horario_id, req.params.id]);
    const [rows] = await pool.query(
      'SELECT * FROM especialistas WHERE id = ?', [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM especialistas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Especialista eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'No se puede eliminar: ' + err.message });
  }
});

module.exports = router;