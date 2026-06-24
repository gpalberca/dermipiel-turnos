// =====================================================================
// routes/disponibilidad.js
// Endpoint: POST /api/disponibilidad
// Consumido por n8n y el frontend Angular
// =====================================================================
const express = require('express');
const router  = express.Router();
const { pool } = require('../db');

// mysql2 con timezone: '-05:00' entrega objetos Date ya en hora Ecuador.
// Usamos getHours/getMinutes (hora local del proceso Node) para formatear.
const formatLocalEC = (d) => {
  // d está en UTC, Ecuador = UTC-5, restamos 5h
  const ec = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${ec.getUTCFullYear()}-${pad(ec.getUTCMonth()+1)}-${pad(ec.getUTCDate())} ` +
         `${pad(ec.getUTCHours())}:${pad(ec.getUTCMinutes())}:00`;
};

router.post('/', async (req, res) => {
  const { fecha_hora, tratamiento_id = null } = req.body;

  if (!fecha_hora) {
    return res.status(400).json({
      error: 'El campo fecha_hora es requerido',
      ejemplo: { fecha_hora: '2026-06-25 10:00:00', tratamiento_id: 1 }
    });
  }

  const fechaValida = !isNaN(Date.parse(fecha_hora));
  if (!fechaValida) {
    return res.status(400).json({
      error: 'Formato de fecha inválido. Use: YYYY-MM-DD HH:MM:SS'
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [results] = await conn.query(
      'CALL sp_verificar_disponibilidad(?, ?)',
      [fecha_hora, tratamiento_id]
    );

    const estado = results[0][0];

    const alternativas = Array.isArray(results[1])
      ? results[1].map(r => ({
          fecha_hora: formatLocalEC(r.slot),
          direccion:  r.direccion
        }))
      : [];

    if (estado.disponible) {
      return res.json({
        disponible:            true,
        fecha_hora_solicitada: fecha_hora,
        mensaje:               'El horario está disponible'
      });
    }

    return res.json({
      disponible:            false,
      fecha_hora_solicitada: fecha_hora,
      motivo:                estado.motivo,
      alternativas: {
        antes:   alternativas.filter(a => a.direccion === 'antes')
                             .map(a => a.fecha_hora)
                             .reverse(),
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

router.get('/slots', async (req, res) => {
  const { fecha, tratamiento_id = null } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: 'El parámetro fecha es requerido (YYYY-MM-DD)' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

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

    const [hIni, mIni] = hora_inicio.split(':').map(Number);
    const [hFin, mFin] = hora_fin.split(':').map(Number);
    let totalMinIni   = hIni * 60 + mIni;
    const totalMinFin = hFin * 60 + mFin;

    while (totalMinIni < totalMinFin) {
      const hh = String(Math.floor(totalMinIni / 60)).padStart(2, '0');
      const mm = String(totalMinIni % 60).padStart(2, '0');
      const fechaHora = `${fecha} ${hh}:${mm}:00`;

      const [check] = await conn.query(
        'SELECT fn_slot_disponible(?) AS disponible',
        [fechaHora]
      );
      slots.push({
        hora:       `${hh}:${mm}`,
        fecha_hora:  fechaHora,
        disponible:  check[0].disponible === 1
      });
      totalMinIni += intervalo_min;
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