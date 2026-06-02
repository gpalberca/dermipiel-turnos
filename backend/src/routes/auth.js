const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET    = process.env.JWT_SECRET   || 'dermipiel_secret_2024';
const ADM_USER  = process.env.ADMIN_USER   || 'admin';
const ADM_PASS  = process.env.ADMIN_PASS   || 'dermipiel2024';

router.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  if (usuario !== ADM_USER || password !== ADM_PASS) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const token = jwt.sign({ usuario }, SECRET, { expiresIn: '8h' });
  res.json({ token });
});

module.exports = router;
