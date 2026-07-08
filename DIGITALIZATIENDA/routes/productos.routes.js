const router = require('express').Router();
const db     = require('../config/db');

// Todas las rutas están protegidas por verifyToken (aplicado en app.js)

// Vista base con JOINs para devolver datos completos de producto
const BASE_SELECT = `
  SELECT
    p.id_producto,
    p.nombre_producto,
    p.fecha_entrada,
    p.precio_neto,
    p.precio_venta,
    p.activo,
    c.id_categoria,
    c.nombre_categoria,
    pr.id_proveedor,
    pr.nombre_proveedor,
    pr.numero_contacto,
    IFNULL(i.cantidad, 0) AS stock
  FROM producto p
  INNER JOIN categoria c   ON c.id_categoria  = p.id_categoria_fk
  INNER JOIN proveedor pr  ON pr.id_proveedor = p.id_proveedor_fk
  LEFT  JOIN inventario i  ON i.id_producto_fk = p.id_producto
`;

// ── GET /api/productos ────────────────────────────────────────────────────────
// Query params: ?buscar=texto  &  ?categoria=id
router.get('/', async (req, res) => {
  const { buscar = '', categoria = '' } = req.query;
  let sql    = BASE_SELECT + ' WHERE p.activo = 1';
  const params = [];

  if (buscar) {
    sql += ' AND (p.nombre_producto LIKE ? OR pr.nombre_proveedor LIKE ?)';
    params.push(`%${buscar}%`, `%${buscar}%`);
  }
  if (categoria) {
    sql += ' AND c.id_categoria = ?';
    params.push(categoria);
  }
  sql += ' ORDER BY p.id_producto DESC';

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[PRODUCTOS] GET /:', err);
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

// ── GET /api/productos/dashboard ──────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) total FROM producto WHERE activo = 1'
    );
    const [[{ bajo }]] = await db.query(
      `SELECT COUNT(*) bajo FROM inventario i
       INNER JOIN producto p ON p.id_producto = i.id_producto_fk
       WHERE p.activo = 1 AND i.cantidad < 5`
    );
    const [[{ valor }]] = await db.query(
      `SELECT IFNULL(SUM(p.precio_venta * i.cantidad), 0) valor
       FROM producto p
       LEFT JOIN inventario i ON i.id_producto_fk = p.id_producto
       WHERE p.activo = 1`
    );
    const [[{ categorias }]] = await db.query(
      'SELECT COUNT(DISTINCT id_categoria_fk) categorias FROM producto WHERE activo = 1'
    );

    res.json({
      total,
      bajo,
      valor: parseFloat(valor).toFixed(2),
      categorias,
    });
  } catch (err) {
    console.error('[PRODUCTOS] GET /dashboard:', err);
    res.status(500).json({ error: 'Error al obtener datos del dashboard.' });
  }
});

// ── GET /api/productos/categorias ─────────────────────────────────────────────
router.get('/categorias', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categoria ORDER BY nombre_categoria');
    res.json(rows);
  } catch (err) {
    console.error('[PRODUCTOS] GET /categorias:', err);
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

// ── GET /api/productos/proveedores ────────────────────────────────────────────
router.get('/proveedores', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM proveedor ORDER BY nombre_proveedor');
    res.json(rows);
  } catch (err) {
    console.error('[PRODUCTOS] GET /proveedores:', err);
    res.status(500).json({ error: 'Error al obtener proveedores.' });
  }
});

// ── GET /api/productos/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      BASE_SELECT + ' WHERE p.id_producto = ?',
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PRODUCTOS] GET /:id:', err);
    res.status(500).json({ error: 'Error al obtener el producto.' });
  }
});

// ── POST /api/productos ───────────────────────────────────────────────────────
// Body: { nombre_producto, id_categoria_fk, id_proveedor_fk,
//         fecha_entrada, precio_neto, precio_venta, stock }
router.post('/', async (req, res) => {
  const {
    nombre_producto, id_categoria_fk, id_proveedor_fk,
    fecha_entrada, precio_neto, precio_venta, stock = 0,
  } = req.body;

  if (!nombre_producto || !id_categoria_fk || !id_proveedor_fk ||
      !fecha_entrada    || precio_neto === undefined || precio_venta === undefined) {
    return res.status(400).json({
      error: 'Campos requeridos: nombre_producto, id_categoria_fk, id_proveedor_fk, fecha_entrada, precio_neto, precio_venta.',
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [prodResult] = await conn.query(
      `INSERT INTO producto
         (id_proveedor_fk, id_categoria_fk, nombre_producto, fecha_entrada, precio_neto, precio_venta)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_proveedor_fk, id_categoria_fk, nombre_producto,
       fecha_entrada, parseFloat(precio_neto), parseFloat(precio_venta)]
    );
    const newId = prodResult.insertId;

    // Crear registro en inventario
    await conn.query(
      'INSERT INTO inventario (id_producto_fk, cantidad) VALUES (?, ?)',
      [newId, parseInt(stock)]
    );

    await conn.commit();

    const [rows] = await db.query(BASE_SELECT + ' WHERE p.id_producto = ?', [newId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('[PRODUCTOS] POST /:', err);
    res.status(500).json({ error: 'Error al crear el producto.' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/productos/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const {
    nombre_producto, id_categoria_fk, id_proveedor_fk,
    fecha_entrada, precio_neto, precio_venta, stock,
  } = req.body;

  if (!nombre_producto || !id_categoria_fk || !id_proveedor_fk ||
      !fecha_entrada    || precio_neto === undefined || precio_venta === undefined) {
    return res.status(400).json({
      error: 'Campos requeridos: nombre_producto, id_categoria_fk, id_proveedor_fk, fecha_entrada, precio_neto, precio_venta.',
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [upd] = await conn.query(
      `UPDATE producto SET
         id_proveedor_fk = ?, id_categoria_fk = ?, nombre_producto = ?,
         fecha_entrada = ?, precio_neto = ?, precio_venta = ?
       WHERE id_producto = ?`,
      [id_proveedor_fk, id_categoria_fk, nombre_producto,
       fecha_entrada, parseFloat(precio_neto), parseFloat(precio_venta),
       req.params.id]
    );

    if (upd.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    // Actualizar inventario si se envió stock
    if (stock !== undefined) {
      await conn.query(
        `INSERT INTO inventario (id_producto_fk, cantidad) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE cantidad = ?`,
        [req.params.id, parseInt(stock), parseInt(stock)]
      );
    }

    await conn.commit();

    const [rows] = await db.query(BASE_SELECT + ' WHERE p.id_producto = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('[PRODUCTOS] PUT /:id:', err);
    res.status(500).json({ error: 'Error al actualizar el producto.' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/productos/:id → borrado lógico ────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE producto SET activo = 0 WHERE id_producto = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ ok: true, message: 'Producto eliminado.' });
  } catch (err) {
    console.error('[PRODUCTOS] DELETE /:id:', err);
    res.status(500).json({ error: 'Error al eliminar el producto.' });
  }
});

module.exports = router;
