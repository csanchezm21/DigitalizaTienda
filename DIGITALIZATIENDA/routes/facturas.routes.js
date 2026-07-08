const router = require('express').Router();
const db     = require('../config/db');
const { enviarFactura } = require('../config/email.js');

const BASE_SELECT = `
  SELECT
    f.id_factura,
    f.id_inventario_fk,
    f.identificacion_cliente,
    f.metodode_pago,
    f.fecha_compra,
    f.email_cliente,
    c.id_cliente,
    c.nombre  AS nombre_cliente,
    p.nombre_producto,
    p.id_producto,
    p.precio_venta,
    p.precio_neto,
    dv.id_detalle,
    dv.cantidad_vendida,
    dv.cantidad_perdida,
    dv.cantidad_neta,
    dv.fechas AS fecha_detalle
  FROM factura f
  INNER JOIN inventario i ON i.id_inventario = f.id_inventario_fk
  INNER JOIN producto p   ON p.id_producto   = i.id_producto_fk
  LEFT  JOIN clientes c   ON c.identificacion = f.identificacion_cliente
  LEFT  JOIN detalle_venta dv ON dv.id_factura_fk = f.id_factura
`;

// GET /api/facturas
router.get('/', async (req, res) => {
  const { producto } = req.query;
  let sql = BASE_SELECT;
  const params = [];
  if (producto) { sql += ' WHERE p.id_producto = ?'; params.push(producto); }
  sql += ' ORDER BY f.id_factura DESC';
  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[FAC] GET /:', err);
    res.status(500).json({ error: 'Error al obtener facturas.' });
  }
});

// GET /api/facturas/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(BASE_SELECT + ' WHERE f.id_factura = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Factura no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener factura.' });
  }
});

// POST /api/facturas  — crea factura + detalle + descuenta inventario + envía email
router.post('/', async (req, res) => {
  const {
    id_inventario_fk, identificacion_cliente, metodode_pago,
    fecha_compra, email_cliente,
    cantidad_vendida = 0, cantidad_perdida = 0,
  } = req.body;

  if (!id_inventario_fk || !identificacion_cliente || !metodode_pago || !fecha_compra)
    return res.status(400).json({ error: 'Faltan campos requeridos.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar stock
    const [[inv]] = await conn.query('SELECT cantidad FROM inventario WHERE id_inventario = ?', [id_inventario_fk]);
    if (!inv) { await conn.rollback(); return res.status(404).json({ error: 'Inventario no encontrado.' }); }
    if (inv.cantidad < cantidad_vendida)
      { await conn.rollback(); return res.status(400).json({ error: `Stock insuficiente. Disponible: ${inv.cantidad}` }); }

    // Crear factura
    const [fac] = await conn.query(
      'INSERT INTO factura (id_inventario_fk, identificacion_cliente, metodode_pago, fecha_compra, email_cliente) VALUES (?,?,?,?,?)',
      [id_inventario_fk, identificacion_cliente.trim(), metodode_pago, fecha_compra, email_cliente || null]
    );
    const id_factura = fac.insertId;

    // Crear detalle
    await conn.query(
      'INSERT INTO detalle_venta (id_factura_fk, cantidad_vendida, cantidad_perdida, fechas) VALUES (?,?,?,?)',
      [id_factura, parseInt(cantidad_vendida), parseInt(cantidad_perdida), fecha_compra]
    );

    // Descontar inventario
    await conn.query(
      'UPDATE inventario SET cantidad = cantidad - ? WHERE id_inventario = ?',
      [parseInt(cantidad_vendida) + parseInt(cantidad_perdida), id_inventario_fk]
    );

    await conn.commit();

    // Traer factura completa
    const [rows] = await db.query(BASE_SELECT + ' WHERE f.id_factura = ?', [id_factura]);
    const factura = rows[0];

    // Enviar email si hay destinatario
    const emailDest = email_cliente || factura?.email_cliente;
    if (emailDest) {
      try {
        await enviarFactura(factura, emailDest);
        factura._email_enviado = true;
      } catch (emailErr) {
        console.warn('[FAC] Email no enviado:', emailErr.message);
        factura._email_enviado = false;
        factura._email_error   = emailErr.message;
      }
    }

    res.status(201).json(factura);
  } catch (err) {
    await conn.rollback();
    console.error('[FAC] POST /:', err);
    res.status(500).json({ error: 'Error al crear factura.' });
  } finally {
    conn.release();
  }
});

// POST /api/facturas/:id/email  — reenvía el correo de una factura existente
router.post('/:id/email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido.' });
  try {
    const [rows] = await db.query(BASE_SELECT + ' WHERE f.id_factura = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Factura no encontrada.' });
    await enviarFactura(rows[0], email);
    res.json({ ok: true, message: `Factura enviada a ${email}` });
  } catch (err) {
    console.error('[FAC] Reenvío email:', err);
    res.status(500).json({ error: `Error al enviar email: ${err.message}` });
  }
});

// DELETE /api/facturas/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM factura WHERE id_factura = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar factura.' });
  }
});

module.exports = router;
