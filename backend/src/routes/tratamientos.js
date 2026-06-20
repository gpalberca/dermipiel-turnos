const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Obtener todos los tratamientos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tratamientos ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo tratamiento (Protegido)
router.post('/', auth, async (req, res) => {
  const { nombre, descripcion, duracion_minutos, precio } = req.body;
  console.log('POST /api/tratamientos:', { nombre, descripcion, duracion_minutos, precio });
  try {
    const [result] = await pool.query(`
      INSERT INTO tratamientos (nombre, descripcion, duracion_minutos, precio)
      VALUES (?, ?, ?, ?)
    `, [nombre, descripcion, duracion_minutos, precio]);
    const [rows] = await pool.query('SELECT * FROM tratamientos WHERE id = ?', [result.insertId]);
    console.log('Tratamiento creado:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear tratamiento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un tratamiento (Protegido)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, duracion_minutos, precio } = req.body;
  console.log('PUT /api/tratamientos/:id', id, { nombre, descripcion, duracion_minutos, precio });
  try {
    await pool.query(`
      UPDATE tratamientos
      SET nombre = ?, descripcion = ?, duracion_minutos = ?, precio = ?
      WHERE id = ?
    `, [nombre, descripcion, duracion_minutos, precio, id]);
    const [rows] = await pool.query('SELECT * FROM tratamientos WHERE id = ?', [id]);
    console.log('Tratamiento actualizado:', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar tratamiento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un tratamiento (Protegido)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  console.log('DELETE /api/tratamientos/:id', id);
  try {
    await pool.query('DELETE FROM tratamientos WHERE id = ?', [id]);
    console.log('Tratamiento eliminado:', id);
    res.json({ message: 'Tratamiento eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar tratamiento:', err);
    // Manejar el caso donde no se puede borrar porque ya tiene citas asociadas
    res.status(500).json({ error: 'No se puede eliminar: ' + err.message });
  }
});

module.exports = router;
