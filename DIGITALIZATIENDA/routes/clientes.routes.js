const router = require('express').Router();
const db     = require('../config/db');

// GET /api/clientes
router.get('/', async (req, res) => {
  const { buscar = '' } = req.query;
  let sql = 'SELECT * FROM clientes WHERE 1=1';
  const params = [];
  if (buscar) {
    sql += ' AND (nombre LIKE ? OR identificacion LIKE ? OR email LIKE ?)';
    params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  }
  sql += ' ORDER BY id_cliente DESC';
  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[CLIENTES] GET /:', err);
    res.status(500).json({ error: 'Error al obtener clientes.' });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes WHERE id_cliente = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cliente.' });
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  const { nombre, identificacion, email, telefono, direccion } = req.body;
  if (!nombre || !identificacion)
    return res.status(400).json({ error: 'Nombre e identificación son requeridos.' });
  try {
    const [r] = await db.query(
      'INSERT INTO clientes (nombre, identificacion, email, telefono, direccion) VALUES (?,?,?,?,?)',
      [nombre.trim(), identificacion.trim(), email || null, telefono || null, direccion || null]
    );
    const [rows] = await db.query('SELECT * FROM clientes WHERE id_cliente = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'La identificación ya está registrada.' });
    console.error('[CLIENTES] POST /:', err);
    res.status(500).json({ error: 'Error al crear cliente.' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  const { nombre, identificacion, email, telefono, direccion } = req.body;
  if (!nombre || !identificacion)
    return res.status(400).json({ error: 'Nombre e identificación son requeridos.' });
  try {
    const [upd] = await db.query(
      'UPDATE clientes SET nombre=?, identificacion=?, email=?, telefono=?, direccion=? WHERE id_cliente=?',
      [nombre.trim(), identificacion.trim(), email || null, telefono || null, direccion || null, req.params.id]
    );
    if (upd.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });
    const [rows] = await db.query('SELECT * FROM clientes WHERE id_cliente = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cliente.' });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM clientes WHERE id_cliente = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'No se puede eliminar: tiene facturas asociadas.' });
    res.status(500).json({ error: 'Error al eliminar cliente.' });
  }
});

module.exports = router;
