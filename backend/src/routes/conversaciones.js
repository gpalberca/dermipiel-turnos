// routes/conversaciones.js
// Log de conversaciones del agente WhatsApp — DermiPiel Turnos
// Acceso: JWT (admin panel) o x-api-key (n8n)

const express   = require('express');
const router    = express.Router();
const { pool }  = require('../db');
const verifyToken = require('../middleware/auth');

const N8N_API_KEY = process.env.N8N_API_KEY || 'dermipiel-n8n-secret';

function authDual(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    if (apiKey !== N8N_API_KEY)
      return res.status(401).json({ error: 'API key inválida' });
    req.source = 'n8n';
    return next();
  }
  return verifyToken(req, res, next);
}

// ─────────────────────────────────────────────────────────────
// GET /api/conversaciones
// Lista de conversaciones agrupadas por session_id
// Query params: q, resultado (convertido|sin_cita), periodo (hoy|semana|ant), page, limit
// ─────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { q = '', resultado = '', periodo = '', page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params     = [];

    if (q) {
      conditions.push(`(l.session_id LIKE ? OR cl.nombre LIKE ? OR l.nombre_wa LIKE ?)`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (resultado === 'convertido') {
      conditions.push('MAX(l.cita_id) IS NOT NULL');
    } else if (resultado === 'sin_cita') {
      conditions.push('MAX(l.cita_id) IS NULL');
    }

    if (periodo === 'hoy') {
      conditions.push('DATE(l.created_at) = CURDATE()');
    } else if (periodo === 'semana') {
      conditions.push('l.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    } else if (periodo === 'ant') {
      conditions.push('l.created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total agrupado por session
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT l.session_id
           FROM conversaciones_log l
           LEFT JOIN clientes cl ON cl.id = l.cliente_id
          ${where.replace('MAX(l.cita_id)', 'l.cita_id')}
          GROUP BY l.session_id
       ) AS sesiones`,
      params
    );

    // Lista de conversaciones
    const [rows] = await pool.query(
      `SELECT
         l.session_id,
         cl.id                  AS cliente_id,
         cl.nombre              AS cliente_nombre,
         l.nombre_wa,
         COUNT(l.id)            AS total_turnos,
         MIN(l.created_at)      AS inicio,
         MAX(l.created_at)      AS ultimo_turno,
         SUBSTRING(MAX(l.mensaje_usuario), 1, 120) AS ultimo_mensaje,
         MAX(l.cita_id)         AS cita_id,
         IF(MAX(l.cita_id) IS NOT NULL, 'convertido', 'sin_cita') AS resultado
       FROM conversaciones_log l
       LEFT JOIN clientes cl ON cl.id = l.cliente_id
       ${where.replace('MAX(l.cita_id)', 'l.cita_id')}
       GROUP BY l.session_id, cl.id, cl.nombre, l.nombre_wa
       ORDER BY MAX(l.created_at) DESC
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
    console.error('[GET /conversaciones]', err);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});


// ─────────────────────────────────────────────────────────────
// GET /api/conversaciones/:session_id
// Detalle completo — todos los turnos de una sesión
// ─────────────────────────────────────────────────────────────
router.get('/:session_id', verifyToken, async (req, res) => {
  try {
    const session_id = req.params.session_id;

    const [turnos] = await pool.query(
      `SELECT
         l.id,
         l.session_id,
         l.cliente_id,
         l.nombre_wa,
         l.mensaje_usuario,
         l.respuesta_agente,
         l.cita_id,
         l.created_at,
         cl.nombre   AS cliente_nombre,
         cl.telefono AS cliente_telefono,
         cl.nivel    AS cliente_nivel
       FROM conversaciones_log l
       LEFT JOIN clientes cl ON cl.id = l.cliente_id
       WHERE l.session_id = ?
       ORDER BY l.created_at ASC`,
      [session_id]
    );

    if (!turnos.length)
      return res.status(404).json({ error: 'Conversación no encontrada' });

    // Meta de la conversación
    const meta = {
      session_id,
      cliente_id:      turnos[0].cliente_id,
      cliente_nombre:  turnos[0].cliente_nombre  || turnos[0].nombre_wa,
      cliente_telefono:turnos[0].cliente_telefono,
      cliente_nivel:   turnos[0].cliente_nivel,
      nombre_wa:       turnos[0].nombre_wa,
      total_turnos:    turnos.length,
      inicio:          turnos[0].created_at,
      fin:             turnos[turnos.length - 1].created_at,
      cita_id:         turnos.find(t => t.cita_id)?.cita_id ?? null
    };

    res.json({ meta, turnos });
  } catch (err) {
    console.error('[GET /conversaciones/:session_id]', err);
    res.status(500).json({ error: 'Error al obtener conversación' });
  }
});


// ─────────────────────────────────────────────────────────────
// POST /api/conversaciones/log
// Registrar un turno — llamado por n8n después de cada respuesta
// Body: { session_id, nombre_wa?, mensaje_usuario, respuesta_agente,
//         cliente_id?, cita_id? }
// ─────────────────────────────────────────────────────────────
router.post('/log', authDual, async (req, res) => {
  try {
    const {
      session_id,
      nombre_wa        = null,
      mensaje_usuario,
      respuesta_agente,
      cliente_id       = null,
      cita_id          = null
    } = req.body;

    if (!session_id || !mensaje_usuario || !respuesta_agente) {
      return res.status(400).json({
        error: 'Campos requeridos: session_id, mensaje_usuario, respuesta_agente'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO conversaciones_log
         (session_id, cliente_id, nombre_wa, mensaje_usuario, respuesta_agente, cita_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session_id, cliente_id || null, nombre_wa, mensaje_usuario, respuesta_agente, cita_id || null]
    );

    res.status(201).json({
      id:      result.insertId,
      message: 'Turno registrado'
    });
  } catch (err) {
    console.error('[POST /conversaciones/log]', err);
    res.status(500).json({ error: 'Error al registrar turno' });
  }
});


module.exports = router;