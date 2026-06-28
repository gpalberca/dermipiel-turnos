require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tratamientos', require('./routes/tratamientos'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/disponibilidad', require('./routes/disponibilidad'));
app.use('/api/horarios',    require('./routes/horarios'));
app.use('/api/excepciones', require('./routes/excepciones'));
app.use('/api/especialistas', require('./routes/especialistas'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/clientes', require('./routes/clientes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dermipiel API funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
