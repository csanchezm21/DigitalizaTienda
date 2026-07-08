const router = require('express').Router();
const db     = require('../config/db');

// GET /api/proveedores
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pr.*, COUNT(p.id_producto) AS total_productos
      FROM proveedor pr
      LEFT JOIN producto p ON p.id_proveedor_fk = pr.id_proveedor AND p.activo = 1
      GROUP BY pr.id_proveedor
      ORDER BY pr.nombre_proveedor
    `);
    res.json(rows);
  } catch (err) {
    console.error('[PROV] GET /:', err);
    res.status(500).json({ error: 'Error al obtener proveedores.' });
  }
});

// POST /api/proveedores
router.post('/', async (req, res) => {
  const { nombre_proveedor, numero_contacto } = req.body;
  if (!nombre_proveedor) return res.status(400).json({ error: 'El nombre es requerido.' });
  try {
    const [r] = await db.query(
      'INSERT INTO proveedor (nombre_proveedor, numero_contacto) VALUES (?, ?)',
      [nombre_proveedor.trim(), numero_contacto || null]
    );
    const [rows] = await db.query('SELECT * FROM proveedor WHERE id_proveedor = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear proveedor.' });
  }
});

// PUT /api/proveedores/:id
router.put('/:id', async (req, res) => {
  const { nombre_proveedor, numero_contacto } = req.body;
  if (!nombre_proveedor) return res.status(400).json({ error: 'El nombre es requerido.' });
  try {
    const [upd] = await db.query(
      'UPDATE proveedor SET nombre_proveedor = ?, numero_contacto = ? WHERE id_proveedor = ?',
      [nombre_proveedor.trim(), numero_contacto || null, req.params.id]
    );
    if (upd.affectedRows === 0) return res.status(404).json({ error: 'Proveedor no encontrado.' });
    const [rows] = await db.query('SELECT * FROM proveedor WHERE id_proveedor = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proveedor.' });
  }
});

// DELETE /api/proveedores/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM proveedor WHERE id_proveedor = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Proveedor no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'No se puede eliminar: tiene productos asociados.' });
    res.status(500).json({ error: 'Error al eliminar proveedor.' });
  }
});

module.exports = router;
