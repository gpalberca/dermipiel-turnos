const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Obtener todos los tratamientos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tratamientos ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo tratamiento (Protegido)
router.post('/', auth, async (req, res) => {
  const { nombre, descripcion, duracion_minutos, precio } = req.body;
  console.log('POST /api/tratamientos:', { nombre, descripcion, duracion_minutos, precio });
  try {
    const result = await pool.query(`
      INSERT INTO tratamientos (nombre, descripcion, duracion_minutos, precio)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [nombre, descripcion, duracion_minutos, precio]);
    console.log('Tratamiento creado:', result.rows[0]);
    res.status(201).json(result.rows[0]);
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
    const result = await pool.query(`
      UPDATE tratamientos
      SET nombre = $1, descripcion = $2, duracion_minutos = $3, precio = $4
      WHERE id = $5 RETURNING *
    `, [nombre, descripcion, duracion_minutos, precio, id]);
    console.log('Tratamiento actualizado:', result.rows[0]);
    res.json(result.rows[0]);
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
    await pool.query('DELETE FROM tratamientos WHERE id = $1', [id]);
    console.log('Tratamiento eliminado:', id);
    res.json({ message: 'Tratamiento eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar tratamiento:', err);
    // Manejar el caso donde no se puede borrar porque ya tiene citas asociadas
    res.status(500).json({ error: 'No se puede eliminar: ' + err.message });
  }
});

module.exports = router;
