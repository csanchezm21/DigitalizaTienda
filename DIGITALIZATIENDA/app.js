require('dotenv').config();

const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');

const { verifyToken, authHtml } = require('./middlewares/auth.middleware');
const authRoutes         = require('./routes/auth.routes');
const productosRoutes    = require('./routes/productos.routes');
const categoriasRoutes   = require('./routes/categorias.routes');
const proveedoresRoutes  = require('./routes/proveedores.routes');
const facturasRoutes     = require('./routes/facturas.routes');
const clientesRoutes     = require('./routes/clientes.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ── RUTAS PÚBLICAS (páginas HTML) ─────────────────────────────────────────────
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'registro.html')));

// ── RUTAS PROTEGIDAS (páginas HTML) ───────────────────────────────────────────
const pagesProtegidas = ['dashboard','productos','categorias','proveedores','clientes','facturas','estadisticas'];
pagesProtegidas.forEach(page => {
  app.get(`/${page}`, authHtml, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', `${page}.html`))
  );
});

app.get('/logout', (req, res) => {
  res.clearCookie('jwt_token');
  res.redirect('/');
});

// ── API DE AUTENTICACIÓN (pública) ────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── APIs PROTEGIDAS (JWT requerido) ───────────────────────────────────────────
app.use('/api/productos',    verifyToken, productosRoutes);
app.use('/api/categorias',   verifyToken, categoriasRoutes);
app.use('/api/proveedores',  verifyToken, proveedoresRoutes);
app.use('/api/facturas',     verifyToken, facturasRoutes);
app.use('/api/clientes',     verifyToken, clientesRoutes);
app.use('/api/estadisticas', verifyToken, estadisticasRoutes);

// ── 404 & ERROR GLOBAL ────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Ruta no encontrada.' });
  res.status(404).sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

// ── ARRANQUE ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Servidor corriendo en http://localhost:${PORT}`);
  console.log('    Credenciales de prueba: admin@sistema.com / admin123\n');
});
