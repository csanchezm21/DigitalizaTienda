const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { verifyToken } = require('../middlewares/auth.middleware');

const JWT_SECRET     = process.env.JWT_SECRET     || 'inventario_jwt_super_secreto_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?',
      [email]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'Credenciales incorrectas.' });

    const usuario = rows[0];

    // Comparar con bcrypt (contraseña almacenada hasheada)
    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk)
      return res.status(401).json({ error: 'Credenciales incorrectas.' });

    // Generar JWT
    const payload = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
    const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Guardar en cookie HttpOnly para las páginas HTML y devolver en JSON para la API
    res.cookie('jwt_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge:   8 * 60 * 60 * 1000,   // 8 horas en ms
    });

    res.json({
      ok: true,
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/registro ──────────────────────────────────────────────────
router.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hash]
    );

    res.status(201).json({
      ok:      true,
      message: 'Usuario registrado correctamente.',
      id:      result.insertId,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El email ya está registrado.' });
    console.error('[AUTH] Registro error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('jwt_token');
  res.json({ ok: true, message: 'Sesión cerrada.' });
});

// ── GET /api/auth/me → datos del usuario autenticado ────────────────────────
router.get('/me', verifyToken, (req, res) => {
  // verifyToken ya cargó req.usuario
  res.json(req.usuario);
});

module.exports = router;
