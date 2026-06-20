const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Obtener todas las citas (protegido)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, t.nombre as tratamiento_nombre, t.duracion_minutos
      FROM citas c
      JOIN tratamientos t ON c.tratamiento_id = t.id
      ORDER BY c.fecha_hora
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva cita
router.post('/', async (req, res) => {
  const { nombre_paciente, email, telefono, tratamiento_id, fecha_hora } = req.body;
  try {
    const [result] = await pool.query(`
      INSERT INTO citas (nombre_paciente, email, telefono, tratamiento_id, fecha_hora, estado)
      VALUES (?, ?, ?, ?, ?, 'pendiente')
    `, [nombre_paciente, email, telefono, tratamiento_id, fecha_hora]);
    const [rows] = await pool.query('SELECT * FROM citas WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar una cita
router.patch('/:id/cancelar', async (req, res) => {
  try {
    await pool.query(`UPDATE citas SET estado = 'cancelada' WHERE id = ?`, [req.params.id]);
    const [rows] = await pool.query('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
