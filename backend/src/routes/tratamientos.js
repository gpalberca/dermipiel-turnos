// routes/tratamientos.js
const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const auth    = require('../middleware/auth');

// ── GET / — Lista pública (solo activos, con joins) ──────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.nombre,
        t.descripcion,
        t.duracion_minutos,
        t.precio prec,
        t.imagen_url,
        t.tags,
        t.activo,
        c.id   AS categoria_id,
        c.nombre AS categoria,
        e.id   AS especialista_id,
        CONCAT(e.nombres, ' ', e.apellidos) AS especialista
      FROM tratamientos t
      LEFT JOIN categorias  c ON c.id = t.categoria_id
      LEFT JOIN especialistas e ON e.id = t.especialista_id
      WHERE t.activo = 1
      ORDER BY c.nombre, t.nombre
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /admin — Lista completa para panel admin (activos e inactivos) ─
router.get('/admin', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.nombre,
        t.descripcion,
        t.duracion_minutos,
        t.precio,
        t.imagen_url,
        t.tags,
        t.activo,
        c.id     AS categoria_id,
        c.nombre AS categoria,
        e.id     AS especialista_id,
        CONCAT(e.nombres, ' ', e.apellidos) AS especialista
      FROM tratamientos t
      LEFT JOIN categorias   c ON c.id = t.categoria_id
      LEFT JOIN especialistas e ON e.id = t.especialista_id
      ORDER BY t.activo DESC, c.nombre, t.nombre
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /:id — Detalle de un tratamiento ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.nombre,
        t.descripcion,
        t.duracion_minutos,
        t.precio,
        t.imagen_url,
        t.tags,
        t.activo,
        c.id     AS categoria_id,
        c.nombre AS categoria,
        e.id     AS especialista_id,
        CONCAT(e.nombres, ' ', e.apellidos) AS especialista
      FROM tratamientos t
      LEFT JOIN categorias   c ON c.id = t.categoria_id
      LEFT JOIN especialistas e ON e.id = t.especialista_id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Tratamiento no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST / — Crear tratamiento (protegido) ───────────────────────────
router.post('/', auth, async (req, res) => {
  const {
    nombre, descripcion, duracion_minutos, precio,
    categoria_id = null, especialista_id = null,
    imagen_url = null, tags = null, activo = 1
  } = req.body;

  try {
    const [result] = await pool.query(`
      INSERT INTO tratamientos
        (nombre, descripcion, duracion_minutos, precio,
         categoria_id, especialista_id, imagen_url, tags, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre, descripcion, duracion_minutos, precio,
      categoria_id, especialista_id, imagen_url,
      tags ? JSON.stringify(tags) : null, activo
    ]);

    const [rows] = await pool.query(
      'SELECT * FROM tratamientos WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error al crear tratamiento:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /:id — Actualizar tratamiento (protegido) ────────────────────
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const {
    nombre, descripcion, duracion_minutos, precio,
    categoria_id, especialista_id, imagen_url, tags, activo
  } = req.body;

  try {
    await pool.query(`
      UPDATE tratamientos
      SET nombre           = ?,
          descripcion      = ?,
          duracion_minutos = ?,
          precio           = ?,
          categoria_id     = ?,
          especialista_id  = ?,
          imagen_url       = ?,
          tags             = ?,
          activo           = ?
      WHERE id = ?
    `, [
      nombre, descripcion, duracion_minutos, precio,
      categoria_id, especialista_id, imagen_url,
      tags ? JSON.stringify(tags) : null, activo, id
    ]);

    const [rows] = await pool.query(
      'SELECT * FROM tratamientos WHERE id = ?', [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al actualizar tratamiento:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:id/toggle — Activar/desactivar sin eliminar (protegido) ──
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE tratamientos SET activo = NOT activo WHERE id = ?',
      [req.params.id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM tratamientos WHERE id = ?', [req.params.id]
    );
    res.json({ id: rows[0].id, activo: rows[0].activo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /:id — Eliminar (protegido) ───────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tratamientos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tratamiento eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar tratamiento:', err);
    res.status(500).json({ error: 'No se puede eliminar: ' + err.message });
  }
});

module.exports = router;