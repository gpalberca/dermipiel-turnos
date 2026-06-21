const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Obtener todas las citas (protegido)
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.nombre_paciente,
        c.email,
        c.telefono,
        c.fecha_hora,
        c.estado,
        c.notas,
        c.created_at,
        t.id               AS tratamiento_id,
        t.nombre           AS tratamiento_nombre,
        t.duracion_minutos,
        t.precio,
        cat.nombre         AS categoria,
        CONCAT(e.nombres, ' ', e.apellidos) AS especialista,
        e.id               AS especialista_id
      FROM citas c
      JOIN tratamientos  t   ON t.id   = c.tratamiento_id
      LEFT JOIN categorias   cat ON cat.id = t.categoria_id
      LEFT JOIN especialistas e  ON e.id   = t.especialista_id
      ORDER BY c.fecha_hora DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/confirmar
router.patch('/:id/confirmar', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE citas SET estado = 'confirmada' WHERE id = ?`,
      [req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PATCH /:id/completar
router.patch('/:id/completar', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE citas SET estado = 'completada' WHERE id = ?`,
      [req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM citas WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Crear una nueva cita
router.post('/', async (req, res) => {
  const { nombre_paciente, email, telefono, tratamiento_id, fecha_hora, notas = null } = req.body;

  // ── Validación de campos obligatorios ──────────────────────────
  if (!nombre_paciente || !tratamiento_id || !fecha_hora) {
    return res.status(400).json({
      error: 'Campos obligatorios: nombre_paciente, tratamiento_id, fecha_hora'
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // ── Verificar disponibilidad antes de insertar ─────────────
    const [check] = await conn.query(
      'SELECT fn_slot_disponible(?) AS disponible',
      [fecha_hora]
    );

    if (!check[0].disponible) {
      // Buscar alternativas
      const [alts] = await conn.query(
        'CALL sp_verificar_disponibilidad(?, ?)',
        [fecha_hora, tratamiento_id]
      );

      const alternativas = Array.isArray(alts[1])
        ? alts[1].map(r => {
            const d = new Date(r.slot);
            return d.toISOString().slice(0, 19).replace('T', ' ');
          })
        : [];

      return res.status(409).json({
        error:        'El horario no está disponible',
        alternativas: {
          antes:   alternativas.filter((_, i) => i < 2),
          despues: alternativas.filter((_, i) => i >= 2)
        }
      });
    }

    // ── Insertar la cita ───────────────────────────────────────
    const [result] = await conn.query(`
      INSERT INTO citas
        (nombre_paciente, email, telefono, tratamiento_id, fecha_hora, estado, notas)
      VALUES (?, ?, ?, ?, ?, 'pendiente', ?)
    `, [nombre_paciente, email, telefono, tratamiento_id, fecha_hora, notas]);

    // Devolver la cita creada con datos del tratamiento
    const [rows] = await conn.query(`
      SELECT
        c.*,
        t.nombre        AS tratamiento_nombre,
        t.duracion_minutos,
        t.precio
      FROM citas c
      JOIN tratamientos t ON t.id = c.tratamiento_id
      WHERE c.id = ?
    `, [result.insertId]);

    return res.status(201).json(rows[0]);

  } catch (err) {
    console.error('Error al crear cita:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
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
