const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'inventario_jwt_super_secreto_2024';

/**
 * Middleware: verifica el JWT en el header Authorization o en la cookie jwt_token.
 * Si es válido, agrega req.usuario con los datos del payload.
 */
function verifyToken(req, res, next) {
  // 1) Intentar desde header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // 2) Fallback: cookie (útil para páginas HTML)
  if (!token && req.cookies) {
    token = req.cookies['jwt_token'] || null;
  }

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;   // { id, nombre, rol, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token inválido.' });
  }
}

/**
 * Middleware: verifica que el usuario tenga rol 'admin'.
 * Debe ir siempre DESPUÉS de verifyToken.
 */
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Requiere permisos de administrador.' });
  }
  next();
}

/**
 * Middleware para páginas HTML: redirige al login si no hay token válido en cookie.
 */
function authHtml(req, res, next) {
  const token = req.cookies?.jwt_token;
  if (!token) return res.redirect('/');

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('jwt_token');
    res.redirect('/');
  }
}

module.exports = { verifyToken, soloAdmin, authHtml };
