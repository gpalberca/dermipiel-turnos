// routes/tratamientos.js
const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const auth    = require('../middleware/auth');

// ── GET / — Lista pública (solo activos) ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id, t.nombre, t.descripcion, t.duracion_minutos, t.precio,
        t.imagen_url, t.tags, t.activo, t.visible_agente,
        c.id AS categoria_id, c.nombre AS categoria,
        e.id AS especialista_id,
        CONCAT(e.nombres, ' ', e.apellidos) AS especialista
      FROM tratamientos t
      LEFT JOIN categorias   c ON c.id = t.categoria_id
      LEFT JOIN especialistas e ON e.id = t.especialista_id
      WHERE t.activo = 1
      ORDER BY c.nombre, t.nombre
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /admin — Lista completa para panel admin ─────────────────────
router.get('/admin', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id, t.nombre, t.descripcion, t.duracion_minutos, t.precio,
        t.imagen_url, t.tags, t.activo, t.visible_agente,
        c.id AS categoria_id, c.nombre AS categoria,
        e.id AS especialista_id,
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
        t.id, t.nombre, t.descripcion, t.duracion_minutos, t.precio,
        t.imagen_url, t.tags, t.activo, t.visible_agente,
        c.id AS categoria_id, c.nombre AS categoria,
        e.id AS especialista_id,
        CONCAT(e.nombres, ' ', e.apellidos) AS especialista
      FROM tratamientos t
      LEFT JOIN categorias   c ON c.id = t.categoria_id
      LEFT JOIN especialistas e ON e.id = t.especialista_id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Tratamiento no encontrado' });
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
    imagen_url = null, tags = null, activo = 1,
    visible_agente = 0
  } = req.body;

  try {
    const [result] = await pool.query(`
      INSERT INTO tratamientos
        (nombre, descripcion, duracion_minutos, precio,
         categoria_id, especialista_id, imagen_url, tags, activo, visible_agente)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre, descripcion, duracion_minutos, precio,
      categoria_id, especialista_id, imagen_url,
      tags ? JSON.stringify(tags) : null, activo, visible_agente
    ]);

    const [rows] = await pool.query('SELECT * FROM tratamientos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /:id — Actualizar tratamiento (protegido) ────────────────────
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const {
    nombre, descripcion, duracion_minutos, precio,
    categoria_id, especialista_id, imagen_url, tags, activo,
    visible_agente
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
          activo           = ?,
          visible_agente   = ?
      WHERE id = ?
    `, [
      nombre, descripcion, duracion_minutos, precio,
      categoria_id, especialista_id, imagen_url,
      tags ? JSON.stringify(tags) : null,
      activo, visible_agente ?? 0, id
    ]);

    const [rows] = await pool.query('SELECT * FROM tratamientos WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:id/toggle — Activar/desactivar (protegido) ───────────────
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE tratamientos SET activo = NOT activo WHERE id = ?',
      [req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM tratamientos WHERE id = ?', [req.params.id]);
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
    res.status(500).json({ error: 'No se puede eliminar: ' + err.message });
  }
});

module.exports = router;

// ── PATCH /:id/toggle-agente — Mostrar/ocultar en agente IA ──────────
router.patch('/:id/toggle-agente', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE tratamientos SET visible_agente = NOT visible_agente WHERE id = ?',
      [req.params.id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM tratamientos WHERE id = ?', [req.params.id]
    );
    res.json({ id: rows[0].id, visible_agente: rows[0].visible_agente });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});