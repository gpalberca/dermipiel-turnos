// =====================================================================
// routes/disponibilidad.js
// Endpoint: POST /api/disponibilidad
// Consumido por n8n y el frontend Angular
// =====================================================================
const express = require('express');
const router  = express.Router();
const { pool } = require('../db');

/**
 * POST /api/disponibilidad
 * Body: { "fecha_hora": "2026-06-25 10:00:00", "tratamiento_id": 1 }
 */
router.post('/', async (req, res) => {
  const { fecha_hora, tratamiento_id = null } = req.body;

  // ── Validación de entrada ─────────────────────────────────────────
  if (!fecha_hora) {
    return res.status(400).json({
      error: 'El campo fecha_hora es requerido',
      ejemplo: { fecha_hora: '2026-06-25 10:00:00', tratamiento_id: 1 }
    });
  }

  // Validar formato básico de fecha
  const fechaValida = !isNaN(Date.parse(fecha_hora));
  if (!fechaValida) {
    return res.status(400).json({
      error: 'Formato de fecha inválido. Use: YYYY-MM-DD HH:MM:SS'
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Llamar al procedimiento almacenado
    const [results] = await conn.query(
      'CALL sp_verificar_disponibilidad(?, ?)',
      [fecha_hora, tratamiento_id]
    );

    // results[0] → estado del slot
    // results[1] → alternativas (solo si no disponible)
    const estado       = results[0][0];
    const alternativas = results[1]
      ? results[1].map(r => {
          const d = new Date(r.slot);
          return {
            fecha_hora: d.toISOString().slice(0, 19).replace('T', ' '),
            direccion:  r.direccion   // 'antes' | 'despues'
          };
        })
      : [];

    // ── Respuesta si está disponible ──────────────────────────────
    if (estado.disponible) {
      return res.json({
        disponible:            true,
        fecha_hora_solicitada: fecha_hora,
        mensaje:               'El horario está disponible'
      });
    }

    // ── Respuesta si NO está disponible ───────────────────────────
    return res.json({
      disponible:            false,
      fecha_hora_solicitada: fecha_hora,
      motivo:                estado.motivo,
      alternativas: {
        antes:   alternativas.filter(a => a.direccion === 'antes')
                             .map(a => a.fecha_hora)
                             .reverse(),          // orden cronológico
        despues: alternativas.filter(a => a.direccion === 'despues')
                             .map(a => a.fecha_hora)
      }
    });

  } catch (error) {
    console.error('[disponibilidad] Error:', error.message);
    return res.status(500).json({
      error:   'Error al verificar disponibilidad',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/disponibilidad/slots?fecha=2026-06-25&tratamiento_id=1
 * Devuelve todos los slots disponibles del día (útil para el calendario Angular)
 */
router.get('/slots', async (req, res) => {
  const { fecha, tratamiento_id = null } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: 'El parámetro fecha es requerido (YYYY-MM-DD)' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Obtener horario del día
    const diaSemana = ['domingo','lunes','martes','miercoles',
                       'jueves','viernes','sabado'][new Date(fecha + 'T12:00:00').getDay()];

    const [horarios] = await conn.query(
      `SELECT hora_inicio, hora_fin, intervalo_min
       FROM horarios
       WHERE JSON_CONTAINS(dias_atencion, JSON_QUOTE(?))
       LIMIT 1`,
      [diaSemana]
    );

    if (!horarios.length) {
      return res.json({ fecha, dia: diaSemana, slots: [], mensaje: 'No hay atención ese día' });
    }

    const { hora_inicio, hora_fin, intervalo_min } = horarios[0];
    const slots = [];

    // Generar todos los slots del día y verificar cada uno
    let current = new Date(`${fecha}T${hora_inicio}`);
    const fin   = new Date(`${fecha}T${hora_fin}`);

    while (current < fin) {
      const fechaHora = current.toISOString().slice(0, 19).replace('T', ' ');
      const [check]   = await conn.query(
        'SELECT fn_slot_disponible(?) AS disponible',
        [fechaHora]
      );
      slots.push({
        hora:        current.toTimeString().slice(0, 5),
        fecha_hora:  fechaHora,
        disponible:  check[0].disponible === 1
      });
      current = new Date(current.getTime() + intervalo_min * 60000);
    }

    return res.json({ fecha, dia: diaSemana, slots });

  } catch (error) {
    console.error('[slots] Error:', error.message);
    return res.status(500).json({ error: 'Error al obtener slots' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;