// routes/clientes.js
// Módulo de gestión de clientes — DermiPiel Turnos
// Acceso: JWT (admin panel) o x-api-key (n8n / agente WhatsApp)

const express    = require('express');
const router     = express.Router();
const { pool } = require('../db');
const verifyToken = require("../middleware/auth");

// ─────────────────────────────────────────────
// Middleware dual: acepta JWT del admin  O
// x-api-key para llamadas desde n8n
// ─────────────────────────────────────────────
const N8N_API_KEY = process.env.N8N_API_KEY || 'dermipiel-n8n-secret';

function authDual(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    if (apiKey !== N8N_API_KEY) {
      return res.status(401).json({ error: 'API key inválida' });
    }
    req.source = 'n8n';
    return next();
  }
  // Sin x-api-key → valida JWT normal
  return verifyToken(req, res, next);
}

// ─────────────────────────────────────────────
// GET /api/clientes
// Lista paginada con conteo de citas
// Query params: q, fuente, activo, page, limit
// ─────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { q = '', fuente = '', activo = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params     = [];

    if (q) {
      conditions.push('(c.nombre LIKE ? OR c.telefono LIKE ? OR c.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (fuente)  { conditions.push('c.fuente = ?');  params.push(fuente); }
    if (activo !== '') { conditions.push('c.activo = ?'); params.push(parseInt(activo)); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total para paginación
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM clientes c ${where}`,
      params
    );

    // Datos con conteo de citas via LEFT JOIN
    const [rows] = await pool.query(
      `SELECT
         c.id,
         c.nombre,
         c.telefono,
         c.email,
         c.fuente,
         c.notas,
         c.activo,
         c.created_at,
         COUNT(ci.id)                               AS total_citas,
         MAX(ci.fecha_hora)                         AS ultima_cita,
         SUM(ci.estado = 'completada')              AS citas_completadas,
         SUM(ci.estado IN ('pendiente','confirmada')) AS citas_proximas
       FROM clientes c
       LEFT JOIN citas ci ON ci.cliente_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data:  rows,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('[GET /clientes]', err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});


// ─────────────────────────────────────────────
// GET /api/clientes/:id
// Detalle de un cliente + historial de citas
// ─────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [[cliente]] = await pool.query(
      `SELECT * FROM clientes WHERE id = ?`,
      [req.params.id]
    );
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const [citas] = await pool.query(
      `SELECT ci.id, ci.fecha_hora, ci.estado, ci.notas,
              t.nombre AS tratamiento, t.precio
       FROM citas ci
       LEFT JOIN tratamientos t ON t.id = ci.tratamiento_id
       WHERE ci.cliente_id = ?
       ORDER BY ci.fecha_hora DESC`,
      [req.params.id]
    );

    res.json({ ...cliente, citas });
  } catch (err) {
    console.error('[GET /clientes/:id]', err);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});


// ─────────────────────────────────────────────
// POST /api/clientes
// Crear cliente — acepta JWT (admin) o x-api-key (n8n)
// Hace upsert por teléfono para evitar duplicados
// Body: { nombre, telefono, email?, fuente?, notas? }
// ─────────────────────────────────────────────
router.post('/', authDual, async (req, res) => {
  try {
    const { nombre, telefono, email = null, fuente = 'manual', notas = null } = req.body;

    if (!nombre || !telefono) {
      return res.status(400).json({ error: 'nombre y telefono son requeridos' });
    }

    // Fuente automática si viene de n8n
    const fuenteFinal = req.source === 'n8n' ? 'whatsapp' : fuente;

    // Upsert via procedimiento almacenado
    await pool.query('CALL upsert_cliente(?, ?, ?, ?, ?, @o_id, @o_nuevo)', [
      nombre, telefono, email, fuenteFinal, notas
    ]);
    const [[result]] = await pool.query('SELECT @o_id AS id, @o_nuevo AS es_nuevo');

    const status = result.es_nuevo ? 201 : 200;
    res.status(status).json({
      id:      result.id,
      es_nuevo: !!result.es_nuevo,
      message: result.es_nuevo ? 'Cliente creado' : 'Cliente actualizado'
    });
  } catch (err) {
    console.error('[POST /clientes]', err);
    res.status(500).json({ error: 'Error al guardar cliente' });
  }
});


// ─────────────────────────────────────────────
// PUT /api/clientes/:id
// Editar nombre, email y notas (admin)
// Body: { nombre?, email?, notas? }
// ─────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { nombre, email, notas } = req.body;

    const [[existing]] = await pool.query(
      'SELECT id FROM clientes WHERE id = ?', [req.params.id]
    );
    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });

    await pool.query(
      `UPDATE clientes
          SET nombre = COALESCE(?, nombre),
              email  = COALESCE(?, email),
              notas  = COALESCE(?, notas)
        WHERE id = ?`,
      [nombre ?? null, email ?? null, notas ?? null, req.params.id]
    );

    res.json({ message: 'Cliente actualizado' });
  } catch (err) {
    console.error('[PUT /clientes/:id]', err);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});


// ─────────────────────────────────────────────
// PATCH /api/clientes/:id/toggle
// Activar / desactivar cliente (soft delete)
// ─────────────────────────────────────────────
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const [[cliente]] = await pool.query(
      'SELECT id, activo FROM clientes WHERE id = ?', [req.params.id]
    );
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const nuevoEstado = cliente.activo ? 0 : 1;
    await pool.query('UPDATE clientes SET activo = ? WHERE id = ?', [
      nuevoEstado, req.params.id
    ]);

    res.json({
      message: nuevoEstado ? 'Cliente activado' : 'Cliente desactivado',
      activo:  nuevoEstado
    });
  } catch (err) {
    console.error('[PATCH /clientes/:id/toggle]', err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});


module.exports = router;